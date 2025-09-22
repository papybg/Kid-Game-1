import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { Button } from "../components/ui/button";
import { ArrowLeft, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "../components/ui/loading-spinner";
import { GameSlotComponent } from "../components/game/game-slot";
import { ChoiceItem } from "../components/game/choice-item";
import { FeedbackMessageComponent } from "../components/game/feedback-message";
import { useGameState } from "../hooks/use-game-state";
import { useAudioContext } from "../components/audio-manager";
import { useSettingsStore } from "../lib/settings-store";
import { generateChoicePool } from "../lib/game-logic";
import { fetchGameSession } from "../lib/api";
import type { Portal, GameLayout, GameItem } from "@shared/schema";

interface GameProps {
  portalId: string;
  onBackToMenu: () => void;
  onWin: () => void;
}

export default function Game({ portalId, onBackToMenu, onWin }: GameProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [previousPlacedItems, setPreviousPlacedItems] = useState<Record<string, GameItem>>({});
  const [disappearingItems, setDisappearingItems] = useState<Set<number>>(new Set()); // Track items that should disappear
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null); // Currently selected item for placement
  const [animatingItem, setAnimatingItem] = useState<{item: GameItem, targetPosition: {top: number, left: number}} | null>(null); // Item being animated
  const [isAnimationInProgress, setIsAnimationInProgress] = useState(false); // Track if animation is in progress
  const choiceZoneRef = useRef<HTMLDivElement>(null); // Ref for choice zone container
  const [choiceZoneHeight, setChoiceZoneHeight] = useState(131); // Dynamic height for choice zone
    const { soundEnabled, setSoundEnabled, playSound, playVoice, playAnimalSound, isAudioPlaying } = useAudioContext();
  
  // Get game mode from settings store
  const { gameMode } = useSettingsStore();
  
  const {
    gameState,
    feedback,
    startGame,
    startTurn,
    makeChoice,
    showFeedback,
    pauseGame,
    isGameComplete,
    timeElapsed,
    removeCurrentSlot,
  } = useGameState();

  // Fetch portal data
  const { data: portal, isLoading: portalLoading, error: portalError } = useQuery({
    queryKey: ['portals', portalId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3005/api/portals/${portalId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch portal');
      }
      return response.json();
    },
    enabled: !!portalId,
  });

  // Fetch game session data
  const { data: gameSession, isLoading: sessionLoading, error: sessionError } = useQuery({
    queryKey: ['gameSession', portalId],
    queryFn: () => fetchGameSession(portalId),
    enabled: !!portalId,
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Automatic fullscreen on level start
  useEffect(() => {
    const requestFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          } else if ((document.documentElement as any).webkitRequestFullscreen) {
            await (document.documentElement as any).webkitRequestFullscreen();
          } else if ((document.documentElement as any).mozRequestFullScreen) {
            await (document.documentElement as any).mozRequestFullScreen();
          } else if ((document.documentElement as any).msRequestFullscreen) {
            await (document.documentElement as any).msRequestFullscreen();
          }
        }
      } catch (error) {
        console.warn('Could not enter fullscreen mode:', error);
      }
    };

    // Request fullscreen when the game component mounts (level starts)
    requestFullscreen();
  }, []); // Empty dependency array means this runs once when component mounts

  // Dynamic choice zone height calculation
  useLayoutEffect(() => {
    if (gameState.choiceItems.length > 0 && choiceZoneRef.current) {
      const container = choiceZoneRef.current;
      const itemElements = container.children;

      if (itemElements.length > 0) {
        let maxHeight = 0;

        // Measure each item's actual rendered height
        for (let i = 0; i < itemElements.length; i++) {
          const itemElement = itemElements[i] as HTMLElement;
          const itemHeight = itemElement.getBoundingClientRect().height;
          maxHeight = Math.max(maxHeight, itemHeight);
        }

        if (maxHeight > 0) {
          // Set height to 102% of the maximum item height
          const newHeight = Math.ceil(maxHeight * 1.02);
          setChoiceZoneHeight(newHeight);
        }
      }
    }
  }, [gameState.choiceItems]);

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const activeSlot = gameState.availableSlots.length > 0 ? gameState.availableSlots[0] : null;

  useEffect(() => {
    if (portal && gameSession) {
      // Use the cells and items from game session
      const choiceItems = gameSession.items;
      // For layout, we'll need to get it from the cells or create a mock layout
      // For now, create a simple layout from the cells
      const mockLayout: GameLayout = {
        id: portal.layouts[0],
        name: 'Game Layout',
        backgroundLarge: '/images/backgrounds/dolina-large.png',
        backgroundSmall: '/images/backgrounds/dolina-small.png',
        slots: gameSession.cells,
        createdAt: new Date(),
      };
      
      startGame(portal, mockLayout, choiceItems);
    }
  }, [gameSession, portal, startGame]);

  // Play animal sound when item enters cell - only for correct choices
  useEffect(() => {
    const newItems = Object.keys(gameState.placedItems).filter(key => !previousPlacedItems[key]);
    newItems.forEach(key => {
      const item = gameState.placedItems[key];
      if (item) {
        // Animal sound is already handled in handleChoiceClick, no need to duplicate
        // playAnimalSound(item.name, 1000); // Removed to prevent audio overlap
      }
    });
    setPreviousPlacedItems({ ...gameState.placedItems });
  }, [gameState.placedItems]);

  useEffect(() => {
    if (isGameComplete && !isAnimationInProgress && !isAudioPlaying) {
      playSound('win');
      // Show WIN screen after win sound plays
      setTimeout(() => {
        onWin();
      }, 2000);
    }
  }, [isGameComplete, isAnimationInProgress, isAudioPlaying, onWin, playSound]);

  const handleStartTurn = () => {
    // Remove automatic start sound - let the game flow naturally
    startTurn();
  };

  const handleChoiceClick = (item: GameItem) => {
    if (gameState.usedItems.includes(item.id) || isAudioPlaying) return;

    playSound('click');

    if (gameMode === 'simple') {
      // Simple mode: Item-first logic with double-click
      if (!selectedItem) {
        // First click - select the item
        setSelectedItem(item);
        showFeedback('success', 'КЪДЕ ЩЕ СЛОЖИШ ТОВА');
        // Remove bravo voice from simple mode (2+)
      } else if (selectedItem.id === item.id) {
        // Second click on the same item - place it
        const targetSlot = gameState.availableSlots.find(slot =>
          slot.index.includes(item.index)
        );

        if (!targetSlot) {
          showFeedback('error', 'Няма място за този предмет!');
          playVoice('tryAgain');
          setSelectedItem(null);
          return;
        }

        // Start animation to target position
        setAnimatingItem({
          item,
          targetPosition: {
            top: parseInt(targetSlot.position.top),
            left: parseInt(targetSlot.position.left)
          }
        });
        setIsAnimationInProgress(true);

        // Mark item for disappearing animation after animation completes
        setTimeout(() => {
          setDisappearingItems(prev => new Set([...prev, item.id]));
          setAnimatingItem(null);
          setIsAnimationInProgress(false);

          // Place the item
          const isValid = makeChoice(item, targetSlot, true);

          if (isValid) {
            playSound('bell');
            setTimeout(() => {
              playAnimalSound(item.name);
            }, 1000);
          }

          // Clear selection
          setSelectedItem(null);
        }, 1000); // Wait for animation to complete
      } else {
        // Clicked on different item - select the new one
        setSelectedItem(item);
        showFeedback('success', 'КЪДЕ ЩЕ СЛОЖИШ ТОВА');
        // Remove bravo voice from simple mode (2+)
      }
    } else {
      // Advanced mode: Slot-first logic with single-click
      if (!activeSlot) {
        showFeedback('error', 'Няма активна клетка!');
        playVoice('tryAgain');
        return;
      }

      // Check if the item matches the active slot
      if (!activeSlot.index.includes(item.index)) {
        showFeedback('error', 'Опитай пак!');
        playVoice('tryAgain');
        return;
      }

      // Start animation to target position
      setAnimatingItem({
        item,
        targetPosition: {
          top: parseInt(activeSlot.position.top),
          left: parseInt(activeSlot.position.left)
        }
      });
      setIsAnimationInProgress(true);

      // Mark item for disappearing animation after animation completes
      setTimeout(() => {
        setDisappearingItems(prev => new Set([...prev, item.id]));
        setAnimatingItem(null);
        setIsAnimationInProgress(false);

        // Place the item
        const isValid = makeChoice(item, activeSlot, false);

        if (isValid) {
          showFeedback('success', 'Браво!');
          playVoice('bravo');
          playSound('bell');
          setTimeout(() => {
            playAnimalSound(item.name);
          }, 1000);
          
          // Move to next slot after successful placement
          setTimeout(() => {
            if (gameState.isPlaying) {
              removeCurrentSlot(activeSlot);
            }
          }, 2000);
        }
      }, 1000); // Wait for animation to complete
    }
  };

  if (portalLoading || sessionLoading) {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Зареждане на играта...</p>
        </div>
      </div>
    );
  }

  if (portalError || sessionError) {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive">Грешка при зареждане на нивото</p>
          {(portalError || sessionError) && (
            <p className="text-sm text-muted-foreground">
              {(portalError instanceof Error ? portalError.message : '') || (sessionError instanceof Error ? sessionError.message : 'Unknown error')}
            </p>
          )}
          <Button onClick={onBackToMenu}>Назад към менюто</Button>
        </div>
      </div>
    );
  }

  const backgroundUrl = isMobile ? '/images/backgrounds/dolina-small.png' : '/images/backgrounds/dolina-large.png';

  return (
    <div className="fixed inset-0 z-30 w-screen h-screen">
      {/* Game Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500"
        style={backgroundUrl ? { backgroundImage: `url('${backgroundUrl}')` } : {}}
      >
        <div className="absolute inset-0 bg-black/20"></div>
      </div>
      
      {/* Game Header */}
      <div className="relative z-20 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBackToMenu}
            className="w-12 h-12 glass rounded-xl hover:bg-white/20 text-white"
            data-testid="button-back-to-menu"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="text-center text-white">
            <h1 className="font-display font-bold text-xl md:text-2xl">{portal!.portalName}</h1>
            <div className="text-sm bg-white/20 backdrop-blur-sm rounded-full px-4 py-1 mt-2 inline-block">
              {gameState.isPlaying
                ? "Къде ще сложиш това"
                : "Натисни СТАРТ за да започнеш!"
              }
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={pauseGame}
              className="w-12 h-12 glass rounded-xl hover:bg-white/20 text-white"
              data-testid="button-pause"
            >
              {gameState.isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSound}
              className="w-12 h-12 glass rounded-xl hover:bg-white/20 text-white"
              data-testid="button-sound-toggle"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Game Slots Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Game slots rendering based on game mode */}
        {gameState.isPlaying && gameSession && (
          <>
            {gameMode === 'simple' ? (
              // Simple mode: Show ALL slots from the start
              gameSession.cells.map((slot: any) => {
                const slotId = `${slot.position.top}-${slot.position.left}`;
                const isSlotActive = activeSlot && 
                  activeSlot.position.top === slot.position.top && 
                  activeSlot.position.left === slot.position.left ? true : false;
                const placedItem = gameState.placedItems[slotId];

                return (
                  <GameSlotComponent
                    key={slotId}
                    slot={slot}
                    isActive={isSlotActive}
                    isCompleted={!!placedItem}
                    placedItem={placedItem}
                    className="pointer-events-auto"
                  />
                );
              })
            ) : (
              // Advanced mode: Show only active slot
              activeSlot && (
                <GameSlotComponent
                  key={`${activeSlot.position.top}-${activeSlot.position.left}`}
                  slot={activeSlot}
                  isActive={true}
                  className="pointer-events-auto"
                />
              )
            )}

            {/* Placed items (filled slots) - shown in both modes */}
            {Object.entries(gameState.placedItems).map(([slotId, item]) => {
              // Find the original slot definition for positioning
              const [top, left] = slotId.split('-');
              const originalSlot = gameSession.cells.find((s: any) => s.position.top === top && s.position.left === left);
              
              if (!originalSlot) return null;
              
              return (
                <GameSlotComponent
                  key={`filled-${slotId}`}
                  slot={originalSlot}
                  isCompleted={true}
                  placedItem={item}
                  className="pointer-events-auto"
                />
              );
            })}
          </>
        )}
      </div>
      
      {/* Feedback Messages */}
      <FeedbackMessageComponent feedback={feedback} />
      
      {/* Floating START Button */}
      {!gameState.isPlaying && !isGameComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <Button
              onClick={handleStartTurn}
              className="bg-white text-primary font-bold py-6 px-16 rounded-3xl text-2xl transition-all duration-200 shadow-2xl hover:shadow-3xl transform hover:scale-105 border-4 border-yellow-400 animate-pulse"
              data-testid="button-start-turn"
            >
              <Play className="w-8 h-8 mr-4" />
              СТАРТ
            </Button>
          </div>
        </div>
      )}

      {/* Game Complete - Show WIN Button */}
      {false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto text-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold text-green-600 mb-4">🎉 ПОБЕДА! 🎉</h2>
              <p className="text-lg text-gray-700 mb-6">Завърши успешно играта!</p>
              <Button
                onClick={onWin}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-2xl text-xl"
              >
                Продължи
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Game Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/50 to-transparent pb-[calc(env(safe-area-inset-bottom)+16px)]">
        
        {/* Choice Zone - show for all modes */}
        {gameState.isPlaying && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">
                  
                </span>
                <div className="flex gap-2">
                </div>
              </div>
              <div 
                ref={choiceZoneRef}
                className="choice-zone flex gap-3 overflow-x-auto pb-2"
                style={{
                  height: `${choiceZoneHeight}px`,
                  width: `calc(${(gameState.choiceItems.length * 128) + ((gameState.choiceItems.length - 1) * 12)}px * 1.02)`
                }}
              >
                {gameState.choiceItems.map((item) => (
                  <ChoiceItem
                    key={item.id}
                    item={item}
                    isUsed={gameState.usedItems.includes(item.id)}
                    isDisabled={isAudioPlaying}
                    shouldDisappear={disappearingItems.has(item.id)}
                    isSelected={selectedItem?.id === item.id}
                    isAnimating={animatingItem?.item.id === item.id}
                    targetPosition={animatingItem?.item.id === item.id ? animatingItem.targetPosition : undefined}
                    onClick={handleChoiceClick}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className="absolute top-20 left-4 right-4 z-20">
        <div className="max-w-sm mx-auto bg-black/30 backdrop-blur-sm rounded-full p-2">
          <div className="flex items-center justify-between text-white text-sm mb-1">
            <span></span>
            <span></span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
              style={{
              width: `${((gameSession!.cells.length - gameState.availableSlots.length) / gameSession!.cells.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
