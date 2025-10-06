// Lightweight JS test for isValidChoice semantics (no TS tooling required)

function isValidChoice(slot, item, variantId) {
  if (!slot || !item) return false;
  // Exact match always allowed
  if (slot.index && slot.index.includes(item.index)) return true;

  if (variantId === 'k1') {
    if (slot.strict) return false;
    if (!item.index || item.index.length === 0) return false;
    const c = item.index[0];
    for (const si of (slot.index || [])) {
      if (si && si.length > 0 && si[0] === c) return true;
    }
    return false;
  }

  if (item.index) {
    for (const si of (slot.index || [])) {
      if (si && item.index.startsWith(si)) return true;
    }
  }
  return false;
}

function assertEqual(a, b, msg) {
  const pass = a === b;
  console.log((pass ? 'PASS' : 'FAIL') + ' - ' + msg + ' => ' + a + ' expected ' + b);
}

// Tests
const tests = [
  { slot: { index: ['ab'], strict: true }, item: { index: 'ab' }, v: 'k1', exp: true, msg: 'strict exact match' },
  { slot: { index: ['ab'], strict: true }, item: { index: 'ax' }, v: 'k1', exp: false, msg: 'strict non-exact rejects' },
  { slot: { index: ['ab'], strict: false }, item: { index: 'ax' }, v: 'k1', exp: true, msg: 'non-strict matches by first char' },
  { slot: { index: ['ab'], strict: false }, item: { index: 'bb' }, v: 'k1', exp: false, msg: 'non-strict different first char rejects' },
  { slot: { index: ['a','b'], strict: false }, item: { index: 'bX' }, v: 'k1', exp: true, msg: 'multi-index non-strict matches second by first char' },
  { slot: { index: ['ab'] }, item: { index: 'abx' }, v: undefined, exp: true, msg: 'default variant startsWith slot index' },
  { slot: { index: ['ab'] }, item: { index: 'a' }, v: undefined, exp: false, msg: 'default variant shorter item does not startWith slot index' }
];

for (const t of tests) {
  const got = isValidChoice(t.slot, t.item, t.v);
  assertEqual(got, t.exp, t.msg);
}

console.log('Done');
