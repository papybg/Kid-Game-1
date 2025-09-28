import { db } from '../../../../server/db.js';
import { gameItems } from '../../../../shared/schema.js';

async function analyzeItems() {
  const allItems = await db.select().from(gameItems);

  console.log('📊 Анализ на предметите:');
  console.log(`Общо предмети: ${allItems.length}`);

  // Групирай по index
  const byIndex: { [key: string]: any[] } = {};
  allItems.forEach((item: any) => {
    if (!byIndex[item.index]) byIndex[item.index] = [];
    byIndex[item.index].push(item);
  });

  console.log('\nПредмети по индекс:');
  Object.entries(byIndex).forEach(([index, items]) => {
    console.log(`${index}: ${items.length} предмета - ${items.map((i: any) => i.name).join(', ')}`);
  });

  // Провери за дублиращи се имена
  const names: { [key: string]: number } = {};
  allItems.forEach((item: any) => {
    names[item.name] = (names[item.name] || 0) + 1;
  });

  console.log('\nДублиращи се имена:');
  let hasNameDuplicates = false;
  Object.entries(names).forEach(([name, count]) => {
    if (count > 1) {
      hasNameDuplicates = true;
      console.log(`❌ ${name}: ${count} пъти`);
    }
  });

  if (!hasNameDuplicates) {
    console.log('✅ Няма дублиращи се имена');
  }

  process.exit(0);
}
analyzeItems();