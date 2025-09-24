import { db } from './server/db.ts';
import { categoriesIndices } from './shared/schema.ts';

(async () => {
  try {
    // Добави категориите с ръчно ID (следващото е 7)
    const categories = [
      { id: 7, categoryName: 'джунгла', indexValue: 'j', description: 'Животни от джунглата' },
      { id: 8, categoryName: 'океан', indexValue: 'o', description: 'Морски животни' },
      { id: 9, categoryName: 'други', indexValue: 'd', description: 'Други обекти' }
    ];
    
    for (const cat of categories) {
      const inserted = await db.insert(categoriesIndices).values(cat).returning();
      console.log('✅ Добавена категория:', inserted[0]);
    }
    
    console.log('\n🎉 Всички категории добавени успешно!');
    
  } catch (error) {
    console.error('❌ Грешка:', error.message);
  } finally {
    process.exit(0);
  }
})();