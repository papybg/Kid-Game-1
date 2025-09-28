import { db } from '../../../../server/db.js';
import { gameItems } from '../../../../shared/schema.js';
import { eq } from 'drizzle-orm';

async function checkPoliceCar() {
  const policeCars = await db.select().from(gameItems).where(eq(gameItems.name, 'полицейска кола'));

  console.log('🔍 Проверка за полицейска кола:');
  console.log(`Намерени записи: ${policeCars.length}`);

  policeCars.forEach((car: any, index: number) => {
    console.log(`${index + 1}. ID: ${car.id}, Name: ${car.name}, Index: ${car.index}, Audio: ${car.audio}`);
  });

  // Провери и за други варианти на името
  const allItems = await db.select().from(gameItems);
  const policeItems = allItems.filter((item: any) =>
    item.name.toLowerCase().includes('полицей') ||
    item.name.toLowerCase().includes('police')
  );

  if (policeItems.length > 0) {
    console.log('');
    console.log('Всички предмети свързани с полиция:');
    policeItems.forEach((item: any, index: number) => {
      console.log(`${index + 1}. ID: ${item.id}, Name: ${item.name}, Index: ${item.index}`);
    });
  }

  process.exit(0);
}
checkPoliceCar();