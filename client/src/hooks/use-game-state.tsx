import { useState, useCallback, useEffect } from 'react';
import type { GameState, GameSlot, GameItem, Portal, GameLayout, FeedbackMessage } from '@shared/schema';

// Load saved state from localStorage
const loadSavedState = (): GameState | null => {
  try {
    const saved = localStorage.getItem('gameState');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load saved game state:', e);
  }
  return null;
};

const initialGameState: GameState = loadSavedState() || {
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
    const newState = {
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
    };
    setGameState(newState);
    try {
      localStorage.setItem('gameState', JSON.stringify(newState));
    } catch (e) {
      console.error('Failed to save game state:', e);
    }
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
      const newState = {
        ...prev,
        usedItems: [...prev.usedItems, item.id],
        availableSlots: prev.availableSlots.filter(slot => slot !== matchingSlot),
        placedItems: { ...prev.placedItems, [slotId]: item },
        score: prev.score + 10,
        isPlaying: prev.availableSlots.length > 1, // Keep playing if more than 1 slot (current one will be removed)
      };
      
      try {
        localStorage.setItem('gameState', JSON.stringify(newState));
      } catch (e) {
        console.error('Failed to save game state:', e);
      }
      
      return newState;
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
    localStorage.removeItem('gameState');
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
