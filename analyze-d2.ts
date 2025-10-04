import { db } from './server/db';
import { gameItems, gameLayouts } from './shared/schema';
import { eq } from 'drizzle-orm';

async function analyzeD2() {
  const layout = await db.query.gameLayouts.findFirst({ where: eq(gameLayouts.id, 'd2') });
  if (!layout) {
    console.log('Layout d2 not found');
    return;
  }
  const allItems = await db.select().from(gameItems);

  console.log('D2 Layout cells and matching items:');
  layout.slots_desktop.forEach((slot, i) => {
    console.log(`Cell ${i+1}: [${slot.index.join(',')}]`);
    slot.index.forEach(slotIdx => {
      const matchingItems = allItems.filter(item => item.index === slotIdx);
      console.log(`  Index '${slotIdx}': ${matchingItems.length} items - [${matchingItems.map(item => item.name).join(', ')}]`);
    });
  });

  process.exit(0);
}

analyzeD2().catch(console.error);