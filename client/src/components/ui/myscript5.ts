import { generateGameSession } from '../../../../server/gameService.js';

async function testGameSession() {
  console.log('🧪 Тестване на генериране на игрална сесия...');

  try {
    const session = await generateGameSession('d2', 'desktop', 'simple');

    console.log(`Клетки: ${session.cells.length}`);
    console.log(`Предмети: ${session.items.length}`);

    // Провери за дублиращи се ID-та
    const ids = session.items.map((item: any) => item.id);
    const uniqueIds = new Set(ids);

    if (ids.length !== uniqueIds.size) {
      console.log('❌ Има дублиращи се ID-та в предметите!');

      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      console.log('Дублиращи се ID-та:', [...new Set(duplicates)]);
    } else {
      console.log('✅ Всички ID-та са уникални');
    }

    // Покажи тестовите предмети ако има
    const testItems = session.items.filter((item: any) => item.name.startsWith('test'));
    if (testItems.length > 0) {
      console.log(`Тестови предмети: ${testItems.length}`);
      testItems.forEach((item: any) => console.log(`  - ${item.name} (ID: ${item.id})`));
    }

  } catch (error) {
    console.error('Грешка при тестване:', error);
  }

  process.exit(0);
}
testGameSession();