import { db } from './server/db.ts';
import { gameVariants } from './shared/schema.ts';

async function seedGameVariants() {
  try {
    console.log('Добавяне на варианти за играта...');

    const variants = [
      {
        id: 't1',
        name: 'toddlers',
        displayName: 'За мъници',
        description: 'За деца 2-4 години - прости игри с малко елементи'
      },
      {
        id: 'k1',
        name: 'kids',
        displayName: 'За малчугани',
        description: 'За деца 4-6 години - средна сложност'
      },
      {
        id: 'e1',
        name: 'experts',
        displayName: 'За батковци',
        description: 'За деца 8+ години - сложни игри с много елементи'
      }
    ];

    for (const variant of variants) {
      await db.insert(gameVariants).values(variant);
      console.log(`✅ Добавен вариант: ${variant.displayName} (${variant.id})`);
    }

    console.log('✅ Всички варианти са добавени успешно!');
  } catch (error) {
    console.error('❌ Грешка при добавяне на вариантите:', error);
  }
}

seedGameVariants();