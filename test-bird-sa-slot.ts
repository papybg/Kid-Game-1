// Тест на проблема с птиците в SA слот
interface TestSlot {
  index: string[];
  strict?: boolean;
}

interface TestItem {
  index: string;
  name: string;
}

function isValidChoiceFixed(slot: TestSlot, item: TestItem, variantId?: string, availableSlots?: TestSlot[]): boolean {
  // Special logic for k1 variant: if slot has only one index and is not strict,
  // we accept single-letter items only if equal; for multi-letter items we must
  // first check if there's a free slot for that full item.index - but only if
  // that slot has multiple indices (real choice), not single multi-letter index.
  if (variantId === 'k1' && slot.index.length === 1 && !slot.strict) {
    const slotIndex = slot.index[0];

    // If the item is single-letter, accept only exact match
    if (item.index.length === 1) {
      return item.index === slotIndex;
    }

    // Item has multi-letter index. If we have availableSlots context,
    // check whether any available slot with MULTIPLE indices expects this exact item.index.
    // We ignore slots with single multi-letter index (like [sa]) as they are specific slots,
    // not choice slots.
    if (availableSlots && availableSlots.length > 0) {
      const hasFreeChoiceSlot = availableSlots.some(s => 
        s.index.length > 1 && s.index.includes(item.index)
      );
      if (hasFreeChoiceSlot) {
        // There is a free choice slot for this multi-letter item -> do not accept here
        return false;
      }
      // No free choice slot -> allow fallback placement
      return true;
    }

    // Fallback: without context, allow multi-letter items in single-letter slots
    // (this maintains backward compatibility)
    return true;
  }

  // Check exact match first
  if (slot.index.includes(item.index)) {
    return true;
  }

  // Check hierarchical match: item can go in parent category
  // e.g., "rp" (firetruck) can go in "r" (transport) slot
  for (const slotIndex of slot.index) {
    if (item.index.startsWith(slotIndex)) {
      return true;
    }
  }

  return false;
}

async function testBirdInSASlot() {
  console.log('=== ТЕСТ: ПТИЦА В SA СЛОТ ===\n');

  // Симулираме реални slots от сесията
  const availableSlots: TestSlot[] = [
    { index: ['g'] },
    { index: ['r'] },
    { index: ['s'] },      // S slot
    { index: ['sa'] },     // SA slot
    { index: ['h', 'p'] }  // Choice slot
  ];

  const bird: TestItem = { index: 's', name: 'Врана' };
  const saSlot: TestSlot = { index: ['sa'] };

  console.log('🐦 Тест случай:');
  console.log(`   Slot: [${saSlot.index.join(', ')}] (SA slot)`);
  console.log(`   Item: "${bird.index}" (${bird.name})`);
  console.log();

  // Тест с k1 variant
  console.log('1. K1 variant:');
  const resultK1 = isValidChoiceFixed(saSlot, bird, 'k1', availableSlots);
  console.log(`   Резултат: ${resultK1 ? '✅ МОЖЕ' : '❌ НЕ МОЖЕ'}`);
  
  // Проверка на условията
  console.log('   Условия:');
  console.log(`   - variantId === 'k1': true`);
  console.log(`   - slot.index.length === 1: ${saSlot.index.length === 1}`);
  console.log(`   - !slot.strict: ${!saSlot.strict}`);
  console.log(`   - item.index.length === 1: ${bird.index.length === 1}`);
  
  if (saSlot.index.length === 1 && !saSlot.strict && bird.index.length === 1) {
    console.log(`   → Влиза в k1 логика за single-letter items`);
    const slotIndex = saSlot.index[0];
    console.log(`   - item.index === slotIndex: "${bird.index}" === "${slotIndex}" = ${bird.index === slotIndex}`);
    console.log(`   → Резултат от k1 логика: ${bird.index === slotIndex ? '✅ МОЖЕ' : '❌ НЕ МОЖЕ'}`);
  }
  
  console.log();

  // Тест без k1 (default logic)
  console.log('2. Default variant:');
  const resultDefault = isValidChoiceFixed(saSlot, bird, undefined, availableSlots);
  console.log(`   Резултат: ${resultDefault ? '✅ МОЖЕ' : '❌ НЕ МОЖЕ'}`);
  
  // Проверка на условията
  console.log('   Условия:');
  console.log(`   - Exact match: ${saSlot.index.includes(bird.index)}`);
  console.log(`   - Hierarchical match: ${saSlot.index.some(si => bird.index.startsWith(si))}`);
  const hierMatch = saSlot.index.some(si => bird.index.startsWith(si));
  console.log(`     ("${bird.index}".startsWith("${saSlot.index[0]}") = ${bird.index.startsWith(saSlot.index[0])})`);
  console.log();

  console.log('💡 ПРОБЛЕМ:');
  console.log('   K1 логика изисква exact match за single-letter items в single-index slots');
  console.log('   "s" bird НЕ МОЖЕ да влезе в "sa" slot при k1 variant');
  console.log('   Но МОЖЕ при default variant (hierarchical match)');
  console.log();
  
  console.log('🔧 РЕШЕНИЕ:');
  console.log('   Трябва да се промени логиката за k1 да позволи hierarchical match');
  console.log('   или да се направи изключение за birds в aviation slots');
}

testBirdInSASlot().catch(console.error);