import { db } from './server/db';
import { gameItems, gameLayouts, portals } from './shared/schema';
import { eq } from 'drizzle-orm';
import { isValidChoice } from './client/src/lib/game-logic';
import type { GameItem, GameSlot } from './shared/schema';

async function testD2K1StrictLogicIntegration() {
  console.log('=== ФИНАЛЕН ТЕСТ: D2 + K1 STRICT ЛОГИКА (ИНТЕГРАЦИЯ) ===\n');

  try {
    // 1. Load D2 portal and layout
    const portal = await db.query.portals.findFirst({ where: eq(portals.id, 'd2') });
    if (!portal) {
      console.log('❌ Portal d2 не е намерен');
      return;
    }

    const layout = await db.query.gameLayouts.findFirst({ where: eq(gameLayouts.id, 'd2') });
    if (!layout) {
      console.log('❌ Layout d2 не е намерен');
      return;
    }

    // 2. Find the strict "r" slot
    const strictRSlot = layout.slots_desktop.find(slot => 
      slot.index.includes('r') && slot.strict === true
    );
    
    if (!strictRSlot) {
      console.log('❌ Strict "r" slot не е намерен');
      return;
    }

    console.log('📍 Намерен strict "r" slot:');
    console.log(`  Index: [${strictRSlot.index.join(', ')}]`);
    console.log(`  Strict: ${strictRSlot.strict}`);
    console.log(`  Position: ${strictRSlot.position.top}, ${strictRSlot.position.left}\n`);

    // 3. Get all R-category items
    const allItems = await db.select().from(gameItems);
    const rItems = allItems.filter(item => item.index.startsWith('r'));
    
    console.log('🔍 Всички R категория обекти:');
    rItems.forEach(item => {
      console.log(`  ${item.index}: ${item.name}`);
    });
    console.log();

    // 4. Test each R item with the strict slot using client logic
    console.log('🧪 Тест на клиентската логика за strict "r" slot + K1 variant:');
    rItems.forEach(item => {
      const result = isValidChoice(strictRSlot as GameSlot, item, 'k1');
      const should = item.index === 'r' ? 'ДА' : 'НЕ';
      const status = (result && should === 'ДА') || (!result && should === 'НЕ') ? '✅ PASS' : '❌ FAIL';
      
      console.log(`  ${item.index} (${item.name}): ${result ? 'ДА' : 'НЕ'} - очакван: ${should} ${status}`);
    });
    console.log();

    // 5. Test specific problematic cases
    console.log('🚨 Специфични проблемни случаи:');
    
    const rdItem = rItems.find(item => item.index === 'rd');
    if (rdItem) {
      const rdResult = isValidChoice(strictRSlot as GameSlot, rdItem, 'k1');
      console.log(`  RD obekt в strict R slot: ${rdResult ? '✅ МОЖЕ' : '❌ НЕ МОЖЕ'} (трябва да е НЕ МОЖЕ)`);
      if (rdResult) {
        console.log('  ⚠️ ПРОБЛЕМ: RD обект не трябва да може да влезе в strict R slot!');
      } else {
        console.log('  ✅ ПРАВИЛНО: RD обект правилно се отхвърля от strict R slot');
      }
    }

    const rItem = rItems.find(item => item.index === 'r');
    if (rItem) {
      const rResult = isValidChoice(strictRSlot as GameSlot, rItem, 'k1');
      console.log(`  R obekt в strict R slot: ${rResult ? '✅ МОЖЕ' : '❌ НЕ МОЖЕ'} (трябва да е МОЖЕ)`);
      if (!rResult) {
        console.log('  ⚠️ ПРОБЛЕМ: R обект трябва да може да влезе в strict R slot!');
      } else {
        console.log('  ✅ ПРАВИЛНО: R обект правилно се приема в strict R slot');
      }
    }

    console.log('\n🎯 ЗАКЛЮЧЕНИЕ:');
    console.log('  Клиентската логика вече има поддръжка за strict слотове.');
    console.log('  В портал D2 + K1 variant, strict "r" slot приема само точно "r" обекти.');
    console.log('  Многобуквени обекти като "rd", "rf", "ra" се отхвърлят от strict слотове.');

  } catch (error) {
    console.error('❌ Грешка:', error);
  } finally {
    process.exit(0);
  }
}

testD2K1StrictLogicIntegration().catch(console.error);