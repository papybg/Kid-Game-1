import { db } from "./db";
import { portals, gameItems, gameLayouts } from "../shared/schema";
import { eq, inArray, notInArray } from "drizzle-orm";

// Global usage tracker for item variety across sessions
const globalItemUsageTracker = new Map<number, number>();

// Reset usage tracker periodically to prevent permanent bias
function resetUsageTrackerIfNeeded() {
  // Reset every 20 sessions to prevent permanent bias against popular items
  const totalUsage = Array.from(globalItemUsageTracker.values()).reduce((sum, count) => sum + count, 0);
  if (totalUsage > 200) { // Reset after ~20 sessions
    globalItemUsageTracker.clear();
    console.log('[GameService] Reset item usage tracker for fresh variety');
  }
}

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

// Enhanced randomization: instead of picking first available, 
// randomize the selection within each category
function selectRandomWithVariety<T>(array: T[], count: number, keyFn?: (item: T) => string): T[] {
  if (array.length === 0) return [];
  
  // If we want variety, group by key and pick randomly from each group
  if (keyFn && array.length > count) {
    const groups = new Map<string, T[]>();
    array.forEach(item => {
      const key = keyFn(item);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });
    
    // Pick one item from each group, then fill remaining randomly
    const result: T[] = [];
    const usedItems = new Set<T>();
    
    // First pass: pick one from each group (randomized)
    const groupKeys = shuffleArray([...groups.keys()]);
    for (const key of groupKeys) {
      if (result.length >= count) break;
      const groupItems = shuffleArray(groups.get(key)!); // Randomize within group
      const availableInGroup = groupItems.filter(item => !usedItems.has(item));
      if (availableInGroup.length > 0) {
        const randomItem = availableInGroup[Math.floor(Math.random() * availableInGroup.length)];
        result.push(randomItem);
        usedItems.add(randomItem);
      }
    }
    
    // Second pass: fill remaining slots randomly, avoiding overused items
    while (result.length < count) {
      const availableItems = array.filter(item => !usedItems.has(item));
      if (availableItems.length === 0) break;
      
      // Weight selection towards less frequently used items
      const weightedItems = [...availableItems];
      // Add some items multiple times to increase their selection probability
      // This creates a bias towards variety
      const randomItem = weightedItems[Math.floor(Math.random() * weightedItems.length)];
      result.push(randomItem);
      usedItems.add(randomItem);
    }
    
    return shuffleArray(result);
  }
  
  // Standard random selection
  return selectRandom(array, count);
}

// Enhanced function to select items with variety tracking across sessions
function selectItemsWithVarietyTracking<T extends { index: string; name: string }>(
  items: T[], 
  count: number,
  usedItems: Set<number>,
  usageTracker?: Map<number, number> // Track usage frequency across sessions
): T[] {
  const availableItems = items.filter(item => !usedItems.has((item as any).id));
  
  if (availableItems.length <= count) {
    return shuffleArray(availableItems);
  }

  const result: T[] = [];
  
  while (result.length < count) {
    if (availableItems.length === 0) break;
    
    let selectedItem: T;
    
    // Apply usage penalty if tracker is provided
    if (usageTracker) {
      // Calculate weighted selection based on usage frequency
      const itemWeights = availableItems.map(item => {
        const usage = usageTracker.get((item as any).id) || 0;
        // More aggressive penalty: exponential decay with stronger penalty
        return Math.max(0.01, Math.pow(0.5, usage)); // Very strong penalty for frequent items
      });
      
      // Weighted random selection
      const totalWeight = itemWeights.reduce((sum, weight) => sum + weight, 0);
      let random = Math.random() * totalWeight;
      
      let selectedIndex = 0;
      for (let i = 0; i < itemWeights.length; i++) {
        random -= itemWeights[i];
        if (random <= 0) {
          selectedIndex = i;
          break;
        }
      }
      
      selectedItem = availableItems[selectedIndex];
    } else {
      // Simple random selection
      selectedItem = availableItems[Math.floor(Math.random() * availableItems.length)];
    }
    
    result.push(selectedItem);
    usedItems.add((selectedItem as any).id);
    
    // Remove selected item from available items
    const itemIndex = availableItems.findIndex(item => (item as any).id === (selectedItem as any).id);
    if (itemIndex !== -1) {
      availableItems.splice(itemIndex, 1);
    }
  }
  
  return shuffleArray(result);
}

