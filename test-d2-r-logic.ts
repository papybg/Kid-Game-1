import { db } from './server/db';
import { gameItems, gameLayouts, portals } from './shared/schema';
import { eq } from 'drizzle-orm';

// Import the logic functions to test
import { findBestItemForCell, canItemGoInSlot } from './server/gameService';

async function testD2RLogic() {
  console.log('=== ТЕСТ: D2 + K1 STRICT SLOT "r" ЛОГИКА ===\n');

  try {
    // 1. Check portal D2
    const portal = await db.query.portals.findFirst({ where: eq(portals.id, 'd2') });
    if (!portal) {
      console.log('❌ Portal d2 не е намерен');
      return;
    }

    console.log('📊 Portal D2 информация:');
    console.log(`  ID: ${portal.id}`);
    console.log(`  Name: ${portal.portalName}`);
    console.log(`  Variant Settings: ${JSON.stringify(portal.variantSettings, null, 2)}`);
    console.log();

    // 2. Check layout D2
    const layout = await db.query.gameLayouts.findFirst({ where: eq(gameLayouts.id, 'd2') });
    if (!layout) {
      console.log('❌ Layout d2 не е намерен');
      return;
    }

    console.log('🎯 Layout D2 slots (desktop):');
    layout.slots_desktop.forEach((slot, i) => {
      console.log(`  Slot ${i + 1}: Index [${slot.index.join(', ')}] strict=${slot.strict} at ${slot.position.top}, ${slot.position.left}`);
    });
    console.log();

    // 3. Find the problematic "r" slot
    const rSlot = layout.slots_desktop.find(slot => 
      slot.index.includes('r') && slot.strict === true
    );
    
    if (!rSlot) {
      console.log('❌ Slot с индекс "r" и strict=true не е намерен');
      return;
    }

    console.log('🎪 Проблемен slot:');
    console.log(`  Index: [${rSlot.index.join(', ')}]`);
    console.log(`  Strict: ${rSlot.strict}`);
    console.log();

    // 4. Check all items with "r" index
    const allItems = await db.select().from(gameItems);
    const rItems = allItems.filter(item => item.index.startsWith('r'));
    
    console.log('🔍 Всички обекти с индекс започващ с "r":');
    rItems.forEach(item => {
      console.log(`  ${item.index}: ${item.name} (category: ${item.category})`);
    });
    console.log();

    // 5. Test what items can go in the "r" strict slot
    console.log('🧪 Тестване кои обекти могат да влязат в strict "r" slot:');
    rItems.forEach(item => {
      const canGo = canItemGoInSlot(item.index, rSlot.index);
      console.log(`  ${item.index} (${item.name}): ${canGo ? '✅ ДА' : '❌ НЕ'}`);
    });
    console.log();

    // 6. Test findBestItemForCell with the problematic slot
    console.log('🎯 Тестване findBestItemForCell за strict "r" slot:');
    const bestItem = findBestItemForCell(rSlot.index, rItems);
    
    if (bestItem) {
      console.log(`  Избран най-добър обект: ${bestItem.index} (${bestItem.name})`);
      console.log(`  Това е проблем ако обектът има повече от една буква в индекса!`);
    } else {
      console.log('  Няма намерен подходящ обект');
    }
    console.log();

    // 7. Test K1 variant logic specifically
    console.log('🚨 Тестване на K1 variant логиката:');
    console.log('   • K1 variant има правило: multi-letter обекти не могат в single-letter slots ако има choice slots');
    console.log('   • Slot "r" е single-letter');
    console.log('   • Обекти като "rd", "rf", "ra" са multi-letter');
    console.log('   • В D2 има choice slots, затова multi-letter обекти НЕ ТРЯБВА да влизат в "r" slot!');

  } catch (error) {
    console.error('❌ Грешка:', error);
  } finally {
    process.exit(0);
  }
}

testD2RLogic().catch(console.error);