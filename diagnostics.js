import { db } from './server/db.ts';
import { categoriesIndices, gameItems } from './shared/schema.ts';

(async () => {
  try {
    console.log('=== CATEGORIES_INDICIOS DATA ===');
    const categories = await db.select().from(categoriesIndices);
    categories.forEach((cat, i) => {
      console.log(i + 1, '. ID:', cat.id, ', Category:', cat.categoryName, ', Index:', cat.indexValue);
    });

    console.log('\n=== GAME_ITEMS DATA (sample) ===');
    const items = await db.select().from(gameItems).limit(10);
    items.forEach((item, i) => {
      console.log(i + 1, '. ID:', item.id, ', Name:', item.name, ', Category:', item.category, ', Index:', item.index);
    });

    console.log('\n=== UNIQUE CATEGORIES IN GAME_ITEMS ===');
    const uniqueCategories = [...new Set(items.map(item => item.category))];
    uniqueCategories.forEach(cat => console.log('- ', cat));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
})();