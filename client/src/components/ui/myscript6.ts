import { db } from '../../../../server/db.js';
import { gameItems } from '../../../../shared/schema.js';
import { eq } from 'drizzle-orm';

async function checkItem19() {
  const item = await db.select().from(gameItems).where(eq(gameItems.id, 19));

  if (item[0]) {
    console.log('Предмет с ID 19:');
    console.log(`Име: ${item[0].name}`);
    console.log(`Индекс: ${item[0].index}`);
    console.log(`Категория: ${item[0].category}`);
  } else {
    console.log('Няма предмет с ID 19');
  }

  process.exit(0);
}
checkItem19();