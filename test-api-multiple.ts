import * as http from 'http';

function testAPI(): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = 'http://localhost:3005/api/game-session/d2?device=desktop&mode=simple&variant=t1';

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

async function runTests() {
  for (let i = 0; i < 5; i++) {
    console.log(`\n--- Test ${i+1} ---`);
    try {
      const response = await testAPI();

      console.log('API Response:');
      console.log('- Cells:', response.cells.length);
      console.log('- Items:', response.items.length);
      console.log('- Level type:', response.levelType);

      const correctItems = response.items.filter((item: any) => item.index !== 'js');
      const jokerItems = response.items.filter((item: any) => item.index === 'js');
      console.log('- Correct items:', correctItems.length);
      console.log('- Joker items:', jokerItems.length);

      if (response.cells.length !== correctItems.length) {
        console.log('*** MISMATCH: Cells != Correct items ***');
      }

      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (e: any) {
      console.log('Error:', e.message);
    }
  }

  process.exit(0);
}

runTests().catch(console.error);