import type { GameItem, GameSlot } from '@shared/schema';

export function generateChoicePool(
  slots: GameSlot[],
  allItems: GameItem[],
  poolSize?: number
): GameItem[] {
  const itemsForSlots = new Map<string, GameItem[]>();

  // Group items by their index
  allItems.forEach(item => {
    if (!itemsForSlots.has(item.index)) {
      itemsForSlots.set(item.index, []);
    }
    itemsForSlots.get(item.index)!.push(item);
  });

  const resultItems: GameItem[] = [];
  const usedItems = new Set<number>(); // Track used item IDs to prevent duplicates

  // For each slot, pick exactly one unique item that matches its index
  slots.forEach(slot => {
    // Find the first available index for this slot that has unused items
    let selectedItem: GameItem | null = null;
    for (const index of slot.index) {
      const availableItems = itemsForSlots.get(index) || [];
      // Filter out already used items
      const unusedItems = availableItems.filter(item => !usedItems.has(item.id));

      if (unusedItems.length > 0) {
        // Pick a random unused item from available items for this index
        selectedItem = unusedItems[Math.floor(Math.random() * unusedItems.length)];
        usedItems.add(selectedItem.id); // Mark as used
        break; // Take the first matching index
      }
    }

    if (selectedItem) {
      resultItems.push(selectedItem);
    } else {
      // If no unused item found for this slot, pick a random unused item from all available items
      const allAvailableItems = Array.from(itemsForSlots.values()).flat();
      const unusedAllItems = allAvailableItems.filter(item => !usedItems.has(item.id));

      if (unusedAllItems.length > 0) {
        const randomItem = unusedAllItems[Math.floor(Math.random() * unusedAllItems.length)];
        resultItems.push(randomItem);
        usedItems.add(randomItem.id); // Mark as used
      } else {
        // If all items are used, allow duplicates as last resort
        const allItemsFlat = Array.from(itemsForSlots.values()).flat();
        if (allItemsFlat.length > 0) {
          const randomItem = allItemsFlat[Math.floor(Math.random() * allItemsFlat.length)];
          resultItems.push(randomItem);
          // Don't mark as used since we're allowing duplicates
        }
      }
    }
  });

  // Shuffle the result
  return shuffleArray(resultItems);
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
