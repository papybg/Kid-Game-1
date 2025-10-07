import { db } from './server/db';
import { gameItems, gameLayouts, portals } from './shared/schema';
import { eq } from 'drizzle-orm';

async function testD1K1SIndexIssue() {
  console.log('=== ТЕСТ: D1 + K1 ПРОБЛЕМ С S ИНДЕКС ===\n');

  try {
    // 1. Проверяваме портал d1
    const portal = await db.query.portals.findFirst({ where: eq(portals.id, 'd1') });
    if (!portal) {
      console.log('❌ Portal d1 не е намерен');
      return;
    }

    console.log('📊 Portal d1 информация:');
    console.log(`  ID: ${portal.id}`);
    console.log(`  Name: ${portal.portalName}`);
    console.log(`  Layouts: ${JSON.stringify(portal.layouts)}`);
    console.log(`  Variant Settings: ${JSON.stringify(portal.variantSettings, null, 2)}`);
    console.log();

    // 2. Проверяваме layout d1
    const layout = await db.query.gameLayouts.findFirst({ where: eq(gameLayouts.id, 'd1') });
    if (!layout) {
      console.log('❌ Layout d1 не е намерен');
      return;
    }

    console.log('🎯 Layout d1 slots (desktop):');
    layout.slots_desktop.forEach((slot, i) => {
      console.log(`  Slot ${i + 1}: Index [${slot.index.join(', ')}] at ${slot.position.top}, ${slot.position.left}`);
    });
    console.log();

    // 3. Проверяваме всички обекти с индекс започващ с 's'
    const allItems = await db.select().from(gameItems);
    const sItems = allItems.filter(item => item.index.startsWith('s'));
    
    console.log('🔍 Всички обекти с индекс започващ с "s":');
    sItems.forEach(item => {
      console.log(`  ${item.index}: ${item.name} (категория: ${item.category})`);
    });
    console.log();

    // 4. Проверяваме кои slots в d1 използват 's' индекс
    const slotsWithS = layout.slots_desktop.filter(slot => 
      slot.index.some(idx => idx.startsWith('s'))
    );
    
    console.log('🎪 Slots в d1 които използват "s" индекс:');
    slotsWithS.forEach((slot, i) => {
      console.log(`  Slot ${i + 1}: Index [${slot.index.join(', ')}]`);
      
      // За всеки s индекс, показваме кои обекти отговарят
      slot.index.forEach(idx => {
        if (idx.startsWith('s')) {
          const matchingItems = allItems.filter(item => item.index === idx);
          console.log(`    Index "${idx}": ${matchingItems.length} обекта - [${matchingItems.map(item => item.name).join(', ')}]`);
        }
      });
    });
    console.log();

    // 5. Симулираме генериране на сесия за d1 с k1 variant
    console.log('🎮 Симулация на game session d1 + k1:');
    
    // Вземаме k1 settings от portal
    const k1Settings = portal.variantSettings?.k1;
    if (!k1Settings) {
      console.log('❌ K1 variant settings не са намерени в portal');
      return;
    }
    
    console.log(`  K1 Settings: minCells=${k1Settings.minCells}, maxCells=${k1Settings.maxCells}, hasExtraItems=${k1Settings.hasExtraItems}`);
    
    // Определяваме броя клетки за k1
    const cellCount = Math.floor(Math.random() * (k1Settings.maxCells - k1Settings.minCells + 1)) + k1Settings.minCells;
    console.log(`  Генериран брой клетки: ${cellCount}`);
    
    // Вземаме първите cellCount slots
    const activeSlots = layout.slots_desktop.slice(0, cellCount);
    console.log(`  Активни slots: ${activeSlots.length}`);
    
    // За всеки slot, събираме възможните обекти
    let totalPossibleItems: typeof allItems = [];
    console.log('\n  📋 Анализ по slots:');
    
    activeSlots.forEach((slot, i) => {
      console.log(`    Slot ${i + 1}: Index [${slot.index.join(', ')}]`);
      
      slot.index.forEach(idx => {
        const matchingItems = allItems.filter(item => item.index === idx);
        console.log(`      Index "${idx}": ${matchingItems.length} обекта`);
        
        if (idx.startsWith('s')) {
          console.log(`        ⚠️  S-Index detected! Items: [${matchingItems.map(item => item.name).join(', ')}]`);
        }
        
        totalPossibleItems.push(...matchingItems);
      });
    });
    
    console.log(`\n  📊 Общо възможни обекти: ${totalPossibleItems.length}`);
    console.log(`  📊 Уникални обекти: ${new Set(totalPossibleItems.map(item => item.id)).size}`);
    
    // Проверяваме дали има проблем с s индексите
    const sItemsInSession = totalPossibleItems.filter(item => item.index.startsWith('s'));
    if (sItemsInSession.length > 0) {
      console.log(`\n  ⚠️  ПОТЕНЦИАЛЕН ПРОБЛЕМ: ${sItemsInSession.length} обекта с S индекс в сесията:`);
      sItemsInSession.forEach(item => {
        console.log(`    ${item.index}: ${item.name}`);
      });
    }

  } catch (error) {
    console.error('❌ Грешка:', error);
  } finally {
    process.exit(0);
  }
}

testD1K1SIndexIssue().catch(console.error);