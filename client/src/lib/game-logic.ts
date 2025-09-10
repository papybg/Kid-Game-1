import type { GameItem, GameSlot } from '@shared/schema';

export function generateChoicePool(
  slots: GameSlot[],
  allItems: GameItem[],
  poolSize: number = 8
): GameItem[] {
  const correctItems = new Map<number, GameItem>();
  
  // Get correct items for each slot
  slots.forEach(slot => {
    slot.index.forEach(index => {
      const item = allItems.find(item => item.index === index);
      if (item && !correctItems.has(item.id)) {
        correctItems.set(item.id, item);
      }
    });
  });

  const correctItemsArray = Array.from(correctItems.values());
  const distractorCount = poolSize - correctItemsArray.length;
  
  // Get distractor items
  const possibleDistractors = allItems.filter(item => !correctItems.has(item.id));
  const shuffledDistractors = shuffleArray(possibleDistractors).slice(0, Math.max(0, distractorCount));
  
  return shuffleArray([...correctItemsArray, ...shuffledDistractors]);
}

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function calculateScore(
  timeSpent: number,
  mistakes: number = 0,
  baseScore: number = 100
): number {
  const timeBonus = Math.max(0, 60 - timeSpent); // Bonus for completing quickly
  const mistakePenalty = mistakes * 10;
  return Math.max(10, baseScore + timeBonus - mistakePenalty);
}

export function getStarRating(score: number): number {
  if (score >= 90) return 3;
  if (score >= 70) return 2;
  return 1;
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function isValidChoice(slot: GameSlot, item: GameItem): boolean {
  return slot.index.includes(item.index);
}

export function getRandomSlot(availableSlots: GameSlot[]): GameSlot | null {
  if (availableSlots.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * availableSlots.length);
  return availableSlots[randomIndex];
}
