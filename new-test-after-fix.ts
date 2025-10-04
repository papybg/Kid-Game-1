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

async function runNewTests() {
  console.log('=== НОВ ТЕСТ СЛЕД ПРОМЯНАТА ===\n');

  const testCases = [
    { 
      url: 'http://localhost:3005/api/game-session/d2?device=desktop&mode=simple', 
      description: 'D2 без variant' 
    },
    { 
      url: 'http://localhost:3005/api/game-session/d2?device=desktop&mode=simple&variant=t1', 
      description: 'D2 с variant=t1' 
    },
    { 
      url: 'http://localhost:3005/api/game-session/d2?device=desktop&mode=simple&variant=k1', 
      description: 'D2 с variant=k1' 
    },
    { 
      url: 'http://localhost:3005/api/game-session/d1?device=desktop&mode=simple&variant=t1', 
      description: 'D1 с variant=t1 (за сравнение)' 
    }
  ];

  for (const testCase of testCases) {
    console.log(`🧪 ${testCase.description}`);
    
    try {
      const response = await testAPI(testCase.url);

      console.log(`   URL: ${testCase.url}`);
      console.log(`   Клетки: ${response.cells.length}`);
      console.log(`   Предмети: ${response.items.length}`);
      console.log(`   Level type: ${response.levelType}`);

      const correctItems = response.items.filter((item: any) => item.index !== 'js' && item.index !== 'z');
      const jokerItems = response.items.filter((item: any) => item.index === 'js' || item.index === 'z');
      
      console.log(`   Правилни предмети: ${correctItems.length}`);
      console.log(`   Joker предмети: ${jokerItems.length}`);

      if (response.cells.length !== correctItems.length) {
        console.log(`   ⚠️  MISMATCH: ${response.cells.length} клетки ≠ ${correctItems.length} правилни предмети`);
      } else {
        console.log(`   ✅ OK: клетки = правилни предмети`);
      }

      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (e: any) {
      console.log(`   ❌ Грешка: ${e.message}`);
    }
    
    console.log('');
  }

  console.log('🔄 Повторни тестове (5 пъти) за D2 с variant=t1:');
  
  for (let i = 1; i <= 5; i++) {
    try {
      const response = await testAPI('http://localhost:3005/api/game-session/d2?device=desktop&mode=simple&variant=t1');
      console.log(`   Тест ${i}: ${response.cells.length} клетки, ${response.items.length} предмети`);
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (e: any) {
      console.log(`   Тест ${i}: Грешка - ${e.message}`);
    }
  }

  process.exit(0);
}

runNewTests().catch(console.error);