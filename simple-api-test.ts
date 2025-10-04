import * as http from 'http';

async function simpleTest() {
  console.log('🧪 Прост тест на API...\n');

  const url = 'http://localhost:3005/api/game-session/d2?device=desktop&mode=simple';
  
  try {
    const response = await new Promise<any>((resolve, reject) => {
      http.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            console.log('📄 Raw response:', data.substring(0, 500));
            reject(new Error('Parse error: ' + e.message));
          }
        });
      }).on('error', (err) => {
        console.log('🔌 Connection error:', err.message);
        reject(err);
      });
    });

    console.log('✅ Успешна заявка!');
    console.log('📊 Клетки:', response.cells?.length || 'няма');
    console.log('📦 Предмети:', response.items?.length || 'няма');
    console.log('🎯 Level type:', response.levelType || 'няма');
    
  } catch (error: any) {
    console.log('❌ Грешка:', error.message);
  }

  process.exit(0);
}

simpleTest();