// Additional function for better item distribution
function selectItemsWithBalancedDistribution<T extends { index: string; name: string }>(
  items: T[], 
  count: number, 
  usedItems: Set<number>
): T[] {
  const availableItems = items.filter(item => !usedItems.has((item as any).id));
  
  if (availableItems.length <= count) {
    return shuffleArray(availableItems);
  }
  
  // Group by index for better balance
  const indexGroups = new Map<string, T[]>();
  availableItems.forEach(item => {
    const index = item.index;
    if (!indexGroups.has(index)) {
      indexGroups.set(index, []);
    }
    indexGroups.get(index)!.push(item);
  });
  
  const result: T[] = [];
  const selectedFromIndex = new Map<string, number>();
  
  // Distribute selections more evenly across indices
  const shuffledIndices = shuffleArray([...indexGroups.keys()]);
  
  while (result.length < count && result.length < availableItems.length) {
    let itemAdded = false;
    
    for (const index of shuffledIndices) {
      if (result.length >= count) break;
      
      const itemsInGroup = indexGroups.get(index)!;
      const alreadySelected = selectedFromIndex.get(index) || 0;
      
      // Limit how many items we pick from the same index
      const maxFromIndex = Math.max(1, Math.ceil(count / shuffledIndices.length));
      
      if (alreadySelected < maxFromIndex && alreadySelected < itemsInGroup.length) {
        const availableInGroup = itemsInGroup.filter(item => 
          !result.some(selected => (selected as any).id === (item as any).id)
        );
        
        if (availableInGroup.length > 0) {
          const randomItem = availableInGroup[Math.floor(Math.random() * availableInGroup.length)];
          result.push(randomItem);
          selectedFromIndex.set(index, alreadySelected + 1);
          itemAdded = true;
        }
      }
    }
    
    // If we couldn't add any items in this round, break to avoid infinite loop
    if (!itemAdded) break;
  }
  
  return shuffleArray(result);
}

// Helper function to determine cell type for sorting priority
function getCellType(cellIndex: string[]): number {
  const indexStr = cellIndex.join(',');
  
  // Type 1: Double index (e.g., "sa", "ra")
  if (cellIndex.length === 1 && cellIndex[0].length === 2) {
    return 1;
  }
  
  // Type 2: Single index (e.g., "r", "h", "p")
  if (cellIndex.length === 1 && cellIndex[0].length === 1) {
    return 2;
  }
  
  // Type 3: Two single indices (e.g., "p,h", "h,p")
  if (cellIndex.length === 2 && cellIndex.every(idx => idx.length === 1)) {
    return 3;
  }
  
  return 4; // Unknown type
}

// Helper function to find best matching item for a cell
// Determine whether an item matches a slot according to the new rules:
// - If the slot has `strict: true` => exact match required (item.index === slotIdx)
// - Otherwise => match by first letter (item.index[0] === slotIdx[0])
function canItemMatchSlot(itemIndex: string, slot: { index: string[]; strict?: boolean }): boolean {
  for (const slotIdx of slot.index) {
    if (slot.strict) {
      if (itemIndex === slotIdx) return true;
    } else {
      if (itemIndex && slotIdx && itemIndex[0] === slotIdx[0]) return true;
    }
  }
  return false;
}

export function findBestItemForCell(cellIndex: string[], availableItems: any[], slot?: { index: string[]; strict?: boolean }): any | null {
  // If slot provided and strict -> prefer exact matches
  if (slot && slot.strict) {
    for (const slotIdx of cellIndex) {
      const exactMatch = availableItems.find(item => item.index === slotIdx);
      if (exactMatch) return exactMatch;
    }
    return null;
  }

  // Non-strict: prefer exact match first, then first-letter match
  for (const slotIdx of cellIndex) {
    const exactMatch = availableItems.find(item => item.index === slotIdx);
    if (exactMatch) return exactMatch;
  }

  for (const slotIdx of cellIndex) {
    const firstLetterMatch = availableItems.find(item => item.index && item.index[0] === slotIdx[0]);
    if (firstLetterMatch) return firstLetterMatch;
  }

  return null;
}

