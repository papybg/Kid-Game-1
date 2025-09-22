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
  activeSlotIndex: 0, // Нова променлива за активната клетка
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
    // Shuffle the slots to randomize their order
    const shuffledSlots = [...layout.slots].sort(() => Math.random() - 0.5);
    
    const newState = {
      currentPortal: portal,
      currentLayout: layout,
      isPlaying: false,
      isPaused: false,
      availableSlots: shuffledSlots,
      choiceItems: items,
      usedItems: [],
      placedItems: {},
      score: 0,
      startTime: Date.now(),
      activeSlotIndex: 0,
    };
    setGameState(newState);
    try {
      localStorage.setItem('gameState', JSON.stringify(newState));
    } catch (e) {
      console.error('Failed to save game state:', e);
    }
  }, []);

  const startTurn = useCallback(() => {
    setGameState(prev => {
      // Don't start if game is already complete
      if (prev.availableSlots.length === 0) return prev;
      
      return {
        ...prev,
        isPlaying: true,
      };
    });
  }, []);

  const makeChoice = useCallback((item: GameItem, activeSlot: GameSlot | null, removeSlotImmediately: boolean = true): boolean => {
    if (!activeSlot) return false;
    
    // Check if the item matches the ACTIVE slot only (not any available slot)
    if (!activeSlot.index.includes(item.index)) {
      return false; // Item doesn't match the active slot
    }

    // Generate slot ID for tracking placement
    const slotId = `${activeSlot.position.top}-${activeSlot.position.left}`;

    setGameState(prev => {
      const newAvailableSlots = removeSlotImmediately ? prev.availableSlots.filter(slot => slot !== activeSlot) : prev.availableSlots;
      const newState = {
        ...prev,
        usedItems: [...prev.usedItems, item.id],
        availableSlots: newAvailableSlots,
        placedItems: { ...prev.placedItems, [slotId]: item },
        score: prev.score + 10,
        // Keep playing until all slots are filled
        isPlaying: newAvailableSlots.length > 0,
      };
      
      try {
        localStorage.setItem('gameState', JSON.stringify(newState));
      } catch (e) {
        console.error('Failed to save game state:', e);
      }
      
      return newState;
    });

    return true;
  }, []);

  const nextSlot = useCallback(() => {
    setGameState(prev => {
      if (prev.availableSlots.length === 0) return prev;
      
      const nextIndex = (prev.activeSlotIndex + 1) % prev.availableSlots.length;
      const newState = {
        ...prev,
        activeSlotIndex: nextIndex,
      };
      
      try {
        localStorage.setItem('gameState', JSON.stringify(newState));
      } catch (e) {
        console.error('Failed to save game state:', e);
      }
      
      return newState;
    });
  }, []);

  const previousSlot = useCallback(() => {
    setGameState(prev => {
      if (prev.availableSlots.length === 0) return prev;
      
      const prevIndex = prev.activeSlotIndex === 0 
        ? prev.availableSlots.length - 1 
        : prev.activeSlotIndex - 1;
      const newState = {
        ...prev,
        activeSlotIndex: prevIndex,
      };
      
      try {
        localStorage.setItem('gameState', JSON.stringify(newState));
      } catch (e) {
        console.error('Failed to save game state:', e);
      }
      
      return newState;
    });
  }, []);

  const removeCurrentSlot = useCallback((slotToRemove: GameSlot) => {
    setGameState(prev => {
      const newAvailableSlots = prev.availableSlots.filter(slot => slot !== slotToRemove);
      const newState = {
        ...prev,
        availableSlots: newAvailableSlots,
        // Keep playing until all slots are filled
        isPlaying: newAvailableSlots.length > 0,
      };
      
      try {
        localStorage.setItem('gameState', JSON.stringify(newState));
      } catch (e) {
        console.error('Failed to save game state:', e);
      }
      
      return newState;
    });
  }, []);

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

  const isGameComplete = gameState.startTime > 0 && gameState.availableSlots.length === 0 && !gameState.isPlaying && Object.keys(gameState.placedItems).length > 0;
  const timeElapsed = gameState.startTime ? Math.floor((Date.now() - gameState.startTime) / 1000) : 0;

  return {
    gameState,
    feedback,
    startGame,
    startTurn,
    makeChoice,
    nextSlot,
    previousSlot,
    removeCurrentSlot,
    showFeedback,
    pauseGame,
    resetGame,
    isGameComplete,
    timeElapsed,
    activeSlotIndex: gameState.activeSlotIndex,
  };
}
