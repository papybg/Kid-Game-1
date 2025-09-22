import { db } from "./db";
import { portals, gameItems, gameLayouts } from "../shared/schema";
import { eq, inArray, notInArray } from "drizzle-orm";

// --- КОРИГИРАНИ HELPER ФУНКЦИИ ---
// Тази функция сега използва правилния Fisher-Yates shuffle отдолу.
function selectRandom<T>(array: T[], count: number): T[] {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, count);
}

// Fisher-Yates shuffle - това е перфектно, запазваме го.
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// --- ИНТЕРФЕЙСИ (ДОБРА ПРАКТИКА) ---
// Дефинираме типове за по-голяма яснота в кода.
type Cell = (typeof gameLayouts.$inferSelect)['slots'][number];
type Item = typeof gameItems.$inferSelect;

export interface GameSession {
  cells: Cell[];
  items: Item[];
  levelType: 'equals_cells' | 'cells_plus_two';
}

// --- ОСНОВНАТА ФУНКЦИЯ (ПРЕНАПИСАНА И ОПТИМИЗИРАНА) ---
export async function generateGameSession(portalId: string): Promise<GameSession> {
  // Стъпка 1: Вземи настройките на портала (без промяна)
  const portal = await db.query.portals.findFirst({
    where: eq(portals.id, portalId),
  });
  if (!portal) {
    throw new Error(`Portal with id ${portalId} not found`);
  }

  // Стъпка 2: Генерирай случаен брой клетки (без промяна)
  const sessionCellCount = Math.floor(Math.random() * (portal.max_cells - portal.min_cells + 1)) + portal.min_cells;

  // Стъпка 3: Вземи layout-а и избери случайни клетки (без промяна)
  const layout = await db.query.gameLayouts.findFirst({
    where: eq(gameLayouts.id, portal.layouts[0]), // Предполагаме, че винаги има поне един layout
  });
  if (!layout || !layout.slots) {
    throw new Error(`Layout or slots not found for portal ${portalId}`);
  }
  const selectedCells = selectRandom(layout.slots, sessionCellCount);

  // --- КОРИГИРАНА И ОПТИМИЗИРАНА ЛОГИКА ЗА ИЗБОР НА ПРЕДМЕТИ ---
  
  // Стъпка 4: Събери всички нужни индекси от избраните клетки
  const requiredIndices = [...new Set(selectedCells.flatMap(cell => cell.index))];
  if (requiredIndices.length === 0) {
    throw new Error('Selected cells have no indices defined.');
  }

  // Стъпка 5: Изтегли САМО правилните предмети от базата (ОПТИМИЗАЦИЯ)
  const correctItemsPool = await db.select().from(gameItems).where(inArray(gameItems.index, requiredIndices));
  
  // Стъпка 6: Избери по един предмет за всяка клетка (КОРЕКЦИЯ НА ЛОГИКАТА)
  const selectedCorrectItems: Item[] = [];
  const availableItems = [...correctItemsPool];
  
  for (const cell of selectedCells) {
    const matchingItems = availableItems.filter(item => cell.index.includes(item.index));
    if (matchingItems.length > 0) {
      const randomItem = selectRandom(matchingItems, 1)[0];
      selectedCorrectItems.push(randomItem);
      // Премахваме избрания предмет, за да не го изберем отново
      const indexToRemove = availableItems.findIndex(item => item.id === randomItem.id);
      if (indexToRemove > -1) {
        availableItems.splice(indexToRemove, 1);
      }
    }
  }
  // Ако няма достатъчно предмети за всички клетки, може да хвърлим грешка или да продължим с по-малко
  if (selectedCorrectItems.length < sessionCellCount) {
    console.warn(`Warning: Not enough unique items found for all cells. Found ${selectedCorrectItems.length}, needed ${sessionCellCount}`);
  }

  // Стъпка 7: Изчисли броя на всички предмети и избери "объркващи" (ОПТИМИЗАЦИЯ)
  const totalItemCount = portal.item_count_rule === 'cells_plus_two'
    ? sessionCellCount + 2
    : sessionCellCount;
  
  let confusingItems: Item[] = [];
  const neededConfusing = totalItemCount - selectedCorrectItems.length;

  if (neededConfusing > 0) {
    // Изтегли САМО предмети, които НЕ са правилни за тази дъска (ОПТИМИЗАЦИЯ)
    const confusingItemsPool = await db.select().from(gameItems).where(notInArray(gameItems.index, requiredIndices));
    confusingItems = selectRandom(confusingItemsPool, neededConfusing);
  }

  // Стъпка 8: Комбинирай и разбъркай (без промяна)
  const finalItems = shuffleArray([...selectedCorrectItems, ...confusingItems]);

  // Стъпка 9: Върни резултата (без промяна)
  return {
    cells: selectedCells,
    items: finalItems,
    levelType: portal.item_count_rule,
  };
}