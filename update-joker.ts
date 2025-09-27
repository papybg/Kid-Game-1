import { db } from './server/db.ts';
import { gameItems } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

async function updateJokerItem() {
  try {
    console.log('Обновяване на жокер елемента...');

    // Намери елемента с име "test" и му задай индекс 'js' (joker)
    const result = await db.update(gameItems)
      .set({ index: 'js' })
      .where(eq(gameItems.name, 'test'));

    console.log('✅ Жокер елементът е обновен успешно!');
    console.log('Резултат:', result);
  } catch (error) {
    console.error('❌ Грешка при обновяване на жокер елемента:', error);
  }
}

updateJokerItem();