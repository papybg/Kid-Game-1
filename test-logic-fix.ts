// Тест на оправената логика
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

async function testFixedLogic() {
  console.log('=== ТЕСТ НА ОПРАВЕНАТА ЛОГИКА ===\n');

  // Симулираме реални slots от сесията
  const availableSlots: TestSlot[] = [
    { index: ['g'] },
    { index: ['r'] },
    { index: ['i'] },
    { index: ['h', 'p'] }, // Choice slot with multiple indices
    { index: ['g'] },
    { index: ['h', 'p'] }, // Choice slot with multiple indices
    { index: ['p', 'h'] }, // Choice slot with multiple indices
    { index: ['s'] },      // Single-letter slot
    { index: ['sa'] },     // Single multi-letter slot (specific)
    { index: ['s'] }       // Single-letter slot
  ];

  const samolet: TestItem = { index: 'sa', name: 'Самолет' };

  console.log('🧪 Тест случаи:\n');

  // Test 1: SA item в S slot с наличие на SA specific slot
  const sSlot = { index: ['s'] };
  console.log('1. SA item в S slot:');
  console.log(`   Slot: [${sSlot.index.join(', ')}]`);
  console.log(`   Item: "${samolet.index}" (${samolet.name})`);
  
  const result1 = isValidChoiceFixed(sSlot, samolet, 'k1', availableSlots);
  console.log(`   Резултат: ${result1 ? '✅ МОЖЕ' : '❌ НЕ МОЖЕ'}`);
  
  // Логика обяснение
  const hasChoiceSlot = availableSlots.some(s => s.index.length > 1 && s.index.includes(samolet.index));
  console.log(`   Има ли choice slot за SA: ${hasChoiceSlot}`);
  console.log(`   (SA slot [sa] се игнорира защото има само 1 индекс)\n`);

  // Test 2: SA item в choice slot [h, sa] (ако съществува)
  const choiceSlot = { index: ['h', 'sa'] };
  console.log('2. SA item в choice slot [h, sa]:');
  const result2 = isValidChoiceFixed(choiceSlot, samolet, 'k1', availableSlots);
  console.log(`   Резултат: ${result2 ? '✅ МОЖЕ' : '❌ НЕ МОЖЕ'} (exact match)\n`);

  // Test 3: SA item в SA specific slot
  const saSlot = { index: ['sa'] };
  console.log('3. SA item в SA specific slot:');
  const result3 = isValidChoiceFixed(saSlot, samolet, 'k1', availableSlots);
  console.log(`   Резултат: ${result3 ? '✅ МОЖЕ' : '❌ НЕ МОЖЕ'} (exact match)\n`);

  // Test 4: Без k1 variant (default logic)
  console.log('4. SA item в S slot (default variant):');
  const result4 = isValidChoiceFixed(sSlot, samolet, undefined, availableSlots);
  console.log(`   Резултат: ${result4 ? '✅ МОЖЕ' : '❌ НЕ МОЖЕ'} (hierarchical match)\n`);

  console.log('✅ ЗАКЛЮЧЕНИЕ: Оправката позволява SA items да влизат в S slots при k1 variant!');
}

testFixedLogic().catch(console.error);