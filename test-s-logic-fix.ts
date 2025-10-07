import { db } from './server/db';
import { gameItems } from './shared/schema';

// Симулираме API call към game session
async function testGameSessionAPI() {
  console.log('=== ТЕСТ: API CALL D1 + K1 ===\n');

  try {
    const response = await fetch('http://localhost:3005/api/game-session/d1?device=desktop&mode=simple&variant=k1');
    
    if (!response.ok) {
      console.log(`❌ API грешка: ${response.status} ${response.statusText}`);
      return;
    }

    const data: any = await response.json();
    
    console.log('📊 API Response данни:');
    console.log(`  Брой клетки: ${data.cells.length}`);
    console.log(`  Брой предмети: ${data.items.length}`);
    console.log(`  Level type: ${data.levelType}`);
    console.log();

    console.log('🎯 Клетки (cells):');
    data.cells.forEach((cell, i) => {
      console.log(`  Cell ${i + 1}: ID=${cell.id}, Index=[${cell.index.join(', ')}], Position=${cell.position.top}, ${cell.position.left}`);
    });
    console.log();

    console.log('🎮 Предмети (items):');
    data.items.forEach((item, i) => {
      console.log(`  Item ${i + 1}: ID=${item.id}, Index="${item.index}", Name="${item.name}"`);
    });
    console.log();

    // Проверяваме за S предмети
    const sItems = data.items.filter(item => item.index.startsWith('s'));
    console.log('🔍 S предмети в сесията:');
    sItems.forEach(item => {
      console.log(`  ${item.index}: ${item.name}`);
    });
    console.log();

    // Проверяваме S клетки
    const sCells = data.cells.filter(cell => cell.index.some(idx => idx.startsWith('s')));
    console.log('🎪 S клетки в сесията:');
    sCells.forEach(cell => {
      console.log(`  Cell ID=${cell.id}, Index=[${cell.index.join(', ')}]`);
    });
    console.log();

    // Анализираме дали логиката работи правилно
    console.log('📋 АНАЛИЗ НА ЛОГИКАТА:');
    
    // Намираме slots със "s" индекс
    const sSlots = data.cells.filter(cell => cell.index.includes('s'));
    
    if (sSlots.length > 0) {
      console.log('  Slots с "s" индекс:');
      sSlots.forEach(slot => {
        console.log(`    Slot ${slot.id}: [${slot.index.join(', ')}]`);
        
        // Проверяваме кои предмети могат да влязат
        console.log('    Предмети които могат да влязат:');
        
        // Exact match предмети
        const exactItems = data.items.filter(item => slot.index.includes(item.index));
        exactItems.forEach(item => {
          console.log(`      ✅ ${item.index}: ${item.name} (exact match)`);
        });
        
        // StartsWith предмети (според документацията)
        const startsWithItems = data.items.filter(item => 
          !slot.index.includes(item.index) && // не exact
          slot.index.some(slotIdx => item.index.startsWith(slotIdx))
        );
        startsWithItems.forEach(item => {
          console.log(`      ✅ ${item.index}: ${item.name} (startsWith match)`);
        });
        
        console.log();
      });
    }

    // Специфично за SA предмети в S slots
    const saItems = data.items.filter(item => item.index === 'sa');
    const pureSSLots = data.cells.filter(cell => cell.index.includes('s') && !cell.index.includes('sa'));
    
    if (saItems.length > 0 && pureSSLots.length > 0) {
      console.log('🧪 СПЕЦИФИЧЕН ТЕСТ: SA предмети в S slots');
      saItems.forEach(saItem => {
        pureSSLots.forEach(sSlot => {
          const canEnter = sSlot.index.some(slotIdx => saItem.index.startsWith(slotIdx));
          console.log(`    ${saItem.index} предмет може да влезе в slot [${sSlot.index.join(', ')}]: ${canEnter ? '✅ ДА' : '❌ НЕ'}`);
        });
      });
    }

  } catch (error) {
    console.error('❌ Грешка при API call:', error.message);
  }
}

// Стартираме теста
testGameSessionAPI().catch(console.error);