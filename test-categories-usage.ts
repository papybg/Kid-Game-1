import { config } from "dotenv";
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env') });

import { getStorage } from "./server/storage";

async function testCategoriesUsage() {
  console.log('🔍 ТЕСТ: Как точно се използва categories_indices таблицата\n');
  
  try {
    const storage = await getStorage();
    
    // 1. Проверяваме какви данни има в categories_indices
    console.log('📋 Стъпка 1: Какво има в categories_indices таблицата');
    const categories = await storage.getCategoriesIndices();
    console.log(`   → Намерени ${categories.length} записа:`);
    categories.forEach(cat => {
      console.log(`   • ID: ${cat.id}, Index: "${cat.indexValue}", Category: "${cat.categoryName}", Description: "${cat.description || 'null'}"`);
    });
    
    console.log('\n📋 Стъпка 2: Как API endpoint-ът обработва данните');
    console.log('   Endpoint: GET /api/admin/categories');
    console.log('   Директно връща резултата от getCategoriesIndices()');
    
    console.log('\n📋 Стъпка 3: Как client-ът обработва данните в PortalEditor');
    console.log('   В PortalEditor-clean.tsx, loadCategories() функцията:');
    
    // Симулираме как client-ът обработва данните
    const indices = categories.map((cat) => ({
      value: cat.indexValue,
      label: `${cat.indexValue} - ${cat.categoryName}${cat.description ? ` (${cat.description})` : ''}`
    }));
    
    console.log('   → Преобразува данните в dropdown опции:');
    indices.forEach(index => {
      console.log(`   • value: "${index.value}", label: "${index.label}"`);
    });
    
    console.log('\n📋 Стъпка 4: Къде се използват тези данни в UI');
    console.log('   В PortalEditor когато редактирате slot:');
    console.log('   • Desktop tab → Properties panel → Index dropdown');
    console.log('   • Mobile tab → Properties panel → Index dropdown');
    console.log('   • Опциите се филтрират да не показват вече избрани индекси');
    
    console.log('\n📋 Стъпка 5: Как се записват обратно в portal данните');
    console.log('   Когато избирате индекс от dropdown:');
    console.log('   • Записва се само value-то (напр. "sa", "sg") в slot.index[]');
    console.log('   • Label-ът се използва само за показване в UI');
    console.log('   • При запазване на portal се записва само индекса в layout.slots_desktop');
    
    console.log('\n📋 Стъпка 6: Проверяваме дали има портали които използват тези индекси');
    const portals = await storage.getPortals();
    console.log(`   → Намерени ${portals.length} портала`);
    
    for (const portal of portals) {
      console.log(`   Portal ${portal.id}:`);
      if (portal.layouts && portal.layouts.length > 0) {
        const layout = await storage.getGameLayout(portal.layouts[0]);
        if (layout?.slots_desktop) {
          const usedIndices = new Set<string>();
          layout.slots_desktop.forEach(slot => {
            slot.index.forEach(idx => usedIndices.add(idx));
          });
          console.log(`     → Използва индекси: [${Array.from(usedIndices).join(', ')}]`);
          
          // Проверяваме кои от тези индекси са дефинирани в categories_indices
          const definedIndices = new Set(categories.map(c => c.indexValue));
          const undefinedIndices = Array.from(usedIndices).filter(idx => !definedIndices.has(idx));
          if (undefinedIndices.length > 0) {
            console.log(`     ⚠️  Недефинирани индекси: [${undefinedIndices.join(', ')}]`);
          }
        }
      }
    }
    
    console.log('\n🎯 ЗАКЛЮЧЕНИЕ:');
    console.log('categories_indices таблицата служи като:');
    console.log('• Речник за читаеми имена на индексите в PortalEditor UI');
    console.log('• Не влияе на логиката на играта - използва се само в admin интерфейса');
    console.log('• Помага на админа да знае какво означава всеки индекс код');
    
  } catch (error) {
    console.error('❌ Грешка в теста:', error);
  }
}

testCategoriesUsage();