import { db } from "./db";
import { portals, gameItems, gameLayouts } from "../shared/schema";
import { eq } from "drizzle-orm";

// Helper function for random selection
function selectRandom<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Helper function for shuffling array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export interface GameSession {
  cells: any[]; // Selected cells from layout
  items: any[]; // Selected and shuffled items
  levelType: 'equals_cells' | 'cells_plus_two';
}

export async function generateGameSession(portalId: string): Promise<GameSession> {
  // 1. Get portal settings
  const portalResult = await db.select().from(portals).where(eq(portals.id, portalId));
  if (portalResult.length === 0) {
    throw new Error(`Portal with id ${portalId} not found`);
  }
  const portal = portalResult[0];

  // 2. Generate random cell count
  const sessionCellCount = Math.floor(Math.random() * (portal.max_cells - portal.min_cells + 1)) + portal.min_cells;

  // 3. Get all available cells from layout
  const layoutResult = await db.select().from(gameLayouts).where(eq(gameLayouts.id, portal.layouts[0]));
  if (layoutResult.length === 0) {
    throw new Error(`Layout not found for portal ${portalId}`);
  }
  const layout = layoutResult[0];

  // 4. Select random cells
  const selectedCells = selectRandom(layout.slots, sessionCellCount);

  // 5. Calculate item count based on rule
  const itemCount = portal.item_count_rule === 'cells_plus_two'
    ? sessionCellCount + 2
    : sessionCellCount;

  // 6. Get all game items
  const allItems = await db.select().from(gameItems);

  // 7. Select correct items (items that match selected cells)
  // For now, we'll select random items that correspond to the cell indices
  const cellIndices = selectedCells.flatMap(cell => cell.index);
  const correctItems = allItems.filter(item => cellIndices.includes(item.index));

  // If we don't have enough correct items, select random ones
  const remainingCorrectCount = Math.min(sessionCellCount, correctItems.length);
  const selectedCorrectItems = selectRandom(correctItems, remainingCorrectCount);

  // 8. Select confusing items (if needed)
  let confusingItems: any[] = [];
  if (itemCount > selectedCorrectItems.length) {
    const remainingItems = allItems.filter(item =>
      !selectedCorrectItems.some(selected => selected.id === item.id)
    );
    const confusingCount = itemCount - selectedCorrectItems.length;
    confusingItems = selectRandom(remainingItems, confusingCount);
  }

  // 9. Combine and shuffle all items
  const allSelectedItems = [...selectedCorrectItems, ...confusingItems];
  const shuffledItems = shuffleArray(allSelectedItems);

  return {
    cells: selectedCells,
    items: shuffledItems,
    levelType: portal.item_count_rule
  };
}