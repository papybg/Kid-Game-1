import { db } from "./db";
import { portals, gameItems, gameLayouts } from "../shared/schema";
import { eq, inArray, notInArray } from "drizzle-orm";

// Helper функциите остават същите...
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
function selectRandom<T>(array: T[], count: number): T[] {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, count);
}

// Интерфейсите остават същите...
type Cell = (typeof gameLayouts.$inferSelect)['slots_desktop'][number];
type Item = typeof gameItems.$inferSelect;
type Layout = typeof gameLayouts.$inferSelect;

export interface GameSession {
  cells: Cell[];
  items: Item[];
  levelType: 'equals_cells' | 'cells_plus_two';
  layout: Layout;
}

export async function generateGameSession(portalId: string, deviceType: 'desktop' | 'mobile' = 'desktop', gameMode: 'simple' | 'advanced' = 'simple'): Promise<GameSession> {
  const portal = await db.query.portals.findFirst({ where: eq(portals.id, portalId) });
  if (!portal) throw new Error(`Portal with id ${portalId} not found`);

  const layout = await db.query.gameLayouts.findFirst({ where: eq(gameLayouts.id, portal.layouts[0]) });
  if (!layout) throw new Error(`Layout not found for portal ${portalId}`);

  // Select slots based on device type
  const slots = deviceType === 'mobile' ? layout.slots_mobile : layout.slots_desktop;
  if (!slots) throw new Error(`Slots not found for device ${deviceType} in portal ${portalId}`);

  // Get all available items first
  const allItems = await db.select().from(gameItems);

  // Calculate how many cells we can actually support based on available items
  let maxPossibleCells = 0;
  const indexCounts: Record<string, number> = {};

  // Count items per index
  allItems.forEach(item => {
    indexCounts[item.index] = (indexCounts[item.index] || 0) + 1;
  });

  // Calculate maximum cells we can support (each cell needs at least one item)
  slots.forEach(slot => {
    const maxItemsForSlot = Math.max(...slot.index.map(idx => indexCounts[idx] || 0));
    if (maxItemsForSlot > 0) {
      maxPossibleCells++;
    }
  });

  // Limit cell count to what's actually possible
  const targetCellCount = Math.floor(Math.random() * (portal.max_cells - portal.min_cells + 1)) + portal.min_cells;
  const actualCellCount = Math.min(targetCellCount, maxPossibleCells, portal.max_cells);

  // Ensure we have at least min_cells if possible
  const finalCellCount = Math.max(actualCellCount, Math.min(portal.min_cells, maxPossibleCells));

  if (finalCellCount === 0) {
    throw new Error('No valid cells can be created - not enough items for any slot indices');
  }

  // Select cells that have available items
  const validSlots = slots.filter(slot =>
    slot.index.some(idx => (indexCounts[idx] || 0) > 0)
  );

  const selectedCells = selectRandom(validSlots, finalCellCount);
  const requiredIndices = [...new Set(selectedCells.flatMap(cell => cell.index))];

  // Get items for required indices
  const correctItemsPool = allItems.filter(item => requiredIndices.includes(item.index));

  // Select correct items for each cell (guaranteed to have at least one per cell)
  const selectedCorrectItems: Item[] = [];
  const usedItemIds = new Set<number>();

  for (const cell of selectedCells) {
    const matchingItems = correctItemsPool.filter(item =>
      cell.index.includes(item.index) && !usedItemIds.has(item.id)
    );

    if (matchingItems.length > 0) {
      const randomItem = selectRandom(matchingItems, 1)[0];
      selectedCorrectItems.push(randomItem);
      usedItemIds.add(randomItem.id);
    } else {
      // Fallback: allow reusing items if we run out (shouldn't happen with proper validation)
      const fallbackItems = correctItemsPool.filter(item => cell.index.includes(item.index));
      if (fallbackItems.length > 0) {
        const randomItem = selectRandom(fallbackItems, 1)[0];
        selectedCorrectItems.push(randomItem);
        usedItemIds.add(randomItem.id);
      }
    }
  }

  // Calculate total items needed
  const totalItemCount = gameMode === 'advanced' ? 8 : 6;
  const neededConfusing = Math.max(0, totalItemCount - selectedCorrectItems.length);

  // Add confusing items from remaining items
  let confusingItems: Item[] = [];
  if (neededConfusing > 0) {
    const availableConfusingItems = allItems.filter(item => !usedItemIds.has(item.id));
    confusingItems = selectRandom(availableConfusingItems, Math.min(neededConfusing, availableConfusingItems.length));
  }

  // If we still don't have enough items, fill with any remaining items (allow duplicates in extreme cases)
  const finalItems = [...selectedCorrectItems, ...confusingItems];
  if (finalItems.length < totalItemCount) {
    const remainingNeeded = totalItemCount - finalItems.length;
    const additionalItems = selectRandom(allItems, remainingNeeded);
    finalItems.push(...additionalItems);
  }

  const shuffledItems = shuffleArray(finalItems);

  return {
    cells: selectedCells,
    items: shuffledItems,
    levelType: gameMode === 'advanced' ? 'cells_plus_two' : 'equals_cells',
    layout: layout,
  };
}