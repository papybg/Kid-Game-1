import { useState, useCallback } from 'react';
import type { GameState, GameSlot, GameItem, Portal, GameLayout, FeedbackMessage } from '@shared/schema';

const initialGameState: GameState = {
  currentPortal: null,
  currentLayout: null,
  isPlaying: false,
  isPaused: false,
  availableSlots: [],
  choiceItems: [],
  usedItems: [],
  placedItems: {},
  score: 0,
  startTime: 0,
};

const initialFeedback: FeedbackMessage = {
  type: 'success',
  message: '',
  isVisible: false,
};

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [feedback, setFeedback] = useState<FeedbackMessage>(initialFeedback);

  const startGame = useCallback((portal: Portal, layout: GameLayout, items: GameItem[]) => {
    setGameState({
      currentPortal: portal,
      currentLayout: layout,
      isPlaying: false,
      isPaused: false,
      availableSlots: [...layout.slots],
      choiceItems: items,
      usedItems: [],
      placedItems: {},
      score: 0,
      startTime: Date.now(),
    });
  }, []);

  const startTurn = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
    }));
  }, []);

  const makeChoice = useCallback((item: GameItem): boolean => {
    const { availableSlots } = gameState;
    
    // Find a matching slot for this item (item-first logic)
    const matchingSlot = availableSlots.find(slot => slot.index.includes(item.index));
    
    if (!matchingSlot) return false;

    // Generate slot ID for tracking placement
    const slotId = `${matchingSlot.position.top}-${matchingSlot.position.left}`;

    setGameState(prev => {
      const newAvailableSlots = prev.availableSlots.filter(slot => slot !== matchingSlot);
      return {
        ...prev,
        usedItems: [...prev.usedItems, item.id],
        availableSlots: newAvailableSlots,
        placedItems: { ...prev.placedItems, [slotId]: item },
        score: prev.score + 10,
        // Auto-complete game when no more slots available
        isPlaying: newAvailableSlots.length > 0,
      };
    });

    return true;
  }, [gameState]);

  // Removed nextSlot - no longer needed with item-first logic

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setFeedback({ type, message, isVisible: true });
    setTimeout(() => {
      setFeedback(prev => ({ ...prev, isVisible: false }));
    }, 1200);
  }, []);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  }, []);

  const resetGame = useCallback(() => {
    setGameState(initialGameState);
    setFeedback(initialFeedback);
  }, []);

  const isGameComplete = gameState.startTime > 0 && gameState.availableSlots.length === 0 && !gameState.isPlaying;
  const timeElapsed = gameState.startTime ? Math.floor((Date.now() - gameState.startTime) / 1000) : 0;

  return {
    gameState,
    feedback,
    startGame,
    startTurn,
    makeChoice,
    showFeedback,
    pauseGame,
    resetGame,
    isGameComplete,
    timeElapsed,
  };
}
