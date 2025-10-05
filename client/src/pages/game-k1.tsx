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
import { isValidChoice } from "../lib/game-logic";
import type { GameItem, GameSlot as Slot, GameSession } from "@shared/schema";

interface GameK1Props {
  portalId: string;
  variantId: string; // Always 'k1' for this component
  onBackToMenu: () => void;
  onComplete: () => void;
}

type GamePhase = 'playing' | 'complete';

export default function GameK1({ portalId, variantId, onBackToMenu, onComplete }: GameK1Props) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [gamePhase, setGamePhase] = useState<GamePhase>('playing'); // Start directly in playing phase
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0); // Index of currently active slot
  const [placedItems, setPlacedItems] = useState<Record<string, GameItem>>({}); // slotId -> item
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);
  
  const { soundEnabled, setSoundEnabled, playSound, playVoice, playItemSound, isAudioPlaying, getSoundFile } = useAudioContext();
  
  const { data: gameSession, isLoading: sessionLoading, error: sessionError } = useQuery({
    queryKey: ['gameSessionK1', portalId, isMobile ? 'mobile' : 'desktop', variantId],
    queryFn: () => fetchGameSession(portalId, isMobile ? 'mobile' : 'desktop', 'simple', variantId),
    enabled: !!portalId,
  });

  // Request fullscreen when component mounts
  useEffect(() => {
    const requestFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (error) {
        console.log('Fullscreen request failed:', error);
      }
    };
    
    requestFullscreen();
  }, []);

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

  const handleItemClick = (item: GameItem) => {
    if (isAudioPlaying || completedItems.has(item.id) || gamePhase !== 'playing') return;
    
    if (!gameSession?.cells || activeSlotIndex >= gameSession.cells.length) return;

    const activeSlot = gameSession.cells[activeSlotIndex];
    
    // Use same validation logic as original game
    if (!isValidChoice(activeSlot, item, variantId)) {
      displayFeedback('Опитай пак!');
      playVoice('tryAgain');
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
    
    // Check if this is the last slot
    const isLastSlot = activeSlotIndex >= gameSession.cells.length - 1;
    
    if (isLastSlot) {
      // Last item - play audio then complete game
      const itemAudio = playItemSound(item, 0);
      
      if (itemAudio) {
        itemAudio.onended = () => {
          // Пусни win sound
          const winSound = getSoundFile('win');
          if (winSound) {
            winSound.play();
          }
          
          // Покажи Game Over екрана
          setGamePhase('complete');
        };
      } else {
        // Fallback без audio
        const winSound = getSoundFile('win');
        if (winSound) {
          winSound.play();
        }
        
        setTimeout(() => setGamePhase('complete'), 500);
      }
    } else {
      // Not last item - play audio then move to next slot
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
    }
  };

  const moveToNextSlot = () => {
    if (!gameSession?.cells) return;

    const nextIndex = activeSlotIndex + 1;
    
    if (nextIndex < gameSession.cells.length) {
      setActiveSlotIndex(nextIndex);
    }
  };

  // Simplified win effect - just wait for game complete phase
  useEffect(() => {
    if (gamePhase === 'complete') {
      const timer = setTimeout(() => {
        onComplete();
      }, 4000); // По-дълъг delay за да се чуе win sound-а
      
      return () => clearTimeout(timer);
    }
  }, [gamePhase, onComplete]);

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
        className="absolute inset-0 bg-contain bg-center bg-no-repeat"
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
        {gamePhase === 'playing' && (
          <>
            {/* Game Slots - Show only active slot like in original game */}
            <div className="absolute inset-0">
              {availableCells.map((slot, index) => {
                const slotId = `${slot.position.top}-${slot.position.left}`;
                const placedItem = placedItems[slotId];
                const isActive = index === activeSlotIndex;
                
                // Same logic as original game - show only if active or has item
                const shouldShow = !!placedItem || isActive;
                if (!shouldShow) return null;
                
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
                Браво! Успех!
              </h1>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Message */}
      {showFeedback && (
        <FeedbackMessageComponent
          feedback={{
            type: 'error',
            message: feedbackMessage,
            isVisible: showFeedback
          }}
        />
      )}
    </div>
  );
}