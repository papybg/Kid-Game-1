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
import { fetchGameSession } from "../lib/api";
import { isValidChoice } from "../lib/game-logic";
import type { GameItem, GameSlot as Slot } from "@shared/schema";

interface GameProps {
  portalId: string;
  variantId?: string;
  onBackToMenu: () => void;
  onWin: () => void;
}

export default function Game({ portalId, variantId, onBackToMenu, onWin }: GameProps) {
  // Следим дали екранът е "пейзажен" (Landscape) - по-широк отколкото висок
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null);
  const [animatingItem, setAnimatingItem] = useState<{item: GameItem, targetPosition: {top: number, left: number}} | null>(null);
  const [isAnimationInProgress, setIsAnimationInProgress] = useState(false);
  
  const { soundEnabled, setSoundEnabled, playSound, playVoice, playItemSound, isAudioPlaying, getSoundFile } = useAudioContext();
  const { gameMode } = useSettingsStore();
  
  const { data: gameSession, isLoading: sessionLoading, error: sessionError } = useQuery({
    queryKey: ['gameSession', portalId, isMobile ? 'mobile' : 'desktop', gameMode, variantId],
    queryFn: () => fetchGameSession(portalId, isMobile ? 'mobile' : 'desktop', gameMode, variantId),
    enabled: !!portalId,
  });

  const {
    gameState,
    feedback,
    startTurn,
    makeChoice,
    showFeedback,
    pauseGame,
    isGameComplete,
    removeCurrentSlot,
    removeFromChoiceItems,
    placeItemInSlot,
    completeSlot,
  } = useGameState({ cells: gameSession?.cells, items: gameSession?.items, variantId });

  useEffect(() => {
    const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
        setIsLandscape(window.innerWidth > window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const requestFullscreen = async () => {
      try {
        if (!document.fullscreenElement && isMobile) {
           if (document.documentElement.requestFullscreen) {
               await document.documentElement.requestFullscreen().catch(() => {});
           }
        }
      } catch (error) { }
    };
    const handleInteraction = () => {
        requestFullscreen();
        window.removeEventListener('click', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    return () => window.removeEventListener('click', handleInteraction);
  }, [isMobile]);

  const toggleSound = () => setSoundEnabled(!soundEnabled);
  
  const activeSlot = gameState.availableSlots.length > 0 ? gameState.availableSlots[0] : null;

  useEffect(() => {
    if (isGameComplete && !isAnimationInProgress && !isAudioPlaying) {
      const winSound = getSoundFile('win');
      if (winSound) {
        winSound.onended = () => { setTimeout(onWin, 500); };
        winSound.play();
      } else {
        setTimeout(onWin, 2000);
      }
    }
  }, [isGameComplete, isAnimationInProgress, isAudioPlaying, onWin, getSoundFile]);

  const handleStartTurn = () => startTurn();

  const handleChoiceClick = (item: GameItem) => {
    if (gameState.usedItems.includes(item.id) || isAudioPlaying || isGameComplete || gameState.isPaused) return;
    playSound('click');

    const executePlacement = (itemToPlace: GameItem, targetSlot: Slot, isSimpleMode: boolean) => {
      const isWinningMove = gameState.availableSlots.length === 1;

      setAnimatingItem({ item: itemToPlace, targetPosition: { top: parseInt(targetSlot.position.top), left: parseInt(targetSlot.position.left) } });
      setIsAnimationInProgress(true);

      if (isWinningMove) {
        const slotId = `${targetSlot.position.top}-${targetSlot.position.left}`;
        removeFromChoiceItems(itemToPlace.id);
        placeItemInSlot(itemToPlace, slotId);
      }

      setTimeout(() => {
        setAnimatingItem(null);
        setIsAnimationInProgress(false);
          if (isWinningMove) {
            playSound('bell');
            const finalAnimalSound = playItemSound(itemToPlace, 0);
            if (finalAnimalSound) {
              finalAnimalSound.onended = () => {
                const slotId = `${targetSlot.position.top}-${targetSlot.position.left}`;
                completeSlot(slotId);
              };
            } else {
              setTimeout(() => {
                const slotId = `${targetSlot.position.top}-${targetSlot.position.left}`;
                completeSlot(slotId);
              }, 1000);
            }
          } else {
            const isValid = makeChoice(itemToPlace, targetSlot, isSimpleMode);
            if (isValid) {
              playSound('bell');
              playItemSound(itemToPlace, 1000);
            }
          }
        if (isSimpleMode) setSelectedItem(null);
      }, 1000);
    };

    if (gameMode === 'simple') {
      if (!selectedItem) {
        setSelectedItem(item);
        showFeedback('success', 'КЪДЕ ЩЕ СЛОЖИШ ТОВА');
      } else if (selectedItem.id === item.id) {
        const targetSlot = gameState.availableSlots.find(slot => isValidChoice(slot, item, variantId, gameState.availableSlots));
        if (!targetSlot) {
          showFeedback('error', 'Няма място за този предмет!');
          playVoice('tryAgain');
          setSelectedItem(null);
          return;
        }
        executePlacement(item, targetSlot, true);
      } else {
        setSelectedItem(item);
        showFeedback('success', 'КЪДЕ ЩЕ СЛОЖИШ ТОВА');
      }
    } else { // Advanced mode
      if (!activeSlot) {
        showFeedback('error', 'Няма активна клетка!');
        playVoice('tryAgain');
        return;
      }
      if (!isValidChoice(activeSlot, item, variantId, gameState.availableSlots)) {
        showFeedback('error', 'Опитай пак!');
        playVoice('tryAgain');
        return;
      }
      executePlacement(item, activeSlot, false);
      
      setTimeout(() => {
        if (gameState.isPlaying && !isGameComplete) {
          removeCurrentSlot(activeSlot);
        }
      }, 2000);
    }
  };

  if (sessionLoading) return ( <div className="fixed inset-0 z-30 flex items-center justify-center bg-background"><div className="text-center space-y-4"><LoadingSpinner size="lg" /><p className="text-muted-foreground">Зареждане на играта...</p></div></div> );
  if (sessionError) return ( <div className="fixed inset-0 z-30 flex items-center justify-center bg-background"><div className="text-center space-y-4"><p className="text-destructive">Грешка при зареждане на нивото</p>{sessionError && (<p className="text-sm text-muted-foreground">{sessionError instanceof Error ? sessionError.message : 'Unknown error'}</p>)}<Button onClick={onBackToMenu}>Назад към менюто</Button></div></div> );
  
  const backgroundUrl = isMobile ? gameSession?.layout?.backgroundSmall : gameSession?.layout?.backgroundLarge;

  // Логика за разделяне на предметите (за пейзажен режим)
  const midpoint = Math.ceil(gameState.choiceItems.length / 2);
  const leftItems = gameState.choiceItems.slice(0, midpoint);
  const rightItems = gameState.choiceItems.slice(midpoint);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-black">
      
      {/* BACKGROUND - Винаги покрива целия екран (bg-cover) */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0" 
        style={{ backgroundImage: `url('${backgroundUrl}')` }}
      />
      
      {/* TOP CONTROLS */}
      <div className="relative z-30 p-2 md:p-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onBackToMenu} className="w-10 h-10 md:w-12 md:h-12 glass rounded-xl hover:bg-white/20 text-white shadow-sm"><ArrowLeft className="w-5 h-5 md:w-6 md:h-6" /></Button>
          <div className="text-center text-white drop-shadow-md">
            <h1 className="font-display font-bold text-lg md:text-2xl shadow-black">Игра</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={pauseGame} className="w-10 h-10 md:w-12 md:h-12 glass rounded-xl hover:bg-white/20 text-white shadow-sm">{gameState.isPaused ? <Play className="w-5 h-5 md:w-6 md:h-6" /> : <Pause className="w-5 h-5 md:w-6 md:h-6" />}</Button>
            <Button variant="ghost" size="icon" onClick={toggleSound} className="w-10 h-10 md:w-12 md:h-12 glass rounded-xl hover:bg-white/20 text-white shadow-sm">{soundEnabled ? <Volume2 className="w-5 h-5 md:w-6 md:h-6" /> : <VolumeX className="w-5 h-5 md:w-6 md:h-6" />}</Button>
          </div>
        </div>
      </div>
      
      {/* SLOTS */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {gameSession && gameSession.cells.map((slot: Slot) => {
            const slotId = `${slot.position.top}-${slot.position.left}`;
            const placedItem = gameState.placedItems[slotId];
            const isActive = gameMode === 'advanced' && !isGameComplete && activeSlot && `${activeSlot.position.top}-${activeSlot.position.left}` === slotId ? true : false;
            const shouldShow = gameMode === 'simple' || isGameComplete || !!placedItem || isActive;
            if (!shouldShow) return null;
            return <GameSlotComponent key={slotId} slot={slot} isCompleted={!!placedItem} placedItem={placedItem} isActive={isActive} className="pointer-events-auto" />;
        })}
      </div>
      
      <FeedbackMessageComponent feedback={feedback} />
      
      {/* PAUSE & START OVERLAYS... */}
      {gameState.isPaused && gameState.isPlaying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center text-white">
            <Pause className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-80" />
            <h2 className="text-xl md:text-2xl font-bold mb-4">Играта е на пауза</h2>
            <Button onClick={pauseGame} className="bg-white text-primary font-bold py-3 px-8 rounded-2xl text-xl shadow-lg hover:scale-105 transition-transform">
              <Play className="w-6 h-6 mr-2" />
              ПРОДЪЛЖИ
            </Button>
          </div>
        </div>
      )}
      {!gameState.isPlaying && !isGameComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <Button onClick={handleStartTurn} className="bg-white text-primary font-bold py-4 px-12 md:py-6 md:px-16 rounded-3xl text-xl md:text-2xl shadow-2xl hover:scale-105 transition-transform border-4 border-yellow-400 animate-pulse">
                <Play className="w-6 h-6 md:w-8 md:h-8 mr-4" />СТАРТ
            </Button>
          </div>
        </div>
      )}

      {/* --- ITEMS LAYOUT LOGIC --- */}
      {(gameState.isPlaying || animatingItem) && !isGameComplete && (
         <>
            {/* 1. PORTRAIT MODE: Items at Bottom */}
            {!isLandscape && (
                <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none pb-[calc(env(safe-area-inset-bottom)+10px)]">
                    <div className="w-full flex justify-center pointer-events-auto">
                        <div className="flex gap-2 px-2 overflow-x-auto justify-center items-end no-scrollbar w-full">
                            {gameState.choiceItems.map((item) => (
                                <ChoiceItem 
                                    key={item.id} item={item} 
                                    isUsed={gameState.usedItems.includes(item.id)} isDisabled={isAudioPlaying} isSelected={selectedItem?.id === item.id} isAnimating={animatingItem?.item.id === item.id} targetPosition={animatingItem?.item.id === item.id ? animatingItem.targetPosition : undefined} onClick={handleChoiceClick} 
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. LANDSCAPE MODE: Split Left and Right */}
            {isLandscape && (
                <>
                    {/* LEFT COLUMN */}
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 md:gap-4 pointer-events-auto max-h-[80vh] overflow-y-auto no-scrollbar py-2">
                        {leftItems.map((item) => (
                             <ChoiceItem 
                                key={item.id} item={item} 
                                isUsed={gameState.usedItems.includes(item.id)} isDisabled={isAudioPlaying} isSelected={selectedItem?.id === item.id} isAnimating={animatingItem?.item.id === item.id} targetPosition={animatingItem?.item.id === item.id ? animatingItem.targetPosition : undefined} onClick={handleChoiceClick} 
                            />
                        ))}
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 md:gap-4 pointer-events-auto max-h-[80vh] overflow-y-auto no-scrollbar py-2">
                        {rightItems.map((item) => (
                             <ChoiceItem 
                                key={item.id} item={item} 
                                isUsed={gameState.usedItems.includes(item.id)} isDisabled={isAudioPlaying} isSelected={selectedItem?.id === item.id} isAnimating={animatingItem?.item.id === item.id} targetPosition={animatingItem?.item.id === item.id ? animatingItem.targetPosition : undefined} onClick={handleChoiceClick} 
                            />
                        ))}
                    </div>
                </>
            )}
         </>
      )}
      
      {/* PROGRESS BAR */}
      <div className="absolute top-14 md:top-20 left-0 right-0 z-20 pointer-events-none flex justify-center">
        {gameSession && (
          <div className="w-48 md:w-64 bg-black/30 backdrop-blur-sm rounded-full p-1 border border-white/10">
            <div className="w-full bg-white/10 rounded-full h-1.5 md:h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${((gameSession.cells.length - gameState.availableSlots.length) / gameSession.cells.length) * 100}%` }}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
