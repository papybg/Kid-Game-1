import { useState, useCallback } from 'react';
import type { GameState, GameSlot, GameItem, Portal, GameLayout, FeedbackMessage } from '@shared/schema';

const initialGameState: GameState = {
  currentPortal: null,
  currentLayout: null,
  isPlaying: false,
  isPaused: false,
  availableSlots: [],
  activeSlot: null,
  choiceItems: [],
  usedItems: [],
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
      activeSlot: null,
      choiceItems: items,
      usedItems: [],
      score: 0,
      startTime: Date.now(),
    });
  }, []);

  const startTurn = useCallback(() => {
    setGameState(prev => {
      if (prev.availableSlots.length === 0) return prev;

      const randomIndex = Math.floor(Math.random() * prev.availableSlots.length);
      const activeSlot = prev.availableSlots[randomIndex];

      return {
        ...prev,
        isPlaying: true,
        activeSlot,
      };
    });
  }, []);

  const makeChoice = useCallback((item: GameItem): boolean => {
    const { activeSlot } = gameState;
    if (!activeSlot) return false;

    const isValid = activeSlot.index.includes(item.index);

    if (isValid) {
      setGameState(prev => ({
        ...prev,
        usedItems: [...prev.usedItems, item.id],
        availableSlots: prev.availableSlots.filter(slot => slot !== activeSlot),
        activeSlot: null,
        score: prev.score + 10,
      }));
    }

    return isValid;
  }, [gameState]);

  const nextSlot = useCallback(() => {
    setGameState(prev => {
      if (prev.availableSlots.length === 0) {
        return {
          ...prev,
          isPlaying: false,
          activeSlot: null,
        };
      }

      const randomIndex = Math.floor(Math.random() * prev.availableSlots.length);
      const activeSlot = prev.availableSlots[randomIndex];

      return {
        ...prev,
        activeSlot,
      };
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
  }, []);

  const isGameComplete = gameState.availableSlots.length === 0 && !gameState.isPlaying;
  const timeElapsed = gameState.startTime ? Math.floor((Date.now() - gameState.startTime) / 1000) : 0;

  return {
    gameState,
    feedback,
    startGame,
    startTurn,
    makeChoice,
    nextSlot,
    showFeedback,
    pauseGame,
    resetGame,
    isGameComplete,
    timeElapsed,
  };
}
