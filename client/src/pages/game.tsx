import { useEffect, useState } from "react";
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
import type { Portal, GameLayout, GameItem } from "@shared/schema";

interface GameProps {
  portal: Portal;
  onBackToMenu: () => void;
  onWin: () => void;
}

export default function Game({ portal, onBackToMenu, onWin }: GameProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [previousPlacedItems, setPreviousPlacedItems] = useState<Record<string, GameItem>>({});
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

  // Fetch layout data
  const { data: layout, isLoading: layoutLoading, error: layoutError } = useQuery<GameLayout>({
    queryKey: ['api/layouts', portal.layouts[0]],
    enabled: !!portal?.layouts?.[0],
    retry: 2,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Fetch game items
  const { data: allItems, isLoading: itemsLoading, error: itemsError } = useQuery<GameItem[]>({
    queryKey: ['api/game-items'],
    retry: 2,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeSlot = gameState.availableSlots.length > 0 ? gameState.availableSlots[0] : null;
  const filteredChoiceItems = gameState.isPlaying && activeSlot 
    ? gameState.choiceItems.filter(item => activeSlot.index.includes(item.index))
    : [];

  useEffect(() => {
    if (layout && allItems) {
      const choiceItems = generateChoicePool(layout.slots, allItems);
      startGame(portal, layout, choiceItems);
      // Remove automatic start sound when game initializes
    }
  }, [layout, allItems, portal, startGame]);

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
    if (isGameComplete) {
      playSound('win');
      setTimeout(() => {
        onWin();
      }, 4500); // Increased from 1500ms to 4500ms to allow time for all sounds
    }
  }, [isGameComplete, gameState.score, timeElapsed, onWin, playSound]);

  const handleStartTurn = () => {
    // Remove automatic start sound - let the game flow naturally
    startTurn();
  };

  const handleChoiceClick = (item: GameItem) => {
    if (gameState.usedItems.includes(item.id) || isAudioPlaying || !activeSlot) return;

    playSound('click');
    const isValid = makeChoice(item, activeSlot, false); // Don't remove slot immediately

    if (isValid) {
      showFeedback('success', 'Браво!');

      // Play "BRAВО" voice first, then animal sound after 2 seconds delay (reduced from 3)
      playVoice('bravo');
      setTimeout(() => {
        playAnimalSound(item.name);
        // Wait for animal sound to finish before moving to next slot
        setTimeout(() => {
          // Remove the current slot and move to next one
          removeCurrentSlot(activeSlot);
        }, 2500); // Wait 2.5 seconds for animal sound to finish
      }, 2000); // Reduced from 3000 to 2000

    } else {
      showFeedback('error', 'Опитай пак!');
      playVoice('tryAgain');
      // For wrong choices, don't play animal sound - just the voice feedback
    }
  };  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  if (layoutLoading || itemsLoading) {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Зарежда играта...</p>
        </div>
      </div>
    );
  }

  if (layoutError || itemsError || !layout) {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive">Грешка при зареждане на нивото</p>
          {(layoutError || itemsError) && (
            <p className="text-sm text-muted-foreground">
              {layoutError?.message || itemsError?.message}
            </p>
          )}
          <Button onClick={onBackToMenu}>Назад към менюто</Button>
        </div>
      </div>
    );
  }

  const backgroundUrl = isMobile ? layout.backgroundSmall : layout.backgroundLarge;

  return (
    <div className="fixed inset-0 z-30">
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
            <h1 className="font-display font-bold text-xl md:text-2xl">{portal.name}</h1>
            <div className="text-sm bg-white/20 backdrop-blur-sm rounded-full px-4 py-1 mt-2 inline-block">
              {gameState.isPlaying
                ? "Какво ще поставиш тук"
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
        {gameState.isPlaying && layout && (
          <>
            {gameMode === 'simple' ? (
              // Simple mode: Show ALL slots from the start
              layout.slots.map((slot) => {
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
              const originalSlot = layout.slots.find(s => s.position.top === top && s.position.left === left);
              
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

      {/* Game Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/50 to-transparent pb-[calc(env(safe-area-inset-bottom)+16px)]">
        
        {/* Choice Zone */}
        {gameState.isPlaying && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">
                  Избери правилния предмет
                </span>
                <div className="flex gap-2">
                </div>
              </div>
              <div className="choice-zone flex gap-3 overflow-x-auto pb-2">
                {gameState.choiceItems.map((item) => (
                  <ChoiceItem
                    key={item.id}
                    item={item}
                    isUsed={gameState.usedItems.includes(item.id)}
                    isDisabled={isAudioPlaying}
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
                width: `${((layout.slots.length - gameState.availableSlots.length) / layout.slots.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
