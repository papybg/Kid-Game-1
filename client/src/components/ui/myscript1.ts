import { db } from '../../../../server/db.js';
import { gameItems } from '../../../../shared/schema.js';

async function checkDuplicateIds() {
  const items = await db.select().from(gameItems);
  const idCounts: { [key: number]: number } = {};

  console.log('🔍 Проверка за дублиращи се ID-та в game_items таблицата:');
  console.log(`Общо предмети: ${items.length}`);
  console.log('');

  items.forEach((item: any) => {
    idCounts[item.id] = (idCounts[item.id] || 0) + 1;
  });

  let hasDuplicates = false;
  let duplicateCount = 0;

  Object.entries(idCounts).forEach(([id, count]) => {
    if (count > 1) {
      hasDuplicates = true;
      duplicateCount++;
      console.log(`❌ ID ${id}: се среща ${count} пъти`);

      const duplicateItems = items.filter((item: any) => item.id === parseInt(id));
      duplicateItems.forEach((item: any) => {
        console.log(`   - ${item.name} (index: ${item.index})`);
      });
      console.log('');
    }
  });

  if (!hasDuplicates) {
    console.log('✅ Няма дублиращи се ID-та - всички ID-та са уникални');
  } else {
    console.log(`🚨 Намерени ${duplicateCount} дублиращи се ID-та`);
    console.log('Това може да причини React key конфликти!');
  }

  process.exit(0);
}
checkDuplicateIds();