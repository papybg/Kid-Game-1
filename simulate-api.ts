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

async function simulateAPIConditions() {
  console.log('=== SIMULATING EXACT API CONDITIONS (D2, variant=t1) ===');

  const portal = await db.query.portals.findFirst({ where: eq(portals.id, 'd2') });
  if (!portal) throw new Error('Portal d2 not found');

  const layout = await db.query.gameLayouts.findFirst({ where: eq(gameLayouts.id, portal.layouts[0]) });
  if (!layout) throw new Error('Layout not found');

  const slots = layout.slots_desktop;
  const allItems = await db.select().from(gameItems);

  const variantId = 't1'; // Exact API condition
  const deviceType = 'desktop';
  const gameMode = 'simple';

  // Get variant settings if variantId is provided
  let variantSettings: { minCells: number; maxCells: number; hasExtraItems: boolean } | null = null;
  if (variantId && portal.variantSettings) {
    variantSettings = portal.variantSettings[variantId];
    console.log(`Using variant settings for ${variantId}:`, variantSettings);
  } else {
    console.log(`No variant settings found. variantId: ${variantId}, portal.variantSettings:`, portal.variantSettings);
  }

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

  // Determine cell count based on variant settings or fallback to portal settings
  let targetCellCount: number;
  if (variantSettings) {
    if (variantSettings.minCells === variantSettings.maxCells) {
      targetCellCount = variantSettings.minCells;
    } else {
      targetCellCount = Math.floor(Math.random() * (variantSettings.maxCells - variantSettings.minCells + 1)) + variantSettings.minCells;
    }
  } else {
    targetCellCount = Math.floor(Math.random() * (portal.max_cells - portal.min_cells + 1)) + portal.min_cells;
  }

  const actualCellCount = Math.min(targetCellCount, maxPossibleCells, variantSettings ? variantSettings.maxCells : portal.max_cells);
  const minCells = variantSettings ? variantSettings.minCells : portal.min_cells;
  const finalCellCount = Math.max(actualCellCount, Math.min(minCells, maxPossibleCells));

  console.log(`targetCellCount: ${targetCellCount}, finalCellCount: ${finalCellCount}`);

  // Select cells
  const validSlots = slots.filter(slot =>
    slot.index.some(slotIdx =>
      allItems.some(item =>
        item.index !== 'js' && canItemGoInSlot(item.index, [slotIdx])
      )
    )
  );

  const selectedCells = selectRandom(validSlots, finalCellCount);

  // Sort cells
  const sortedCells = [...selectedCells].sort((a, b) => {
    const aType = getCellType(a.index);
    const bType = getCellType(b.index);
    return aType - bType;
  });

  // Get items for selected cells
  const correctItemsPool = allItems.filter(item =>
    item.index !== 'js' && selectedCells.some(cell => canItemGoInSlot(item.index, cell.index))
  );

  // Select correct items
  const selectedCorrectItems: any[] = [];
  const usedItemIds = new Set<number>();

  for (const cell of sortedCells) {
    const availableItems = correctItemsPool.filter(item => !usedItemIds.has(item.id));
    const bestItem = findBestItemForCell(cell.index, availableItems);

    if (bestItem) {
      selectedCorrectItems.push(bestItem);
      usedItemIds.add(bestItem.id);
    }
  }

  // JOKER LOGIC
  const missingCount = finalCellCount - selectedCorrectItems.length;
  if (missingCount > 0) {
    const jokerItems = allItems.filter(item => item.index === 'js');
    for (let i = 0; i < Math.min(missingCount, jokerItems.length); i++) {
      selectedCorrectItems.push(jokerItems[i]);
      usedItemIds.add(jokerItems[i].id);
    }
  }

  // Calculate total items needed
  const totalItemCount = 6; // Always 6 for simple mode in this simulation
  const neededConfusing = Math.max(0, totalItemCount - selectedCorrectItems.length);

  // Add confusing items
  let confusingItems: any[] = [];
  if (neededConfusing > 0) {
    const availableConfusingItems = allItems.filter(item =>
      !usedItemIds.has(item.id) &&
      item.index !== 'js'
    );
    const selectedConfusing = selectRandom(availableConfusingItems, Math.min(neededConfusing, availableConfusingItems.length));
    confusingItems = selectedConfusing;
    selectedConfusing.forEach((item: any) => {
      usedItemIds.add(item.id);
    });
  }

  // Combine all items
  const finalItems = [...selectedCorrectItems, ...confusingItems];

  // Emergency fallback
  if (finalItems.length < totalItemCount) {
    const remainingNeeded = totalItemCount - finalItems.length;
    const availableItems = allItems.filter(item =>
      item.index !== 'js' && !usedItemIds.has(item.id)
    );

    if (availableItems.length >= remainingNeeded) {
      const additionalItems = selectRandom(availableItems, remainingNeeded);
      finalItems.push(...additionalItems);
      additionalItems.forEach((item: any) => usedItemIds.add(item.id));
    } else {
      finalItems.push(...availableItems);
      availableItems.forEach((item: any) => usedItemIds.add(item.id));
    }
  }

  const shuffledItems = shuffleArray(finalItems);

  console.log(`RESULT:`);
  console.log(`- selectedCells: ${selectedCells.length}`);
  console.log(`- selectedCorrectItems: ${selectedCorrectItems.length}`);
  console.log(`- jokerItems in selectedCorrectItems: ${selectedCorrectItems.filter((item: any) => item.index === 'js').length}`);
  console.log(`- confusingItems: ${confusingItems.length}`);
  console.log(`- finalItems: ${finalItems.length}`);
  console.log(`- shuffledItems: ${shuffledItems.length}`);

  // Check if cells should be filtered
  const correctItems = shuffledItems.filter((item: any) => item.index !== 'js');
  console.log(`- correct items in final result: ${correctItems.length}`);

  if (selectedCells.length !== correctItems.length) {
    console.log(`*** MISMATCH FOUND: cells=${selectedCells.length}, correctItems=${correctItems.length} ***`);
  }

  process.exit(0);
}

simulateAPIConditions().catch(console.error);