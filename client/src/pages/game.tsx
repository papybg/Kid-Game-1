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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [disappearingItems, setDisappearingItems] = useState<Set<number>>(new Set());
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null);
  const [animatingItem, setAnimatingItem] = useState<{item: GameItem, targetPosition: {top: number, left: number}} | null>(null);
  const [isAnimationInProgress, setIsAnimationInProgress] = useState(false);
  const choiceZoneRef = useRef<HTMLDivElement>(null);
  const [choiceZoneHeight, setChoiceZoneHeight] = useState(131);
  
  const { soundEnabled, setSoundEnabled, playSound, playVoice, playAnimalSound, isAudioPlaying, getSoundFile } = useAudioContext();
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
  } = useGameState({ cells: gameSession?.cells, items: gameSession?.items });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const requestFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
        }
      } catch (error) {
        console.warn('Could not enter fullscreen mode:', error);
      }
    };
    requestFullscreen();
  }, []);

  useLayoutEffect(() => {
    if (gameState.choiceItems.length > 0 && choiceZoneRef.current) {
      const maxHeight = Array.from(choiceZoneRef.current.children).reduce((max, child) => Math.max(max, (child as HTMLElement).getBoundingClientRect().height), 0);
      if (maxHeight > 0) setChoiceZoneHeight(Math.ceil(maxHeight * 1.02));
    }
  }, [gameState.choiceItems]);

  const toggleSound = () => setSoundEnabled(!soundEnabled);
  
  const activeSlot = gameState.availableSlots.length > 0 ? gameState.availableSlots[0] : null;

  useEffect(() => {
    if (isGameComplete && !isAnimationInProgress && !isAudioPlaying) {
      const winSound = getSoundFile('win');
      if (winSound) {
        winSound.onended = () => {
           setTimeout(onWin, 500);
        };
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

      setTimeout(() => {
        setDisappearingItems(prev => new Set(prev).add(itemToPlace.id));
        setAnimatingItem(null);
        setIsAnimationInProgress(false);

          if (isWinningMove) {
            playSound('bell');
            const finalAnimalSound = playAnimalSound(itemToPlace, 0); // Без delay за winning move
            if (finalAnimalSound) {
              finalAnimalSound.onended = () => makeChoice(itemToPlace, targetSlot, isSimpleMode);
            } else {
              setTimeout(() => makeChoice(itemToPlace, targetSlot, isSimpleMode), 1000);
            }
          } else {
            const isValid = makeChoice(itemToPlace, targetSlot, isSimpleMode);
            if (isValid) {
              playSound('bell');
              playAnimalSound(itemToPlace, 1000);
            }
          }        if (isSimpleMode) setSelectedItem(null);
      }, 1000);
    };

    if (gameMode === 'simple') {
      if (!selectedItem) {
        setSelectedItem(item);
        showFeedback('success', 'КЪДЕ ЩЕ СЛОЖИШ ТОВА');
      } else if (selectedItem.id === item.id) {
        const targetSlot = gameState.availableSlots.find(slot => isValidChoice(slot, item));
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
      if (!isValidChoice(activeSlot, item)) {
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
  
  // Поправка: Взимаме фоновете от gameLayouts, които се съдържат в gameSession.layout
  const backgroundUrl = isMobile ? gameSession?.layout?.backgroundSmall : gameSession?.layout?.backgroundLarge;

  return (
    <div className="fixed inset-0 z-30 w-screen h-screen">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500" style={{ backgroundImage: `url('${backgroundUrl}')` }}>
        <div className="absolute inset-0 bg-black/20"></div>
      </div>
      
      <div className="relative z-20 p-4 bg-gradient-to-b from-black/50 to-transparent">
        {/* ... Header UI ... */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onBackToMenu} className="w-12 h-12 glass rounded-xl hover:bg-white/20 text-white"><ArrowLeft className="w-5 h-5" /></Button>
          <div className="text-center text-white"><h1 className="font-display font-bold text-xl md:text-2xl">Игра</h1><div className="text-sm bg-white/20 backdrop-blur-sm rounded-full px-4 py-1 mt-2 inline-block">{gameState.isPlaying ? "Къде ще сложиш това" : "Натисни СТАРТ"}</div></div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={pauseGame} className="w-12 h-12 glass rounded-xl hover:bg-white/20 text-white transition-transform duration-200 hover:scale-110 active:scale-95">{gameState.isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}</Button>
            <Button variant="ghost" size="icon" onClick={toggleSound} className="w-12 h-12 glass rounded-xl hover:bg-white/20 text-white transition-transform duration-200 hover:scale-110 active:scale-95">{soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}</Button>
          </div>
        </div>
      </div>
      
      <div className="absolute inset-0 z-10 pointer-events-none">
        {gameSession && gameSession.cells.map((slot: Slot) => {
            const slotId = `${slot.position.top}-${slot.position.left}`;
            const placedItem = gameState.placedItems[slotId];
            const isActive = gameMode === 'advanced' && !isGameComplete && activeSlot && `${activeSlot.position.top}-${activeSlot.position.left}` === slotId;
            const shouldShow = gameMode === 'simple' || isGameComplete || !!placedItem || isActive;
            if (!shouldShow) return null;
            return <GameSlotComponent key={slotId} slot={slot} isCompleted={!!placedItem} placedItem={placedItem} isActive={isActive} className="pointer-events-auto" />;
        })}
      </div>
      
      <FeedbackMessageComponent feedback={feedback} />
      
      {gameState.isPaused && gameState.isPlaying && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center text-white">
            <Pause className="w-16 h-16 mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl font-bold mb-4">Играта е на пауза</h2>
            <Button onClick={pauseGame} className="bg-white text-primary font-bold py-3 px-8 rounded-2xl text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <Play className="w-6 h-6 mr-2" />
              ПРОДЪЛЖИ
            </Button>
          </div>
        </div>
      )}
      
      {!gameState.isPlaying && !isGameComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <Button onClick={handleStartTurn} className="bg-white text-primary font-bold py-6 px-16 rounded-3xl text-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 border-4 border-yellow-400 animate-pulse"><Play className="w-8 h-8 mr-4" />СТАРТ</Button>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/50 to-transparent pb-[calc(env(safe-area-inset-bottom)+16px)]">
        {(gameState.isPlaying || animatingItem) && !isGameComplete && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-4">
              <div ref={choiceZoneRef} className="choice-zone flex gap-3 overflow-x-auto pb-2" style={{ height: `${choiceZoneHeight}px` }}>
                {gameState.choiceItems.map((item) => (
                  <ChoiceItem key={item.id} item={item} isUsed={gameState.usedItems.includes(item.id)} isDisabled={isAudioPlaying} shouldDisappear={disappearingItems.has(item.id)} isSelected={selectedItem?.id === item.id} isAnimating={animatingItem?.item.id === item.id} targetPosition={animatingItem?.item.id === item.id ? animatingItem.targetPosition : undefined} onClick={handleChoiceClick} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="absolute top-20 left-4 right-4 z-20">
        {gameSession && (
          <div className="max-w-sm mx-auto bg-black/30 backdrop-blur-sm rounded-full p-2">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-yellow-400 h-2 rounded-full transition-all duration-500" style={{ width: `${((gameSession.cells.length - gameState.availableSlots.length) / gameSession.cells.length) * 100}%` }}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}