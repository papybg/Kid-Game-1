import { db } from './server/db.ts';
import { gameItems } from './shared/schema.ts';

(async () => {
  try {
    console.log('=== АНАЛИЗ НА ИНДЕКСИ ===');
    const items = await db.select().from(gameItems);
    
    console.log('\n🔍 Обекти с индекс h:');
    items.filter(i => i.index === 'h').forEach(i => 
      console.log(`- ${i.name} (категория: ${i.category})`)
    );
    
    console.log('\n🔍 Обекти с индекс p:');
    items.filter(i => i.index === 'p').forEach(i => 
      console.log(`- ${i.name} (категория: ${i.category})`)
    );
    
    console.log('\n📊 ВСИЧКИ ИНДЕКСИ И КОЛИЧЕСТВА:');
    const indexCount = {};
    items.forEach(i => {
      indexCount[i.index] = (indexCount[i.index] || 0) + 1;
    });
    
    Object.entries(indexCount).sort().forEach(([index, count]) => 
      console.log(`Индекс '${index}': ${count} обекта`)
    );
    
    console.log('\n⚠️ ПОТЕНЦИАЛНИ ПРОБЛЕМИ:');
    // Проверка за дублирани индекси в различни категории
    const indexByCategory = {};
    items.forEach(i => {
      const key = `${i.index}-${i.category}`;
      if (!indexByCategory[key]) indexByCategory[key] = [];
      indexByCategory[key].push(i.name);
    });
    
    Object.entries(indexByCategory).forEach(([key, names]) => {
      const [index, category] = key.split('-');
      if (names.length > 1) {
        console.log(`🔥 Индекс '${index}' в категория '${category}': ${names.join(', ')}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Грешка:', error.message);
  } finally {
    process.exit(0);
  }
})();