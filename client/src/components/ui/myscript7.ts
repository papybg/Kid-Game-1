import { generateGameSession } from '../../../../server/gameService.js';

async function detailedSessionTest() {
  console.log('🔍 Подробен анализ на генерирана сесия...');

  try {
    const session = await generateGameSession('d2', 'desktop', 'simple');

    console.log(`Клетки: ${session.cells.length}`);
    console.log(`Предмети: ${session.items.length}`);

    // Групирай предметите по ID
    const itemsById: { [key: number]: any[] } = {};
    session.items.forEach((item: any, index: number) => {
      if (!itemsById[item.id]) itemsById[item.id] = [];
      itemsById[item.id].push({ item, position: index });
    });

    // Намери дубликатите
    const duplicates = Object.entries(itemsById).filter(([id, instances]) => instances.length > 1);

    if (duplicates.length > 0) {
      console.log('\n❌ Дублиращи се предмети:');
      duplicates.forEach(([id, instances]) => {
        console.log(`ID ${id} - ${instances[0].item.name} (индекс: ${instances[0].item.index})`);
        console.log(`  Позиции в масива: ${instances.map((i: any) => i.position).join(', ')}`);
      });
    } else {
      console.log('\n✅ Няма дублиращи се предмети');
    }

    // Покажи всички предмети
    console.log('\n📋 Всички предмети в сесията:');
    session.items.forEach((item: any, index: number) => {
      console.log(`${index + 1}. ${item.name} (ID: ${item.id}, индекс: ${item.index})`);
    });

  } catch (error) {
    console.error('Грешка:', error);
  }

  process.exit(0);
}
detailedSessionTest();