import { db } from './server/db';
import { gameItems, gameLayouts } from './shared/schema';
import { eq } from 'drizzle-orm';

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

async function analyzeD2ItemSelection() {
  const layout = await db.query.gameLayouts.findFirst({ where: eq(gameLayouts.id, 'd2') });
  if (!layout) return;

  const allItems = await db.select().from(gameItems);

  console.log('Testing item selection for D2 cells:');
  const correctItemsPool = allItems.filter(item => item.index !== 'js');

  let selectedCorrectItems = [];
  const usedItemIds = new Set<number>();

  for (const slot of layout.slots_desktop) {
    const availableItems = correctItemsPool.filter(item => !usedItemIds.has(item.id));
    const bestItem = findBestItemForCell(slot.index, availableItems);

    if (bestItem) {
      console.log(`Cell [${slot.index.join(',')}]: FOUND ${bestItem.name} (index: ${bestItem.index})`);
      selectedCorrectItems.push(bestItem);
      usedItemIds.add(bestItem.id);
    } else {
      console.log(`Cell [${slot.index.join(',')}]: NO ITEM FOUND`);
    }
  }

  console.log(`Total correct items found: ${selectedCorrectItems.length}/${layout.slots_desktop.length}`);

  process.exit(0);
}

analyzeD2ItemSelection().catch(console.error);