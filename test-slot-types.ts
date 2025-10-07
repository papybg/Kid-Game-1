import { db } from './server/db';

async function checkSlotTypes() {
  console.log('=== ПРОВЕРКА НА ТИПОВЕ СЛОТОВЕ ===\n');

  try {
    const response = await fetch('http://localhost:3005/api/game-session/d1?device=desktop&mode=simple&variant=k1');
    const gameSession: any = await response.json();

    console.log('📊 Анализ на слотовете в сесията:\n');

    gameSession.cells.forEach((cell: any, i: number) => {
      console.log(`Slot ${i + 1}:`);
      console.log(`  ID: ${cell.id}`);
      console.log(`  Index масив: [${cell.index.join(', ')}]`);
      console.log(`  Брой индекси в масива: ${cell.index.length}`);
      
      cell.index.forEach((idx: string, j: number) => {
        console.log(`    Индекс ${j + 1}: "${idx}" (дължина: ${idx.length} ${idx.length === 1 ? 'буква' : 'букви'})`);
      });
      console.log();
    });

    // Специфично за S и SA слотове
    const sSlots = gameSession.cells.filter((cell: any) => 
      cell.index.some((idx: string) => idx === 's')
    );
    
    const saSlots = gameSession.cells.filter((cell: any) => 
      cell.index.some((idx: string) => idx === 'sa')
    );

    console.log('🎯 S слотове (slot.index съдържа "s"):');
    sSlots.forEach((slot: any) => {
      console.log(`  ${slot.id}: [${slot.index.join(', ')}] - ${slot.index.length} ${slot.index.length === 1 ? 'индекс' : 'индекса'} в масива`);
    });

    console.log('\n🛩️  SA слотове (slot.index съдържа "sa"):');
    saSlots.forEach((slot: any) => {
      console.log(`  ${slot.id}: [${slot.index.join(', ')}] - ${slot.index.length} ${slot.index.length === 1 ? 'индекс' : 'индекса'} в масива`);
    });

    // Проверяваме логиката от game-logic.ts
    console.log('\n🧪 ЛОГИКА ПРОВЕРКА:');
    const samolet = gameSession.items.find((item: any) => item.name === 'Самолет');
    
    if (samolet && sSlots.length > 0) {
      const sSlot = sSlots[0];
      console.log(`\nЗа самолет (index: "${samolet.index}") в S slot (index: [${sSlot.index.join(', ')}]):`);
      console.log(`  - variantId === 'k1': true`);
      console.log(`  - slot.index.length === 1: ${sSlot.index.length === 1}`);
      console.log(`  - !slot.strict: ${!sSlot.strict} (strict: ${sSlot.strict})`);
      console.log(`  - item.index.length === 1: ${samolet.index.length === 1} (item.index: "${samolet.index}")`);
      
      if (sSlot.index.length === 1 && !sSlot.strict && samolet.index.length > 1) {
        console.log(`  → Влиза в специалната k1 логика за multi-letter items`);
        
        const hasFreeExactSlot = gameSession.cells.some((s: any) => s.index.includes(samolet.index));
        console.log(`  - hasFreeExactSlot (има ли свободен SA slot): ${hasFreeExactSlot}`);
        
        if (hasFreeExactSlot) {
          console.log(`  → Резултат: ❌ НЕ МОЖЕ (има свободен SA slot)`);
        } else {
          console.log(`  → Резултат: ✅ МОЖЕ (няма свободен SA slot)`);
        }
      }
    }

  } catch (error: any) {
    console.error('❌ Грешка:', error.message);
  }
}

checkSlotTypes().catch(console.error);