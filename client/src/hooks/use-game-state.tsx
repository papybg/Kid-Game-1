import React from 'react';
import { isValidChoice } from '../lib/game-logic';
import type { GameItem, GameSlot as Slot } from '@shared/schema';

interface UseGameStateProps {
  cells: Slot[] | undefined;
  items: GameItem[] | undefined;
}

interface GameState {
  hasStarted: boolean; // <-- НОВО СЪСТОЯНИЕ
  isPlaying: boolean;
  isPaused: boolean;
  isGameComplete: boolean;
  placedItems: Record<string, GameItem>;
  usedItems: number[];
  availableSlots: Slot[];
  choiceItems: GameItem[];
  feedback: { type: 'success' | 'error'; message: string; isVisible: boolean } | null;
  timeElapsed: number;
}

export function useGameState({ cells, items }: UseGameStateProps) {
  const [gameState, setGameState] = React.useState<GameState>({
    hasStarted: false, // <-- ИНИЦИАЛИЗАЦИЯ
    isPlaying: false,
    isPaused: false,
    isGameComplete: false,
    placedItems: {},
    usedItems: [],
    availableSlots: [],
    choiceItems: [],
    feedback: null,
    timeElapsed: 0,
  });

  const availableSlots = React.useMemo(() => {
    if (!cells) return [];
    return cells.filter(slot => !gameState.placedItems[`${slot.position.top}-${slot.position.left}`]);
  }, [cells, gameState.placedItems]);
  
  const startGame = React.useCallback(() => {
    if (!cells || !items) return;

    setGameState({
      hasStarted: true, // <-- МАРКИРАМЕ, ЧЕ ИГРАТА Е СТАРТИРАЛА
      isPlaying: false,
      isPaused: false,
      isGameComplete: false,
      placedItems: {},
      usedItems: [],
      availableSlots: [...cells],
      choiceItems: [...items],
      feedback: null,
      timeElapsed: 0,
    });
  }, [cells, items]);

  React.useEffect(() => {
    // Рестартираме играта само когато се смени 'cells' масива (т.е. зареди се ново ниво)
    startGame();
  }, [cells]);

  const startTurn = React.useCallback(() => {
    setGameState(prev => ({ ...prev, isPlaying: true }));
  }, []);
  
  const pauseGame = React.useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const showFeedback = React.useCallback((type: 'success' | 'error', message: string) => {
    setGameState(prev => ({ ...prev, feedback: { type, message, isVisible: true } }));
    setTimeout(() => setGameState(prev => ({ ...prev, feedback: null })), 2000);
  }, []);

  const makeChoice = React.useCallback((item: GameItem, slot: Slot, isSimpleMode: boolean) => {
    const slotId = `${slot.position.top}-${slot.position.left}`;
    const isValid = isValidChoice(slot, item);

    if (isValid) {
      setGameState(prev => {
        const newPlacedItems = { ...prev.placedItems, [slotId]: item };
        const newUsedItems = [...prev.usedItems, item.id];
        const newAvailableSlots = prev.availableSlots.filter(s => `${s.position.top}-${s.position.left}` !== slotId);
        
        // КОРЕКЦИЯ: Проверяваме за победа само ако играта е вече стартирала
        const isComplete = prev.hasStarted && newAvailableSlots.length === 0;

        return {
          ...prev,
          placedItems: newPlacedItems,
          usedItems: newUsedItems,
          availableSlots: newAvailableSlots,
          isGameComplete: isComplete,
          isPlaying: !isComplete,
        };
      });
    }
    return isValid;
  }, []);

  const removeCurrentSlot = React.useCallback((slot: Slot) => {
      const slotId = `${slot.position.top}-${slot.position.left}`;
      setGameState(prev => ({
          ...prev,
          availableSlots: prev.availableSlots.filter(s => `${s.position.top}-${s.position.left}` !== slotId)
      }));
  }, []);

  return {
    gameState: { ...gameState, availableSlots },
    feedback: gameState.feedback,
    startGame,
    startTurn,
    makeChoice,
    showFeedback,
    pauseGame,
    isGameComplete: gameState.isGameComplete,
    timeElapsed: gameState.timeElapsed,
    removeCurrentSlot,
  };
}