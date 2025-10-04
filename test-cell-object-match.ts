import * as http from 'http';

function testAPI(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          reject(new Error('Parse error: ' + data.substring(0, 200)));
        }
      });
    }).on('error', reject);
  });
}

async function testCellObjectMatch() {
  console.log('=== ТЕСТ: КЛЕТКИ = ОБЕКТИ (min_cells=9, max_cells=9) ===\n');

  const baseUrl = 'http://localhost:3005/api/game-session/d2?device=desktop&mode=simple';
  
  console.log('🎯 ЦЕЛ: Проверка дали се генерират точно 9 клетки и 9 обекта\n');

  // Test без variant параметър (трябва да използва portal настройки)
  console.log('📋 Тест 1: D2 без variant (portal настройки: min_cells=9, max_cells=9)');
  
  for (let i = 1; i <= 10; i++) {
    try {
      const response = await testAPI(baseUrl);
      
      const correctItems = response.items.filter((item: any) => 
        item.index !== 'js' && item.index !== 'z'
      );
      const jokerItems = response.items.filter((item: any) => 
        item.index === 'js' || item.index === 'z'
      );
      
      const cellsCount = response.cells.length;
      const itemsCount = response.items.length;
      const correctItemsCount = correctItems.length;
      const jokersCount = jokerItems.length;
      
      const isCorrect = (cellsCount === 9 && itemsCount === 9 && correctItemsCount === 9 && jokersCount === 0);
      const status = isCorrect ? '✅' : '❌';
      
      console.log(`   Тест ${i.toString().padStart(2)}: ${status} Клетки=${cellsCount}, Всички предмети=${itemsCount}, Правилни=${correctItemsCount}, Jokers=${jokersCount}`);
      
      if (!isCorrect) {
        console.log(`              ⚠️  Очаквано: 9 клетки, 9 предмета, 9 правилни, 0 jokers`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (e: any) {
      console.log(`   Тест ${i.toString().padStart(2)}: ❌ Грешка - ${e.message}`);
    }
  }

  console.log('\n📊 СТАТИСТИКА:');
  
  // Събиране на статистика
  const stats = { 
    cells: [] as number[], 
    items: [] as number[], 
    correct: [] as number[], 
    jokers: [] as number[] 
  };
  
  for (let i = 1; i <= 20; i++) {
    try {
      const response = await testAPI(baseUrl);
      
      const correctItems = response.items.filter((item: any) => 
        item.index !== 'js' && item.index !== 'z'
      );
      const jokerItems = response.items.filter((item: any) => 
        item.index === 'js' || item.index === 'z'
      );
      
      stats.cells.push(response.cells.length);
      stats.items.push(response.items.length);
      stats.correct.push(correctItems.length);
      stats.jokers.push(jokerItems.length);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (e) {
      // Skip errors
    }
  }
  
  function getStats(arr: number[]) {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const avg = (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
    return { min, max, avg, count: arr.length };
  }
  
  const cellStats = getStats(stats.cells);
  const itemStats = getStats(stats.items);
  const correctStats = getStats(stats.correct);
  const jokerStats = getStats(stats.jokers);
  
  console.log(`   Клетки:        мин=${cellStats.min}, макс=${cellStats.max}, средно=${cellStats.avg} (${cellStats.count} теста)`);
  console.log(`   Всички предмети: мин=${itemStats.min}, макс=${itemStats.max}, средно=${itemStats.avg} (${itemStats.count} теста)`);
  console.log(`   Правилни:      мин=${correctStats.min}, макс=${correctStats.max}, средно=${correctStats.avg} (${correctStats.count} теста)`);
  console.log(`   Jokers:        мин=${jokerStats.min}, макс=${jokerStats.max}, средно=${jokerStats.avg} (${jokerStats.count} теста)`);
  
  console.log('\n🎯 ЗАКЛЮЧЕНИЕ:');
  
  const allNine = stats.cells.every(c => c === 9) && 
                  stats.items.every(i => i === 9) && 
                  stats.correct.every(c => c === 9) && 
                  stats.jokers.every(j => j === 0);
  
  if (allNine) {
    console.log('   ✅ УСПЕХ: Винаги се генерират точно 9 клетки и 9 правилни предмета');
    console.log('   ✅ ФОРМУЛА: 1 клетка = 1 правилен предмет (без jokers)');
    console.log('   ✅ ЛОГИКА: min_cells=max_cells=9 работи правилно');
  } else {
    console.log('   ❌ ПРОБЛЕМ: Не винаги се генерират 9 клетки и 9 предмета');
    console.log('   ⚠️  НЕОБХОДИМА КОРЕКЦИЯ в логиката');
  }

  process.exit(0);
}

testCellObjectMatch().catch(console.error);