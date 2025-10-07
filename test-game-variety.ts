import { generateGameSession } from './server/gameService';
import { db } from './server/db';

async function testGameVariety() {
  console.log('=== ТЕСТ НА РАЗНООБРАЗИЕТО В ИГРОВИТЕ СЕСИИ ===\n');

  const portalId = 'd2';
  const deviceType = 'desktop';
  const gameMode = 'simple';
  const variantId = 'k1';
  const numTests = 10;

  console.log(`Генерирам ${numTests} игрови сесии за портал ${portalId}...\n`);

  const sessions = [];
  const allItemNames = new Set<string>();
  const itemFrequency = new Map<string, number>();

  try {
    // Generate multiple sessions
    for (let i = 0; i < numTests; i++) {
      const session = await generateGameSession(portalId, deviceType, gameMode, variantId);
      sessions.push({
        id: i + 1,
        cellCount: session.cells.length,
        itemCount: session.items.length,
        items: session.items.map(item => ({ name: item.name, index: item.index }))
      });

      // Track item frequency
      session.items.forEach(item => {
        allItemNames.add(item.name);
        itemFrequency.set(item.name, (itemFrequency.get(item.name) || 0) + 1);
      });
    }

    // Analysis
    console.log('📊 АНАЛИЗ НА РАЗНООБРАЗИЕТО:\n');

    console.log(`Общо уникални предмети: ${allItemNames.size}`);
    console.log(`Общо генерирани предмети: ${sessions.reduce((sum, s) => sum + s.itemCount, 0)}`);
    console.log();

    // Show first 3 sessions in detail
    console.log('🎮 Първите 3 сесии (детайлно):');
    sessions.slice(0, 3).forEach(session => {
      console.log(`\nСесия ${session.id}:`);
      console.log(`  Клетки: ${session.cellCount}, Предмети: ${session.itemCount}`);
      console.log(`  Предмети: ${session.items.map(item => `${item.name} (${item.index})`).join(', ')}`);
    });

    // Show variety analysis
    console.log('\n📈 ЧЕСТОТА НА ПРЕДМЕТИТЕ:');
    const sortedByFrequency = [...itemFrequency.entries()].sort((a, b) => b[1] - a[1]);
    
    console.log('\nНай-често срещани:');
    sortedByFrequency.slice(0, 10).forEach(([name, count]) => {
      const percentage = ((count / numTests) * 100).toFixed(1);
      console.log(`  ${name}: ${count}/${numTests} (${percentage}%)`);
    });

    console.log('\nНай-рядко срещани:');
    sortedByFrequency.slice(-10).forEach(([name, count]) => {
      const percentage = ((count / numTests) * 100).toFixed(1);
      console.log(`  ${name}: ${count}/${numTests} (${percentage}%)`);
    });

    // Check for variety
    const maxFrequency = Math.max(...itemFrequency.values());
    const minFrequency = Math.min(...itemFrequency.values());
    const avgFrequency = [...itemFrequency.values()].reduce((sum, count) => sum + count, 0) / itemFrequency.size;

    console.log('\n🎯 СТАТИСТИКИ НА РАЗНООБРАЗИЕТО:');
    console.log(`  Максимална честота: ${maxFrequency}/${numTests}`);
    console.log(`  Минимална честота: ${minFrequency}/${numTests}`);
    console.log(`  Средна честота: ${avgFrequency.toFixed(2)}/${numTests}`);
    console.log(`  Стандартно отклонение: ${calculateStdDev([...itemFrequency.values()], avgFrequency).toFixed(2)}`);

    // Variety score (lower is more varied)
    const varietyScore = (maxFrequency - minFrequency) / avgFrequency;
    console.log(`  Variety Score: ${varietyScore.toFixed(2)} (по-ниско = по-разнообразно)`);

    console.log('\n🔄 СРАВНЕНИЕ МЕЖДУ СЕСИИ:');
    // Compare first vs last session
    const firstSession = sessions[0];
    const lastSession = sessions[sessions.length - 1];
    const commonItems = firstSession.items.filter(item1 => 
      lastSession.items.some(item2 => item1.name === item2.name)
    ).length;
    
    console.log(`  Общи предмети между сесия 1 и ${numTests}: ${commonItems}/${Math.min(firstSession.itemCount, lastSession.itemCount)}`);
    console.log(`  Уникалност: ${(100 - (commonItems / Math.min(firstSession.itemCount, lastSession.itemCount)) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Грешка при генериране на сесии:', error);
  }
}

function calculateStdDev(values: number[], mean: number): number {
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

testGameVariety().catch(console.error);