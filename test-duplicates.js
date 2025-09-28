import { generateGameSession } from './server/gameService.ts';

async function test() {
  for (let i = 0; i < 5; i++) {
    try {
      const session = await generateGameSession('d1');
      const itemIds = session.items.map(item => item.id);
      const uniqueIds = new Set(itemIds);
      const duplicates = itemIds.filter(id => {
        const count = itemIds.filter(x => x === id).length;
        return count > 1;
      });
      const uniqueDuplicates = [...new Set(duplicates)];
      console.log(`Session ${i + 1}: ${session.items.length} items, duplicates: [${uniqueDuplicates.join(', ')}]`);
    } catch (e) {
      console.error(`Session ${i + 1} failed:`, e.message);
    }
  }
}

test();