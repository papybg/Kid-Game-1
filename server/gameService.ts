import { db } from "./db";
import { portals, gameItems, gameLayouts } from "../shared/schema";
import { eq, inArray, notInArray } from "drizzle-orm";

// Helper functions
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

// Helper function to get priority score for item-slot matching
function getMatchPriority(itemIndex: string, slotIndices: string[]): number {
  // Priority 1: Exact match with first index
  if (slotIndices.length > 0 && itemIndex === slotIndices[0]) {
    return 1;
  }
  
  // Priority 2: Exact match with second index (if exists)
  if (slotIndices.length > 1 && itemIndex === slotIndices[1]) {
    return 2;
  }
  
  // Priority 3: Hierarchical match (item starts with slot index)
  for (let i = 0; i < slotIndices.length; i++) {
    if (itemIndex.startsWith(slotIndices[i])) {
      return 3 + i; // 3 for first slot, 4 for second slot
    }
  }
  
  return 0; // No match
}

// Helper function to check if item can go in slot (hierarchical matching)
function canItemGoInSlot(itemIndex: string, slotIndices: string[]): boolean {
  return getMatchPriority(itemIndex, slotIndices) > 0;
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
  solution?: Record<number, string>; // For T1 mode: { itemId: cellId }
}

export async function generateGameSession(portalId: string, deviceType: 'desktop' | 'mobile' = 'desktop', gameMode: 'simple' | 'advanced' = 'simple', variantId?: string): Promise<GameSession> {
  console.log(`[GameService] Looking for portal with ID: "${portalId}"`);
  const portal = await db.query.portals.findFirst({ where: eq(portals.id, portalId) });
  if (!portal) throw new Error(`Portal with id ${portalId} not found`);

  // Get variant settings if variantId is provided
  let variantSettings: { minCells: number; maxCells: number; hasExtraItems: boolean } | null = null;
  if (variantId && portal.variantSettings) {
    variantSettings = portal.variantSettings[variantId];
  }

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

  // Count items per index (exclude joker items from counting for regular cells)
  allItems.forEach(item => {
    if (item.index !== 'js') { // Don't count joker items for regular cell calculations
      indexCounts[item.index] = (indexCounts[item.index] || 0) + 1;
    }
  });

  // Calculate maximum cells we can support (each cell needs at least one item)
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
      // Exact number of cells
      targetCellCount = variantSettings.minCells;
    } else {
      // Random between min and max
      targetCellCount = Math.floor(Math.random() * (variantSettings.maxCells - variantSettings.minCells + 1)) + variantSettings.minCells;
    }
  } else {
    // Fallback to old logic
    targetCellCount = Math.floor(Math.random() * (portal.max_cells - portal.min_cells + 1)) + portal.min_cells;
  }

  const actualCellCount = Math.min(targetCellCount, maxPossibleCells, variantSettings ? variantSettings.maxCells : portal.max_cells);

  // Ensure we have at least min_cells if possible
  const minCells = variantSettings ? variantSettings.minCells : portal.min_cells;
  const finalCellCount = Math.max(actualCellCount, Math.min(minCells, maxPossibleCells));

  if (finalCellCount === 0) {
    throw new Error('No valid cells can be created - not enough items for any slot indices');
  }

  // Select cells that have available items (using hierarchical matching)
  const validSlots = slots.filter(slot =>
    slot.index.some(slotIdx => 
      allItems.some(item => 
        item.index !== 'js' && canItemGoInSlot(item.index, [slotIdx])
      )
    )
  );

  const selectedCells = selectRandom(validSlots, finalCellCount);

  // Sort cells by complexity: cells with 2+ letter indices first, then cells with only 1-letter indices
  const sortedCells = [...selectedCells].sort((a, b) => {
    const aHasMultiLetter = a.index.some(idx => idx.length >= 2);
    const bHasMultiLetter = b.index.some(idx => idx.length >= 2);
    
    // Cells with multi-letter indices come first
    if (aHasMultiLetter && !bHasMultiLetter) return -1;
    if (!aHasMultiLetter && bHasMultiLetter) return 1;
    return 0;
  });

  // Get items for selected cells (using hierarchical matching)
  const correctItemsPool = allItems.filter(item => 
    item.index !== 'js' && selectedCells.some(cell => canItemGoInSlot(item.index, cell.index))
  );

  // Select correct items for each cell with priority matching (process sorted cells)
  const selectedCorrectItems: Item[] = [];
  const usedItemIds = new Set<number>();
  const usedIndices = new Set<string>(); // Track used indices to prevent duplicates

  for (const cell of sortedCells) {
    const hasMultiLetterIndex = cell.index.some(idx => idx.length >= 2);
    
    if (hasMultiLetterIndex) {
      // For cells with 2+ letter indices, use the existing priority logic
      const candidateItems = correctItemsPool
        .filter(item => !usedItemIds.has(item.id) && !usedIndices.has(item.index))
        .map(item => ({
          item,
          priority: getMatchPriority(item.index, cell.index)
        }))
        .filter(candidate => candidate.priority > 0)
        .sort((a, b) => a.priority - b.priority);

      if (candidateItems.length > 0) {
        const bestPriority = candidateItems[0].priority;
        const bestCandidates = candidateItems.filter(c => c.priority === bestPriority);
        const selectedCandidate = selectRandom(bestCandidates, 1)[0];
        selectedCorrectItems.push(selectedCandidate.item);
        usedItemIds.add(selectedCandidate.item.id);
        usedIndices.add(selectedCandidate.item.index);
      }
    } else {
      // For cells with only 1-letter indices, choose from all remaining items that match first letter
      const availableItems = allItems.filter(item => 
        item.index !== 'js' && 
        !usedItemIds.has(item.id) &&
        !usedIndices.has(item.index) &&
        cell.index.some(cellIdx => item.index.startsWith(cellIdx))
      );
      
      if (availableItems.length > 0) {
        const selectedItem = selectRandom(availableItems, 1)[0];
        selectedCorrectItems.push(selectedItem);
        usedItemIds.add(selectedItem.id);
        usedIndices.add(selectedItem.index);
      }
    }
  }

  // JOKER LOGIC: If we don't have enough correct items, add joker items
  const missingCount = finalCellCount - selectedCorrectItems.length;
  if (missingCount > 0) {
    // Find joker items
    const jokerItems = allItems.filter(item => item.index === 'js');
    if (jokerItems.length > 0) {
      // Add joker items to fill the gap
      for (let i = 0; i < Math.min(missingCount, jokerItems.length); i++) {
        selectedCorrectItems.push(jokerItems[i]);
        usedItemIds.add(jokerItems[i].id);
      }
    }
  }

  // Calculate total items needed
  const totalItemCount = gameMode === 'advanced' ? 8 : 6;
  const neededConfusing = Math.max(0, totalItemCount - selectedCorrectItems.length);

  // Add confusing items from remaining items (exclude joker items, already used items, and used indices)
  let confusingItems: Item[] = [];
  if (neededConfusing > 0) {
    const availableConfusingItems = allItems.filter(item =>
      !usedItemIds.has(item.id) && 
      item.index !== 'js' &&
      !usedIndices.has(item.index) // Don't add items with same index as correct items
    );
    const selectedConfusing = selectRandom(availableConfusingItems, Math.min(neededConfusing, availableConfusingItems.length));
    confusingItems = selectedConfusing;
    // Add to used items
    selectedConfusing.forEach(item => {
      usedItemIds.add(item.id);
      usedIndices.add(item.index);
    });
  }

  // Combine all items
  const finalItems = [...selectedCorrectItems, ...confusingItems];

  // If we still don't have enough items, fill with any remaining items (avoid duplicates)
  if (finalItems.length < totalItemCount) {
    const remainingNeeded = totalItemCount - finalItems.length;
    const availableItems = allItems.filter(item =>
      item.index !== 'js' && !usedItemIds.has(item.id)
    );

    if (availableItems.length >= remainingNeeded) {
      const additionalItems = selectRandom(availableItems, remainingNeeded);
      finalItems.push(...additionalItems);
      additionalItems.forEach(item => usedItemIds.add(item.id));
    } else {
      // Emergency fallback - add what we can
      finalItems.push(...availableItems);
      availableItems.forEach(item => usedItemIds.add(item.id));
      console.warn(`Warning: Not enough unique items for game session. Added ${availableItems.length} items, still need ${remainingNeeded - availableItems.length} more.`);
    }
  }

  const shuffledItems = shuffleArray(finalItems);

  // Create solution mapping for T1 tutorial mode
  let solutionMapping: Record<number, string> | undefined;
  if (variantId === 't1') {
    solutionMapping = {};
    // Map each correct item to its corresponding cell
    for (let i = 0; i < selectedCorrectItems.length && i < sortedCells.length; i++) {
      const item = selectedCorrectItems[i];
      const cell = sortedCells[i];
      // TypeScript doesn't know about id, but it exists in runtime
      solutionMapping[item.id] = (cell as any).id;
    }
  }

  // Ако все още няма достатъчно предмети, добави уникални тестови обекти
  if (shuffledItems.length < totalItemCount) {
    const missingCount = totalItemCount - shuffledItems.length;
    for (let i = 0; i < missingCount; i++) {
      const testItem = {
        id: 9999 + i, // Уникален ID за всеки тестов обект
        name: `test-${i + 1}`,
        image: "/images/1758906998565-smile.png",
        index: "z",
        category: "тест",
        audio: null,
        createdAt: null
      };
      shuffledItems.push(testItem);
    }
  }

  // Determine level type based on variant settings or fallback
  let levelType: 'equals_cells' | 'cells_plus_two';
  if (variantSettings) {
    levelType = variantSettings.hasExtraItems ? 'cells_plus_two' : 'equals_cells';
  } else {
    levelType = gameMode === 'advanced' ? 'cells_plus_two' : 'equals_cells';
  }

  return {
    cells: selectedCells,
    items: shuffledItems,
    levelType: levelType,
    layout: layout,
    solution: solutionMapping,
  };
}