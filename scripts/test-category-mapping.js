// Simple script to show grouping used during selection and how missing category
// causes grouping by first-letter fallback which can lead to undesirable grouping.

function groupItemsByKey(items, keyFn) {
  const groups = new Map();
  for (const it of items) {
    const key = keyFn(it);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(it);
  }
  return groups;
}

const items = [
  { id: 1, name: 'Truck', index: 'r', category: 'vehicles' },
  { id: 2, name: 'Car', index: 'r', category: 'vehicles' },
  { id: 3, name: 'Plane', index: 'sa', category: 'aviation' },
  { id: 4, name: 'Helicopter', index: 'sa', category: 'aviation' },
  { id: 5, name: 'Sparrow', index: 's', category: 'birds' },
  { id: 6, name: 'Eagle', index: 's', category: 'birds' },
];

console.log('\nGrouping when categories exist (group by category):');
const byCategory = groupItemsByKey(items, it => it.category || it.index);
for (const [k,v] of byCategory) {
  console.log(k, v.map(x=>x.name));
}

// Simulate deleted categories: nullify categories
const itemsNoCat = items.map(i => ({ ...i, category: null }));
console.log('\nGrouping when categories missing and fallback uses index[0]:');
const byFirst = groupItemsByKey(itemsNoCat, it => it.category || (it.index && it.index[0]));
for (const [k,v] of byFirst) {
  console.log(k, v.map(x=>x.name));
}

console.log('\nGrouping when categories missing and better fallback uses full index:');
const byIndex = groupItemsByKey(itemsNoCat, it => it.category || it.index);
for (const [k,v] of byIndex) {
  console.log(k, v.map(x=>x.name));
}

// Quick exit
process.exit(0);
