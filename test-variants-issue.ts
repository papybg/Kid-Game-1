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

async function testVariants() {
  console.log('=== ТЕСТ НА D2 С VARIANTS ===\n');

  const testCases = [
    { 
      url: 'http://localhost:3005/api/game-session/d2?device=desktop&mode=simple', 
      description: 'D2 БЕЗ variant',
      expected: '9 клетки (portal настройки: min_cells=9, max_cells=9)'
    },
    { 
      url: 'http://localhost:3005/api/game-session/d2?device=desktop&mode=simple&variant=t1', 
      description: 'D2 с variant=t1',
      expected: '9 клетки (трябва да игнорира variant settings)'
    },
    { 
      url: 'http://localhost:3005/api/game-session/d2?device=desktop&mode=simple&variant=k1', 
      description: 'D2 с variant=k1',
      expected: '9 клетки (трябва да игнорира variant settings)'
    }
  ];

  for (const testCase of testCases) {
    console.log(`🧪 ${testCase.description}`);
    console.log(`   Очаквано: ${testCase.expected}`);
    
    // Run multiple tests
    const results = [];
    
    for (let i = 1; i <= 10; i++) {
      try {
        const response = await testAPI(testCase.url);
        
        const correctItems = response.items.filter((item: any) => 
          item.index !== 'js' && item.index !== 'z'
        );
        
        results.push({
          cells: response.cells.length,
          items: response.items.length,
          correct: correctItems.length,
          levelType: response.levelType
        });
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (e: any) {
        console.log(`   Тест ${i}: Грешка - ${e.message}`);
      }
    }
    
    // Analyze results
    const cellCounts = results.map(r => r.cells);
    const itemCounts = results.map(r => r.items);
    const correctCounts = results.map(r => r.correct);
    const levelTypes = results.map(r => r.levelType);
    
    const uniqueCells = [...new Set(cellCounts)];
    const uniqueItems = [...new Set(itemCounts)];
    const uniqueCorrect = [...new Set(correctCounts)];
    const uniqueLevelTypes = [...new Set(levelTypes)];
    
    console.log(`   Резултати (${results.length} теста):`);
    console.log(`     Клетки: ${uniqueCells.join(', ')} ${uniqueCells.length === 1 ? '✅ консистентно' : '❌ променливо'}`);
    console.log(`     Предмети: ${uniqueItems.join(', ')} ${uniqueItems.length === 1 ? '✅ консистентно' : '❌ променливо'}`);
    console.log(`     Правилни: ${uniqueCorrect.join(', ')} ${uniqueCorrect.length === 1 ? '✅ консистентно' : '❌ променливо'}`);
    console.log(`     Level type: ${uniqueLevelTypes.join(', ')}`);
    
    // Check if meets expectation
    const isCorrect = uniqueCells.length === 1 && uniqueCells[0] === 9;
    console.log(`   Статус: ${isCorrect ? '✅ ПРАВИЛНО' : '❌ ГРЕШНО'}`);
    
    if (!isCorrect) {
      console.log(`   ⚠️  ПРОБЛЕМ: Очаквани 9 клетки, получени ${uniqueCells.join(', ')}`);
    }
    
    console.log('');
  }

  console.log('🔍 ДЕТАЙЛЕН АНАЛИЗ НА VARIANT SETTINGS:\n');

  // Check current database state
  console.log('Ще проверя текущото състояние на базата данни...');

  process.exit(0);
}

testVariants().catch(console.error);