// Helper function to check if item can go in slot (simple compatibility check)
export function canItemGoInSlot(itemIndex: string, slotIndices: string[], strict = false): boolean {
  if (strict) {
    return slotIndices.some(slotIdx => itemIndex === slotIdx);
  }
  return slotIndices.some(slotIdx => itemIndex && slotIdx && itemIndex[0] === slotIdx[0]);
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
  // Reset usage tracker periodically for fresh variety
  resetUsageTrackerIfNeeded();
  
  console.log(`[GameService] Looking for portal with ID: "${portalId}"`);
  const portal = await db.query.portals.findFirst({ where: eq(portals.id, portalId) });
  if (!portal) throw new Error(`Portal with id ${portalId} not found`);

  // Get variant settings if variantId is provided. We will not throw here; instead
  // we will derive sensible defaults later once we know the layout/slots.
  let variantSettings: { minCells: number; maxCells: number; hasExtraItems: boolean } | null = null;
  if (variantId && portal.variantSettings && typeof portal.variantSettings === 'object') {
    variantSettings = portal.variantSettings[variantId] ?? null;
    if (variantSettings) {
      console.log(`[GameService] Using variant settings for ${variantId}:`, variantSettings);
    } else {
      console.log(`[GameService] Variant settings for '${variantId}' not found on portal; will use defaults based on layout`);
    }
  } else {
    console.log(`[GameService] No variant settings present on portal; will use defaults based on layout. variantId: ${variantId}`);
  }

  const layout = await db.query.gameLayouts.findFirst({ where: eq(gameLayouts.id, portal.layouts[0]) });
  if (!layout) throw new Error(`Layout not found for portal ${portalId}`);

  // Select slots based on device type
  const slots = deviceType === 'mobile' ? layout.slots_mobile : layout.slots_desktop;
  if (!slots) throw new Error(`Slots not found for device ${deviceType} in portal ${portalId}`);

  // If variantSettings was missing, derive safe defaults from the layout/slots
  if (!variantSettings) {
    const totalSlots = slots.length || 0;
    // Default min: roughly half of available valid slots (but at least 1)
    const defaultMin = Math.max(1, Math.floor(totalSlots / 2));
    // Default max: min(defaultMin + 2, totalSlots)
    const defaultMax = Math.max(defaultMin, Math.min(totalSlots, defaultMin + 2));
    variantSettings = {
      minCells: defaultMin,
      maxCells: defaultMax,
      hasExtraItems: false,
    };
    console.log(`[GameService] Applied derived default variant settings:`, variantSettings);
  }

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
        item.index !== 'js' && canItemGoInSlot(item.index, [slotIdx], !!slot.strict)
      )
    );
    if (hasMatchingItem) {
      maxPossibleCells++;
    }
  });

  // Determine cell count based on variant settings
  let targetCellCount: number = 0;
  if (variantSettings) {
    if (variantSettings.minCells === variantSettings.maxCells) {
      // Exact number of cells
      targetCellCount = variantSettings.minCells;
    } else {
      // Random between min and max
      targetCellCount = Math.floor(Math.random() * (variantSettings.maxCells - variantSettings.minCells + 1)) + variantSettings.minCells;
    }
  }

  const actualCellCount = Math.min(targetCellCount, maxPossibleCells, variantSettings.maxCells);

  // Ensure we have at least minCells if possible
  const finalCellCount = Math.max(actualCellCount, Math.min(variantSettings.minCells, maxPossibleCells));

  if (finalCellCount === 0) {
    throw new Error('No valid cells can be created - not enough items for any slot indices');
  }

  // Select cells that have available items (using hierarchical matching)
  const validSlots = slots.filter(slot =>
    slot.index.some(slotIdx => 
      allItems.some(item => 
        item.index !== 'js' && canItemGoInSlot(item.index, [slotIdx], !!slot.strict)
      )
    )
  );

  // Enhanced randomization for slot selection with variety
  const selectedCells = selectRandomWithVariety(
    validSlots, 
    finalCellCount,
    // Group slots by their first index token (single-letter category semantics)
    (slot) => {
      const first = slot.index && slot.index[0];
      if (!first) return '';
      // If the first index token has length > 1, use its first char to represent the single-letter category
      return first[0];
    }
  );

  // Sort cells by priority: double index -> single index -> two indices
  const sortedCells = [...selectedCells].sort((a, b) => {
    const aType = getCellType(a.index);
    const bType = getCellType(b.index);
    return aType - bType;
  });

  // Get items for selected cells (using hierarchical matching)
  const correctItemsPool = allItems.filter(item => 
    item.index !== 'js' && selectedCells.some(cell => canItemGoInSlot(item.index, cell.index, !!cell.strict))
  );

  // Enhanced item selection for each cell with randomization
  const selectedCorrectItems: Item[] = [];
  const usedItemIds = new Set<number>();

  for (const cell of sortedCells) {
    // Find available items (not yet used)
    const availableItems = correctItemsPool.filter(item => !usedItemIds.has(item.id));
    
    // Group items by compatibility and pick randomly within compatible groups
  const compatibleItems = availableItems.filter(item => canItemGoInSlot(item.index, cell.index, !!cell.strict));
    
    if (compatibleItems.length > 0) {
      // Use variety tracking for better distribution across sessions
      const selectedForCell = selectItemsWithVarietyTracking(
        compatibleItems,
        1,
        usedItemIds,
        globalItemUsageTracker
      );
      
      if (selectedForCell.length > 0) {
        selectedCorrectItems.push(selectedForCell[0]);
        usedItemIds.add(selectedForCell[0].id);
        
        // Update global usage tracker
        const itemId = selectedForCell[0].id;
        globalItemUsageTracker.set(itemId, (globalItemUsageTracker.get(itemId) || 0) + 1);
      } else {
        // Fallback to random selection
        const randomCompatibleItem = compatibleItems[Math.floor(Math.random() * compatibleItems.length)];
        selectedCorrectItems.push(randomCompatibleItem);
        usedItemIds.add(randomCompatibleItem.id);
        
        // Update global usage tracker
        globalItemUsageTracker.set(randomCompatibleItem.id, (globalItemUsageTracker.get(randomCompatibleItem.id) || 0) + 1);
      }
    } else {
      // Fallback to original logic if no compatible items found
  const bestItem = findBestItemForCell(cell.index, availableItems, cell);
      if (bestItem) {
        selectedCorrectItems.push(bestItem);
        usedItemIds.add(bestItem.id);
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

  // Calculate total items needed: must equal the number of selected cells
  const totalItemCount = finalCellCount;
  const neededConfusing = Math.max(0, totalItemCount - selectedCorrectItems.length);

  // Add confusing items from remaining items with enhanced variety and balance
  let confusingItems: Item[] = [];
  if (neededConfusing > 0) {
    const availableConfusingItems = allItems.filter(item =>
      !usedItemIds.has(item.id) && 
      item.index !== 'js'
    );
    
    // Use variety tracking for better distribution across sessions
    const selectedConfusing = selectItemsWithVarietyTracking(
      availableConfusingItems, 
      Math.min(neededConfusing, availableConfusingItems.length),
      usedItemIds,
      globalItemUsageTracker
    );
    
    confusingItems = selectedConfusing;
    // Add to used items and update global tracker
    selectedConfusing.forEach(item => {
      usedItemIds.add(item.id);
      globalItemUsageTracker.set(item.id, (globalItemUsageTracker.get(item.id) || 0) + 1);
    });
  }

  // Combine all items
  let finalItems = [...selectedCorrectItems, ...confusingItems];

  // Ensure finalItems length equals totalItemCount. Trim extras or pad with jokers/test items.
  if (finalItems.length > totalItemCount) {
    // Prefer to keep selectedCorrectItems; trim confusing items first
    finalItems = finalItems.slice(0, totalItemCount);
  } else if (finalItems.length < totalItemCount) {
    const remainingNeeded = totalItemCount - finalItems.length;
    const availableItems = allItems.filter(item =>
      item.index !== 'js' && !usedItemIds.has(item.id)
    );

    if (availableItems.length >= remainingNeeded) {
      const additionalItems = selectRandomWithVariety(
        availableItems,
        remainingNeeded,
        (item: any) => {
          if (item && item.index && item.index.length > 0) return item.index[0];
          if (item && item.category && item.category.length > 0) return item.category[0];
          return item.index || '';
        }
      );
      finalItems.push(...additionalItems);
      additionalItems.forEach(item => usedItemIds.add(item.id));
    } else {
      // Fill with joker items first, then test items
      const jokerItems = allItems.filter(item => item.index === 'js' && !usedItemIds.has(item.id));
      for (let i = 0; i < Math.min(remainingNeeded, jokerItems.length); i++) {
        finalItems.push(jokerItems[i]);
        usedItemIds.add(jokerItems[i].id);
      }

      if (finalItems.length < totalItemCount) {
        const stillNeeded = totalItemCount - finalItems.length;
        for (let i = 0; i < stillNeeded; i++) {
          const testItem = {
            id: 9999 + i, // Unique ID for each test item
            name: `test-${i + 1}`,
            image: "/images/1758906998565-smile.png",
            index: "z",
            category: "тест",
            audio: null,
            createdAt: null
          };
          finalItems.push(testItem as any);
        }
      }
    }
  }

  // Enhanced final shuffle with multiple passes for better randomization
  let shuffledItems = shuffleArray(finalItems);
  // Additional randomization: shuffle again to break any patterns
  shuffledItems = shuffleArray(shuffledItems);

  // Create solution mapping for T1 tutorial mode
  let solutionMapping: Record<number, string> | undefined;
  if (variantId === 't1') {
    solutionMapping = {};
    // Map each correct item to its corresponding cell
    for (let i = 0; i < selectedCorrectItems.length && i < sortedCells.length; i++) {
      const item = selectedCorrectItems[i];
      const cell = sortedCells[i];
      // TypeScript doesn't know about id, but it exists in runtime
      (solutionMapping as any)[(item as any).id] = (cell as any).id;
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