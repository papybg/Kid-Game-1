import { useEffect, useState, useRef } from "react";
import { Button } from "../components/ui/button";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "../components/ui/loading-spinner";
import { GameSlotComponent } from "../components/game/game-slot";
import { ChoiceItem } from "../components/game/choice-item";
import { FeedbackMessageComponent } from "../components/game/feedback-message";
import { useAudioContext } from "../components/audio-manager";
import { fetchGameSession } from "../lib/api";
import type { GameItem, GameSlot as Slot, GameSession } from "@shared/schema";

interface GameK1Props {
  portalId: string;
  variantId: string; // Always 'k1' for this component
  onBackToMenu: () => void;
  onComplete: () => void;
}

type GamePhase = 'start' | 'playing' | 'complete';

export default function GameK1({ portalId, variantId, onBackToMenu, onComplete }: GameK1Props) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [gamePhase, setGamePhase] = useState<GamePhase>('start');
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0); // Index of currently active slot
  const [placedItems, setPlacedItems] = useState<Record<string, GameItem>>({}); // slotId -> item
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);
  
  const { soundEnabled, setSoundEnabled, playSound, playItemSound, isAudioPlaying, getSoundFile } = useAudioContext();
  
  const { data: gameSession, isLoading: sessionLoading, error: sessionError } = useQuery({
    queryKey: ['gameSessionK1', portalId, isMobile ? 'mobile' : 'desktop', variantId],
    queryFn: () => fetchGameSession(portalId, isMobile ? 'mobile' : 'desktop', 'simple', variantId),
    enabled: !!portalId,
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const displayFeedback = (message: string, duration: number = 2000) => {
    setFeedbackMessage(message);
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), duration);
  };

  const handleStartGame = () => {
    playSound('click');
    setGamePhase('playing');
    displayFeedback('Избери обект за първата клетка!', 3000);
  };

  // K1 Logic: Check if item can be placed in currently active slot
  const canPlaceItemInActiveSlot = (item: GameItem): { canPlace: boolean; reason?: string } => {
    if (!gameSession?.cells || activeSlotIndex >= gameSession.cells.length) {
      return { canPlace: false, reason: 'Няма активна клетка' };
    }

    const activeSlot = gameSession.cells[activeSlotIndex];
    const itemIndex = item.index || '';
    const slotIndices = activeSlot.index || [];

    // Get first letter of item
    const itemFirstLetter = itemIndex.charAt(0);
    
    // Check if first letter matches any slot index
    const hasFirstLetterMatch = slotIndices.some(slotIdx => slotIdx.charAt(0) === itemFirstLetter);
    
    if (!hasFirstLetterMatch) {
      return { canPlace: false, reason: 'Първата буква не съвпада' };
    }

    // If item has only one letter, accept it
    if (itemIndex.length === 1) {
      return { canPlace: true };
    }

    // If item has two letters, check for exact match first
    const hasExactMatch = slotIndices.includes(itemIndex);
    if (hasExactMatch) {
      return { canPlace: true };
    }

    // If no exact match, check if there's another slot with exact match for this item
    const hasOtherExactMatch = gameSession.cells.some((slot, index) => 
      index !== activeSlotIndex && slot.index.includes(itemIndex)
    );

    if (hasOtherExactMatch) {
      return { canPlace: false, reason: 'Има по-подходяща клетка за този обект' };
    }

    // If no other exact match exists, accept based on first letter
    return { canPlace: true };
  };

  const handleItemClick = (item: GameItem) => {
    if (isAudioPlaying || completedItems.has(item.id) || gamePhase !== 'playing') return;
    
    const { canPlace, reason } = canPlaceItemInActiveSlot(item);
    
    if (!canPlace) {
      playSound('error');
      displayFeedback(reason || 'Не може да се постави тук!');
      return;
    }

    // Place item in active slot
    placeItemInActiveSlot(item);
  };

  const placeItemInActiveSlot = (item: GameItem) => {
    if (!gameSession?.cells || activeSlotIndex >= gameSession.cells.length) return;

    const activeSlot = gameSession.cells[activeSlotIndex];
    const slotId = `${activeSlot.position.top}-${activeSlot.position.left}`;
    
    // Place item in active slot
    setPlacedItems(prev => ({ ...prev, [slotId]: item }));
    setCompletedItems(prev => new Set([...prev, item.id]));
    
    // Play item sound
    const itemAudio = playItemSound(item, 0);
    
    if (itemAudio) {
      itemAudio.onended = () => {
        moveToNextSlot();
      };
    } else {
      // Fallback if no audio
      setTimeout(() => {
        moveToNextSlot();
      }, 1000);
    }
  };

  const moveToNextSlot = () => {
    if (!gameSession?.cells) return;

    const nextIndex = activeSlotIndex + 1;
    
    if (nextIndex >= gameSession.cells.length) {
      // Game complete
      setTimeout(() => {
        setGamePhase('complete');
        displayFeedback('Браво! Играта завърши!', 3000);
        
        // Use win sound file like in main game
        const winSound = getSoundFile('win');
        if (winSound) {
          winSound.onended = () => {
            setTimeout(() => onComplete(), 500);
          };
          winSound.play();
        } else {
          setTimeout(() => onComplete(), 2000);
        }
      }, 500);
    } else {
      // Move to next slot
      setActiveSlotIndex(nextIndex);
      displayFeedback(`Избери обект за клетка ${nextIndex + 1}!`);
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (sessionError || !gameSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Грешка при зареждането</h2>
          <Button onClick={onBackToMenu}>Обратно към менюто</Button>
        </div>
      </div>
    );
  }

  const backgroundImage = isMobile ? gameSession.layout.backgroundSmall : gameSession.layout.backgroundLarge;
  const availableItems = gameSession.items.filter(item => !completedItems.has(item.id));
  const availableCells = isMobile ? [] : gameSession.cells; // Use desktop cells for now

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${backgroundImage})`
        }}
      />
      
      {/* Top Controls */}
      <div className="relative z-10 flex justify-between items-center p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBackToMenu}
          className="bg-white/80 backdrop-blur-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Обратно
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="bg-white/80 backdrop-blur-sm"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Game Area */}
      <div className="relative z-10 w-full h-full">
        {gamePhase === 'start' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-8 drop-shadow-lg">
                K1 Mode - Последователно запълване
              </h1>
              <Button
                size="lg"
                onClick={handleStartGame}
                className="bg-green-500 hover:bg-green-600 text-white text-xl px-8 py-4"
              >
                Старт
              </Button>
            </div>
          </div>
        )}

        {gamePhase === 'playing' && (
          <>
            {/* Game Slots */}
            <div className="absolute inset-0">
              {availableCells.map((slot, index) => {
                const slotId = `${slot.position.top}-${slot.position.left}`;
                const placedItem = placedItems[slotId];
                const isActive = index === activeSlotIndex;
                return (
                  <GameSlotComponent
                    key={slotId}
                    slot={slot}
                    placedItem={placedItem}
                    isActive={isActive}
                    isCompleted={!!placedItem}
                  />
                );
              })}
            </div>

            {/* Choice Items */}
            <div className="absolute left-0 right-0 p-4" style={{ bottom: '50px' }}>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4" style={{ paddingTop: '3px', paddingBottom: '3px' }}>
                <div className="flex flex-wrap gap-4 justify-center">
                  {availableItems.map((item) => (
                    <ChoiceItem
                      key={item.id}
                      item={item}
                      isSelected={false}
                      isDisabled={isAudioPlaying}
                      onClick={() => handleItemClick(item)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {gamePhase === 'complete' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-6">🎉</div>
              <h1 className="text-5xl font-bold text-yellow-400 mb-4 drop-shadow-lg animate-bounce">
                GAME OVER
              </h1>
              <h2 className="text-3xl font-bold text-white mb-8 drop-shadow-lg">
                Браво! Успех!
              </h2>
              <p className="text-xl text-white mb-8 drop-shadow-lg">
                Завърши успешно K1 режима!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Message */}
      {showFeedback && (
        <FeedbackMessageComponent
          feedback={{
            type: 'success',
            message: feedbackMessage,
            isVisible: showFeedback
          }}
        />
      )}
    </div>
  );
}