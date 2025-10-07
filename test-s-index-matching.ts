import { db } from './server/db';
import { gameItems } from './shared/schema';

// Копираме функцията от gameService.ts за да тестваме
function findBestItemForCell(cellIndex: string[], availableItems: any[]): any | null {
  // Double index - exact match only
  if (cellIndex.length === 1 && cellIndex[0].length === 2) {
    return availableItems.find(item => item.index === cellIndex[0]) || null;
  }
  
  // Single index - hierarchical match (item starts with cell index)
  if (cellIndex.length === 1 && cellIndex[0].length === 1) {
    return availableItems.find(item => item.index.startsWith(cellIndex[0])) || null;
  }
  
  // Two indices - priority on first, fallback to second
  if (cellIndex.length === 2) {
    const firstMatch = availableItems.find(item => item.index === cellIndex[0]);
    if (firstMatch) return firstMatch;
    
    const secondMatch = availableItems.find(item => item.index === cellIndex[1]);
    if (secondMatch) return secondMatch;
  }
  
  return null;
}

async function testSIndexMatching() {
  console.log('=== ТЕСТ: S ИНДЕКС MATCHING ЛОГИКА ===\n');

  const allItems = await db.select().from(gameItems);
  
  // Намираме всички s обекти
  const sItems = allItems.filter(item => item.index.startsWith('s'));
  console.log('🔍 Всички S обекти в базата:');
  sItems.forEach(item => {
    console.log(`  ${item.index}: ${item.name}`);
  });
  console.log();

  // Тестваме slot с индекс ["s"]
  console.log('🎯 Тест 1: Slot с индекс ["s"]');
  const sSlotResult = findBestItemForCell(['s'], sItems);
  console.log(`  Резултат: ${sSlotResult ? `${sSlotResult.index}: ${sSlotResult.name}` : 'Няма намерен'}`);
  console.log(`  ⚠️  Проблем: ${sSlotResult && sSlotResult.index !== 's' ? 'ДА - намери обект с различен индекс!' : 'НЕ'}`);
  console.log();

  // Тестваме slot с индекс ["sa"]  
  console.log('🎯 Тест 2: Slot с индекс ["sa"]');
  const saSlotResult = findBestItemForCell(['sa'], sItems);
  console.log(`  Резултат: ${saSlotResult ? `${saSlotResult.index}: ${saSlotResult.name}` : 'Няма намерен'}`);
  console.log();

  // Показваме правилната логика
  console.log('💡 ПРАВИЛНА ЛОГИКА:');
  console.log('  За slot ["s"] трябва да вземе само обекти с точен индекс "s"');
  console.log('  За slot ["sa"] трябва да вземе само обекти с точен индекс "sa"');
  console.log();

  // Тестваме правилната логика
  const correctSItems = allItems.filter(item => item.index === 's');
  const correctSaItems = allItems.filter(item => item.index === 'sa');
  
  console.log('✅ КОРЕГИРАНА ЛОГИКА:');
  console.log(`  За slot ["s"]: ${correctSItems.length} обекта - [${correctSItems.map(i => i.name).join(', ')}]`);
  console.log(`  За slot ["sa"]: ${correctSaItems.length} обекта - [${correctSaItems.map(i => i.name).join(', ')}]`);

  process.exit(0);
}

testSIndexMatching().catch(console.error);