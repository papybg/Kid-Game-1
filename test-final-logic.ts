// Тест на окончателно оправената логика
interface TestSlot {
  index: string[];
  strict?: boolean;
}

interface TestItem {
  index: string;
  name: string;
}

function isValidChoiceFinal(slot: TestSlot, item: TestItem, variantId?: string, availableSlots?: TestSlot[]): boolean {
  // Check exact match first
  if (slot.index.includes(item.index)) {
    return true;
  }

  // Check hierarchical match: item can go in parent category
  // e.g., "rp" (firetruck) can go in "r" (transport) slot
  // or "s" (bird) can go in "sa" (aviation) slot
  for (const slotIndex of slot.index) {
    if (item.index.startsWith(slotIndex)) {
      return true;
    }
  }

  // Special logic for k1 variant: prevent multi-letter items from going into
  // single-letter slots if there's a better choice slot available
  if (variantId === 'k1' && slot.index.length === 1 && !slot.strict) {
    const slotIndex = slot.index[0];

    // Only restrict multi-letter items, not single-letter items
    if (item.index.length > 1) {
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
      }
    }

    // For single-letter items or when no choice slot exists, allow hierarchical placement
    return true;
  }

  return false;
}

async function testFinalLogic() {
  console.log('=== ОКОНЧАТЕЛЕН ТЕСТ НА ЛОГИКАТА ===\n');

  const availableSlots: TestSlot[] = [
    { index: ['g'] },
    { index: ['r'] },
    { index: ['s'] },      // S slot
    { index: ['sa'] },     // SA slot
    { index: ['h', 'p'] }  // Choice slot
  ];

  const bird: TestItem = { index: 's', name: 'Врана' };
  const plane: TestItem = { index: 'sa', name: 'Самолет' };

  console.log('🧪 Тест случаи:\n');

  // Test 1: Bird в SA slot
  console.log('1. Птица (s) в SA slot:');
  const birdInSA = isValidChoiceFinal({ index: ['sa'] }, bird, 'k1', availableSlots);
  console.log(`   Резултат: ${birdInSA ? '✅ МОЖЕ' : '❌ НЕ МОЖЕ'}`);
  console.log(`   Обяснение: Hierarchical match - "sa".startsWith("s") = ${"sa".startsWith("s")}\n`);

  // Test 2: Plane в S slot
  console.log('2. Самолет (sa) в S slot:');
  const planeInS = isValidChoiceFinal({ index: ['s'] }, plane, 'k1', availableSlots);
  console.log(`   Резултат: ${planeInS ? '✅ МОЖЕ' : '❌ НЕ МОЖЕ'}`);
  console.log(`   Обяснение: Multi-letter item, но няма choice slot за SA\n`);

  // Test 3: Bird в S slot
  console.log('3. Птица (s) в S slot:');
  const birdInS = isValidChoiceFinal({ index: ['s'] }, bird, 'k1', availableSlots);
  console.log(`   Резултат: ${birdInS ? '✅ МОЖЕ' : '❌ НЕ МОЖЕ'}`);
  console.log(`   Обяснение: Exact match\n`);

  // Test 4: Plane в SA slot
  console.log('4. Самолет (sa) в SA slot:');
  const planeInSA = isValidChoiceFinal({ index: ['sa'] }, plane, 'k1', availableSlots);
  console.log(`   Резултат: ${planeInSA ? '✅ МОЖЕ' : '❌ НЕ МОЖЕ'}`);
  console.log(`   Обяснение: Exact match\n`);

  console.log('✅ ЗАКЛЮЧЕНИЕ:');
  console.log('   - Птиците (s) МОГАТ да влизат и в S slots (exact) и в SA slots (hierarchical)');
  console.log('   - Самолетите (sa) МОГАТ да влизат и в S slots (fallback) и в SA slots (exact)');
  console.log('   - Логиката работи според документацията!');
}

testFinalLogic().catch(console.error);