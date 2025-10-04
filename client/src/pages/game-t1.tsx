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

interface GameT1Props {
  portalId: string;
  variantId: string; // Always 't1' for this component
  onBackToMenu: () => void;
  onComplete: () => void;
}

type GamePhase = 'start' | 'playing' | 'complete';

export default function GameT1({ portalId, variantId, onBackToMenu, onComplete }: GameT1Props) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [gamePhase, setGamePhase] = useState<GamePhase>('playing'); // Start directly in playing phase
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null);
  const [placedItems, setPlacedItems] = useState<Record<string, GameItem>>({}); // cellId -> item
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);
  
  const { soundEnabled, setSoundEnabled, playSound, playItemSound, isAudioPlaying } = useAudioContext();
  
  const { data: gameSession, isLoading: sessionLoading, error: sessionError } = useQuery({
    queryKey: ['gameSessionT1', portalId, isMobile ? 'mobile' : 'desktop', variantId],
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
    displayFeedback('Избери обект!', 3000);
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

  const handleStartGame = () => {
    playSound('click');
    setGamePhase('playing');
    displayFeedback('Избери обект!');
  };

  const handleItemClick = (item: GameItem) => {
    if (isAudioPlaying || completedItems.has(item.id) || !gameSession?.solution || gamePhase !== 'playing') return;
    
    console.log('Item clicked:', item.name); // Debug log
    
    // If this item is already selected, place it
    if (selectedItem?.id === item.id) {
      playSound('click');
      // Place item in correct cell immediately
      if (gameSession.solution) {
        const targetCellId = gameSession.solution[item.id];
        if (targetCellId) {
          placeItemInCell(item, targetCellId);
        }
      }
    } else {
      // First click - just select the item
      playSound('click');
      setSelectedItem(item);
      displayFeedback('Кликни отново за да поставиш!');
    }
  };

  const placeItemInCell = (item: GameItem, cellId: string) => {
    console.log('Placing item:', item.name, 'in cell:', cellId); // Debug log
    
    // Convert cellId to slotId format (position-based)
    const targetCell = gameSession?.cells.find((cell: any) => cell.id === cellId);
    if (!targetCell) return;
    
    const slotId = `${targetCell.position.top}-${targetCell.position.left}`;
    
    // Place item in cell
    setPlacedItems(prev => ({ ...prev, [slotId]: item }));
    setSelectedItem(null);
    
    // Play item sound immediately without bell overlap
    console.log('Playing sound for:', item.name, 'Audio path:', item.audio); // Debug log
    const itemAudio = playItemSound(item, 0); // No delay to avoid sound overlap
    
    if (itemAudio) {
      console.log('Audio object created successfully');
      itemAudio.onended = () => {
        console.log('Audio ended for:', item.name);
        setCompletedItems(prev => new Set([...prev, item.id]));
        checkGameComplete();
      };
    } else {
      console.log('No audio object returned');
      // Fallback if no audio - same timing as game.tsx
      setTimeout(() => {
        setCompletedItems(prev => new Set([...prev, item.id]));
        checkGameComplete();
      }, 2000); // Longer timeout to account for potential audio
    }
  };

  const checkGameComplete = () => {
    if (!gameSession || !gameSession.solution) return;
    
    // Check if all correct items are placed by checking placedItems count vs solution count
    const solutionCount = Object.keys(gameSession.solution).length;
    const placedCount = Object.keys(placedItems).length;
    
    if (placedCount >= solutionCount) {
      setTimeout(() => {
        playSound('bell');
        setGamePhase('complete');
        displayFeedback('Браво! Играта завърши!', 3000);
        setTimeout(() => onComplete(), 3000);
      }, 500);
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
        {gamePhase === 'playing' && (
          <>
            {/* Game Slots */}
            <div className="absolute inset-0">
              {availableCells.map((slot) => {
                const slotId = `${slot.position.top}-${slot.position.left}`;
                const placedItem = placedItems[slotId];
                return (
                  <GameSlotComponent
                    key={slotId}
                    slot={slot}
                    placedItem={placedItem}
                    isActive={false}
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
                      isSelected={selectedItem?.id === item.id}
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
              <h1 className="text-4xl font-bold text-white mb-8 drop-shadow-lg">
                🎉 Браво! 🎉
              </h1>
              <p className="text-xl text-white mb-8 drop-shadow-lg">
                Завърши успешно tutorial-a!
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