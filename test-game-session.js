import fetch from 'node-fetch';

async function testGameSession() {
  try {
    console.log('Тестване на генериране на игра за портал d2...\n');

    const response = await fetch('http://localhost:3005/api/game-session/d2?mode=simple');
    const data = await response.json();

    console.log(`Брой клетки: ${data.cells.length}`);
    console.log(`Брой елементи: ${data.items.length}`);
    console.log(`Тип ниво: ${data.levelType}`);
    console.log(`Име на лейаут: ${data.layout.name}`);

    console.log('\nПървите 3 елемента:');
    data.items.slice(0, 3).forEach((item, i) => {
      console.log(`${i + 1}. ${item.name} (${item.index})`);
    });

    if (data.cells.length === data.items.length) {
      console.log('\n✅ УСПЕХ: Броят елементи съвпада с броя клетки!');
    } else {
      console.log(`\n❌ ПРОБЛЕМ: ${data.items.length} елемента за ${data.cells.length} клетки`);
    }

  } catch (error) {
    console.error('Грешка при тестване:', error.message);
  }
}

testGameSession();