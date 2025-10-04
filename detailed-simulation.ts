import { db } from './server/db';
import { gameItems, gameLayouts, portals } from './shared/schema';
import { eq } from 'drizzle-orm';

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

function getCellType(cellIndex: string[]): number {
  const indexStr = cellIndex.join(',');
  if (cellIndex.length === 1 && cellIndex[0].length === 2) {
    return 1;
  }
  if (cellIndex.length === 1 && cellIndex[0].length === 1) {
    return 2;
  }
  if (cellIndex.length === 2 && cellIndex.every(idx => idx.length === 1)) {
    return 3;
  }
  return 4;
}

function findBestItemForCell(cellIndex: string[], availableItems: any[]): any | null {
  if (cellIndex.length === 1 && cellIndex[0].length === 2) {
    return availableItems.find(item => item.index === cellIndex[0]) || null;
  }
  if (cellIndex.length === 1 && cellIndex[0].length === 1) {
    return availableItems.find(item => item.index.startsWith(cellIndex[0])) || null;
  }
  if (cellIndex.length === 2) {
    const firstMatch = availableItems.find(item => item.index === cellIndex[0]);
    if (firstMatch) return firstMatch;
    const secondMatch = availableItems.find(item => item.index === cellIndex[1]);
    if (secondMatch) return secondMatch;
  }
  return null;
}

function canItemGoInSlot(itemIndex: string, slotIndices: string[]): boolean {
  return findBestItemForCell(slotIndices, [{ index: itemIndex }]) !== null;
}

async function detailedSimulation() {
  console.log('=== DETAILED SIMULATION OF D2 GAME SESSION ===');

  const portal = await db.query.portals.findFirst({ where: eq(portals.id, 'd2') });
  if (!portal) throw new Error('Portal d2 not found');

  const layout = await db.query.gameLayouts.findFirst({ where: eq(gameLayouts.id, portal.layouts[0]) });
  if (!layout) throw new Error('Layout not found');

  const slots = layout.slots_desktop;
  const allItems = await db.select().from(gameItems);

  console.log(`Portal settings: min_cells=${portal.min_cells}, max_cells=${portal.max_cells}`);
  console.log(`Layout has ${slots.length} slots`);

  // Calculate maxPossibleCells
  let maxPossibleCells = 0;
  slots.forEach(slot => {
    const hasMatchingItem = slot.index.some(slotIdx =>
      allItems.some(item =>
        item.index !== 'js' && canItemGoInSlot(item.index, [slotIdx])
      )
    );
    if (hasMatchingItem) {
      maxPossibleCells++;
    }
  });
  console.log(`maxPossibleCells: ${maxPossibleCells}`);

  // Calculate targetCellCount (no variant settings)
  const targetCellCount = Math.floor(Math.random() * (portal.max_cells - portal.min_cells + 1)) + portal.min_cells;
  console.log(`targetCellCount: ${targetCellCount}`);

  const actualCellCount = Math.min(targetCellCount, maxPossibleCells, portal.max_cells);
  const minCells = portal.min_cells;
  const finalCellCount = Math.max(actualCellCount, Math.min(minCells, maxPossibleCells));
  console.log(`actualCellCount: ${actualCellCount}, finalCellCount: ${finalCellCount}`);

  // Select cells
  const validSlots = slots.filter(slot =>
    slot.index.some(slotIdx =>
      allItems.some(item =>
        item.index !== 'js' && canItemGoInSlot(item.index, [slotIdx])
      )
    )
  );
  console.log(`validSlots: ${validSlots.length} (should be 9)`);

  const selectedCells = selectRandom(validSlots, finalCellCount);
  console.log(`selectedCells: ${selectedCells.length} (should be ${finalCellCount})`);

  console.log('Selected cells:');
  selectedCells.forEach((cell, i) => {
    console.log(`  ${i+1}. [${cell.index.join(',')}]`);
  });

  // Sort cells
  const sortedCells = [...selectedCells].sort((a, b) => {
    const aType = getCellType(a.index);
    const bType = getCellType(b.index);
    return aType - bType;
  });

  console.log('Sorted cells:');
  sortedCells.forEach((cell, i) => {
    console.log(`  ${i+1}. [${cell.index.join(',')}] (type: ${getCellType(cell.index)})`);
  });

  // Get correct items pool
  const correctItemsPool = allItems.filter(item =>
    item.index !== 'js' && selectedCells.some(cell => canItemGoInSlot(item.index, cell.index))
  );
  console.log(`correctItemsPool: ${correctItemsPool.length} items`);

  // Select correct items
  const selectedCorrectItems: any[] = [];
  const usedItemIds = new Set<number>();

  for (const cell of sortedCells) {
    const availableItems = correctItemsPool.filter(item => !usedItemIds.has(item.id));
    const bestItem = findBestItemForCell(cell.index, availableItems);

    if (bestItem) {
      console.log(`✓ Cell [${cell.index.join(',')}]: ${bestItem.name} (${bestItem.index})`);
      selectedCorrectItems.push(bestItem);
      usedItemIds.add(bestItem.id);
    } else {
      console.log(`✗ Cell [${cell.index.join(',')}]: NO ITEM FOUND`);
    }
  }

  console.log(`\nRESULT: ${selectedCorrectItems.length} correct items, ${selectedCells.length} cells returned`);

  process.exit(0);
}

detailedSimulation().catch(console.error);