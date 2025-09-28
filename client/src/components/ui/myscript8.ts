import { generateGameSession } from '../../../../server/gameService.js';

async function runMultipleTests() {
  console.log('🧪 Множествени тестове за дубликати...\n');

  for (let i = 1; i <= 5; i++) {
    console.log(`=== Test ${i} ===`);
    try {
      const session = await generateGameSession('d2', 'desktop', 'simple');
      const ids = session.items.map((item: any) => item.id);
      const uniqueIds = new Set(ids);
      const hasDuplicates = ids.length !== uniqueIds.size;

      console.log(`Клетки: ${session.cells.length}, Предмети: ${session.items.length}, Дубликати: ${hasDuplicates}`);

      if (hasDuplicates) {
        const duplicates = ids.filter((id: number, index: number) => ids.indexOf(id) !== index);
        console.log(`Дублиращи се ID-та: ${[...new Set(duplicates)]}`);
      }
      console.log('');
    } catch (error) {
      console.error(`Грешка в тест ${i}:`, error);
    }
  }

  process.exit(0);
}

runMultipleTests();