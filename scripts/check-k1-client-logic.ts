import { isValidChoice } from '../client/src/lib/game-logic';

// Simulate slots and items
const slots = [
  { id: 'slot-s', index: ['s'], strict: false, position: { top: 0, left: 0 } },
  { id: 'slot-sa', index: ['sa'], strict: false, position: { top: 1, left: 0 } },
];

const itemSA = { id: 1, index: 'sa', name: 'Plane' };

console.log('Slots:');
slots.forEach(s => console.log(` - ${s.id}: [${s.index.join(', ')}]`));
console.log(`Item: ${itemSA.index}\n`);

const canPlaceInS = isValidChoice(slots[0] as any, itemSA as any, 'k1', slots as any);
console.log(`isValidChoice for item 'sa' into slot 's' (should be FALSE if there is a dedicated 'sa' slot): ${canPlaceInS}`);

// Show detailed reasoning by mimicking the client function steps
function debugIsValid(slot: any, item: any, availableSlots: any[]) {
  // Mirror the client's isValidChoice ordering:
  // 1. Strict slot check
  if (slot.strict) return { allowed: slot.index.includes(item.index), reason: 'strict check' };

  // 2. Exact match
  if (slot.index.includes(item.index)) return { allowed: true, reason: 'exact match' };

  // 3. First-letter fallback (non-strict)
  for (const slotIndex of slot.index) {
    if (item.index && slotIndex && item.index[0] === slotIndex[0]) {
      return { allowed: true, reason: 'first-letter match' };
    }
  }

  return { allowed: false, reason: 'no rule matched' };
}

console.log('Debug: ', debugIsValid(slots[0], itemSA, slots));
