import { isValidChoice } from './client/src/lib/game-logic';
import type { GameItem, GameSlot } from './shared/schema';

// Test data
const strictRSlot: GameSlot = {
  index: ['r'],
  strict: true,
  position: { top: '50%', left: '50%' },
  diameter: '11%'
};

const normalRSlot: GameSlot = {
  index: ['r'],
  position: { top: '50%', left: '50%' },
  diameter: '11%'
};

const rItem: GameItem = {
  id: 1,
  name: 'kamion',
  index: 'r',
  category: 'transport',
  createdAt: null,
  image: null,
  audio: null
};

const rdItem: GameItem = {
  id: 2,
  name: 'самосвал',
  index: 'rd',
  category: 'transport',
  createdAt: null,
  image: null,
  audio: null
};

function testStrictLogic() {
  console.log('=== ТЕСТ НА КЛИЕНТСКАТА STRICT ЛОГИКА ===\n');

  console.log('🧪 Тест 1: Strict slot "r" + обект с индекс "r"');
  const result1 = isValidChoice(strictRSlot, rItem, 'k1');
  console.log(`  Резултат: ${result1 ? '✅ ДА' : '❌ НЕ'} - очакван: ✅ ДА`);
  console.log();

  console.log('🧪 Тест 2: Strict slot "r" + обект с индекс "rd"');
  const result2 = isValidChoice(strictRSlot, rdItem, 'k1');
  console.log(`  Резултат: ${result2 ? '✅ ДА' : '❌ НЕ'} - очакван: ❌ НЕ`);
  console.log();

  console.log('🧪 Тест 3: Обикновен slot "r" + обект с индекс "rd"');
  const result3 = isValidChoice(normalRSlot, rdItem, 'k1');
  console.log(`  Резултат: ${result3 ? '✅ ДА' : '❌ НЕ'} - очакван: ✅ ДА (hierarchical match)`);
  console.log();

  console.log('📊 Резултати:');
  console.log(`  Тест 1: ${result1 === true ? 'PASS' : 'FAIL'}`);
  console.log(`  Тест 2: ${result2 === false ? 'PASS' : 'FAIL'}`);
  console.log(`  Тест 3: ${result3 === true ? 'PASS' : 'FAIL'}`);
}

testStrictLogic();