import { db } from './server/db';
import { gameItems, gameLayouts, portals } from './shared/schema';
import { eq } from 'drizzle-orm';

// Симулираме exact client-side логиката
function isValidChoice(slot: any, item: any, variantId?: string): boolean {
  // Exact match always allowed
  if (slot.index.includes(item.index)) return true;

  if (variantId === 'k1') {
    // If strict: only exact match is allowed
    if (slot.strict) return false;

    // Non-strict: match by first character
    if (!item.index || item.index.length === 0) return false;
    const c = item.index[0];
    return slot.index.some((si: string) => si && si.length > 0 && si[0] === c);
  }

  // Default: startsWith
  return item.index ? slot.index.some((si: string) => si && item.index.startsWith(si)) : false;
}

async function testRealGameLogic() {
  console.log('=== РЕАЛЕН ТЕСТ: САМОЛЕТ В S СЛОТ ===\n');

  try {
    // Получаваме реална game session
    const response = await fetch('http://localhost:3005/api/game-session/d1?device=desktop&mode=simple&variant=k1');
    const gameSession: any = await response.json();

    console.log('📊 Game Session данни:');
    console.log(`  Брой клетки: ${gameSession.cells.length}`);
    console.log(`  Брой предмети: ${gameSession.items.length}`);
    console.log();

    // Намираме самолета и S слотове
    const samolet = gameSession.items.find((item: any) => item.name === 'Самолет');
    const sSlots = gameSession.cells.filter((cell: any) => 
      cell.index.includes('s') && !cell.index.includes('sa')
    );

    if (!samolet) {
      console.log('❌ Самолет не е намерен в сесията');
      return;
    }

    if (sSlots.length === 0) {
      console.log('❌ S слотове не са намерени в сесията');
      return;
    }

    console.log(`✈️  Самолет: Index="${samolet.index}", Name="${samolet.name}"`);
    console.log();

    console.log('🎯 S Слотове в сесията:');
    sSlots.forEach((slot: any, i: number) => {
      console.log(`  Slot ${i + 1}: ID=${slot.id}, Index=[${slot.index.join(', ')}]`);
    });
    console.log();

    // Тестваме client-side validation логиката
    console.log('🧪 CLIENT-SIDE VALIDATION TEST:');
    
    sSlots.forEach((slot: any, i: number) => {
      console.log(`\n  Slot ${i + 1} с индекс [${slot.index.join(', ')}]:`);
      
      // Test k1 логика
      const canPlaceK1 = isValidChoice(slot, samolet, 'k1');
      console.log(`    K1 variant: ${canPlaceK1 ? '✅ МОЖЕ' : '❌ НЕ МОЖЕ'}`);
      
      // Test default логика  
      const canPlaceDefault = isValidChoice(slot, samolet);
      console.log(`    Default variant: ${canPlaceDefault ? '✅ МОЖЕ' : '❌ НЕ МОЖЕ'}`);
      
      // Детайлен анализ
      console.log(`    Детайли:`);
      console.log(`      - Exact match (${samolet.index} in [${slot.index.join(', ')}]): ${slot.index.includes(samolet.index)}`);
      console.log(`      - StartsWith match: ${slot.index.some((si: string) => samolet.index.startsWith(si))}`);
      console.log(`      - First char match: ${slot.index.some((si: string) => si[0] === samolet.index[0])}`);
    });

    // Допълнителен тест - проверяваме SA слотове
    const saSlots = gameSession.cells.filter((cell: any) => cell.index.includes('sa'));
    if (saSlots.length > 0) {
      console.log('\n🛩️  SA Слотове за сравнение:');
      saSlots.forEach((slot: any, i: number) => {
        const canPlace = isValidChoice(slot, samolet, 'k1');
        console.log(`    SA Slot ${i + 1}: [${slot.index.join(', ')}] - ${canPlace ? '✅ МОЖЕ' : '❌ НЕ МОЖЕ'}`);
      });
    }

  } catch (error: any) {
    console.error('❌ Грешка:', error.message);
  }
}

testRealGameLogic().catch(console.error);