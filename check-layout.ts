import { db } from './server/db';
import { gameLayouts, gameItems } from './shared/schema';
import { eq, inArray } from 'drizzle-orm';

async function checkLayout(layoutId: string) {
  console.log(`🕵️‍♂️  Извършвам диагностика на layout: ${layoutId}`);

  // 1. Взимам конкретния layout от базата
  const layout = await db.query.gameLayouts.findFirst({
    where: eq(gameLayouts.id, layoutId),
  });

  if (!layout || !layout.slots_desktop) {
    console.log(`❌ Грешка: Layout с ID '${layoutId}' не е намерен или няма дефинирани клетки.`);
    return;
  }

  const slots = layout.slots_desktop;
  console.log(`-> Намерени ${slots.length} клетки в layout '${layoutId}'.`);

  // 2. Събирам всички уникални индекси, които се изискват от тези клетки
  const requiredIndices = [...new Set(slots.flatMap(slot => slot.index))];
  console.log('-> Изисквани индекси:', requiredIndices);

  if (requiredIndices.length === 0) {
      console.log('🟡 Предупреждение: Този layout няма клетки, изискващи предмети.');
      return;
  }

  // 3. Правя ЕДНА заявка към базата, за да взема САМО предметите, които ми трябват
  const matchingItems = await db.select({ index: gameItems.index })
    .from(gameItems)
    .where(inArray(gameItems.index, requiredIndices));
  
  console.log(`-> Намерени ${matchingItems.length} потенциално съвпадащи предмета в базата.`);

  // 4. Създавам си бърз "пищов" с наличните индекси
  const availableIndices = new Set(matchingItems.map(item => item.index));

  // 5. Проверявам всяка клетка спрямо наличните предмети
  console.log('\n--- АНАЛИЗ НА КЛЕТКИТЕ ---');
  let validCount = 0;
  slots.forEach((slot, i) => {
    const hasMatchingItem = slot.index.some(slotIdx => availableIndices.has(slotIdx));
    const status = hasMatchingItem ? '✅ ВАЛИДНА' : '❌ НЕВАЛИДНА';
    
    console.log(`Клетка #${i + 1}: изисква индекс ${JSON.stringify(slot.index)} -> ${status}`);
    
    if (hasMatchingItem) {
      validCount++;
    } else {
      console.log(`   -> 🚨 ВНИМАНИЕ: Няма предмети в базата за индекси ${JSON.stringify(slot.index)}`);
    }
  });

  // 6. Давам ти финален доклад
  console.log('\n--- ФИНАЛЕН ДОКЛАД ---');
  console.log(`Общо клетки: ${slots.length}`);
  console.log(`Запълними клетки: ${validCount}`);
  if (validCount < slots.length) {
    console.log(`🔴 Нивото е НЕРЕШИМО, защото ${slots.length - validCount} клетки не могат да бъдат запълнени.`);
  } else {
    console.log(`🟢 Нивото изглежда РЕШИМО.`);
  }
}

// Взимаме ID-то на layout-а от командния ред, ако не е подадено - използва 'd2'
const layoutIdToCheck = process.argv[2] || 'd2';

checkLayout(layoutIdToCheck).finally(() => {
  process.exit(0);
});