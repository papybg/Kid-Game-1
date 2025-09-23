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
  layout: Layout; // <-- ДОБАВЕНО ПОЛЕ ЗА ФОНА
}

export async function generateGameSession(portalId: string, deviceType: 'desktop' | 'mobile' = 'desktop', gameMode: 'simple' | 'advanced' = 'simple'): Promise<GameSession> {
  // ... логиката до края е същата ...
  const portal = await db.query.portals.findFirst({ where: eq(portals.id, portalId) });
  if (!portal) throw new Error(`Portal with id ${portalId} not found`);

  const sessionCellCount = Math.floor(Math.random() * (portal.max_cells - portal.min_cells + 1)) + portal.min_cells;

  const layout = await db.query.gameLayouts.findFirst({ where: eq(gameLayouts.id, portal.layouts[0]) });
  if (!layout) throw new Error(`Layout not found for portal ${portalId}`);
  
  // Select slots based on device type
  const slots = deviceType === 'mobile' ? layout.slots_mobile : layout.slots_desktop;
  if (!slots) throw new Error(`Slots not found for device ${deviceType} in portal ${portalId}`);
  
  const selectedCells = selectRandom(slots, sessionCellCount);
  const requiredIndices = [...new Set(selectedCells.flatMap(cell => cell.index))];
  if (requiredIndices.length === 0) throw new Error('Selected cells have no indices defined.');

  const correctItemsPool = await db.select().from(gameItems).where(inArray(gameItems.index, requiredIndices));
  const selectedCorrectItems: Item[] = [];
  const availableItems = [...correctItemsPool];
  for (const cell of selectedCells) {
    const matchingItems = availableItems.filter(item => cell.index.includes(item.index));
    if (matchingItems.length > 0) {
      const randomItem = selectRandom(matchingItems, 1)[0];
      selectedCorrectItems.push(randomItem);
      const indexToRemove = availableItems.findIndex(item => item.id === randomItem.id);
      if (indexToRemove > -1) availableItems.splice(indexToRemove, 1);
    }
  }

  const totalItemCount = gameMode === 'advanced' ? 8 : 6;
  let confusingItems: Item[] = [];
  const neededConfusing = totalItemCount - selectedCorrectItems.length;

  if (neededConfusing > 0) {
    // For confusing items, use items not already selected, regardless of index
    const allAvailableItems = await db.select().from(gameItems);
    const usedItemIds = new Set(selectedCorrectItems.map(item => item.id));
    const availableConfusingItems = allAvailableItems.filter(item => !usedItemIds.has(item.id));
    confusingItems = selectRandom(availableConfusingItems, neededConfusing);
  }

  const finalItems = shuffleArray([...selectedCorrectItems, ...confusingItems]);

  // КОРЕКЦИЯ: Добавяме 'layout' към връщания обект
  return {
    cells: selectedCells,
    items: finalItems,
    levelType: gameMode === 'advanced' ? 'cells_plus_two' : 'equals_cells',
    layout: layout, // <-- ТАЗИ ПРОМЯНА ОПРАВЯ ЛИПСВАЩИЯ ФОН
  };
}