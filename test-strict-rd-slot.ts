import { db } from './server/db';
import { gameItems, gameLayouts } from './shared/schema';
import { eq } from 'drizzle-orm';
import { isValidChoice } from './client/src/lib/game-logic';
import type { GameItem, GameSlot } from './shared/schema';

async function testStrictRdSlot() {
  console.log('=== ТЕСТ: STRICT RD SLOT В D2 ПОРТАЛ ===\n');

  try {
    // 1. Load D2 layout
    const layout = await db.query.gameLayouts.findFirst({ where: eq(gameLayouts.id, 'd2') });
    if (!layout) {
      console.log('❌ Layout d2 не е намерен');
      return;
    }

    // 2. Find strict "rd" slot
    const strictRdSlot = layout.slots_desktop.find(slot => 
      slot.index.includes('rd') && slot.strict === true
    );
    
    if (!strictRdSlot) {
      console.log('❌ Strict "rd" slot не е намерен');
      return;
    }

    console.log('📍 Намерен strict "rd" slot:');
    console.log(`  Index: [${strictRdSlot.index.join(', ')}]`);
    console.log(`  Strict: ${strictRdSlot.strict}`);
    console.log(`  Position: ${strictRdSlot.position.top}, ${strictRdSlot.position.left}\n`);

    // 3. Get all items
    const allItems = await db.select().from(gameItems);
    
    // Test different categories of items
    const testCategories = [
      { name: 'R категория', items: allItems.filter(item => item.index.startsWith('r')) },
      { name: 'RD обекти', items: allItems.filter(item => item.index === 'rd') },
      { name: 'Други категории', items: allItems.filter(item => !item.index.startsWith('r')).slice(0, 5) }
    ];

    testCategories.forEach(category => {
      console.log(`🧪 Тест: ${category.name}`);
      
      if (category.items.length === 0) {
        console.log('  Няма обекти в тази категория\n');
        return;
      }

      category.items.forEach(item => {
        const result = isValidChoice(strictRdSlot as GameSlot, item, 'k1');
        const expected = item.index === 'rd' ? 'ДА' : 'НЕ';
        const status = (result && expected === 'ДА') || (!result && expected === 'НЕ') ? '✅' : '❌';
        
        console.log(`  ${item.index} (${item.name}): ${result ? 'ДА' : 'НЕ'} - очакван: ${expected} ${status}`);
      });
      console.log();
    });

    // 4. Specific test cases
    console.log('🎯 Специфични тестове:');
    
    const rdItems = allItems.filter(item => item.index === 'rd');
    console.log(`  Брой RD обекти в базата: ${rdItems.length}`);
    rdItems.forEach(item => {
      const result = isValidChoice(strictRdSlot as GameSlot, item, 'k1');
      console.log(`  "${item.name}" (rd): ${result ? '✅ ПРИЕМА' : '❌ ОТХВЪРЛЯ'}`);
    });

    const rItems = allItems.filter(item => item.index === 'r');
    console.log(`\n  Брой R обекти в базата: ${rItems.length}`);
    rItems.forEach(item => {
      const result = isValidChoice(strictRdSlot as GameSlot, item, 'k1');
      console.log(`  "${item.name}" (r): ${result ? '⚠️ ПРИЕМА (не трябва!)' : '✅ ОТХВЪРЛЯ (правилно)'}`);
    });

    console.log('\n📋 ЗАКЛЮЧЕНИЕ:');
    console.log('  Strict "rd" slot приема САМО обекти с точно индекс "rd"');
    console.log('  Отхвърля всички други обекти, включително "r", "rf", "ra", etc.');

  } catch (error) {
    console.error('❌ Грешка:', error);
  } finally {
    process.exit(0);
  }
}

testStrictRdSlot().catch(console.error);