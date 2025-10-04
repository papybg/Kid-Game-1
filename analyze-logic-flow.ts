import { db } from './server/db';
import { portals } from './shared/schema';
import { eq } from 'drizzle-orm';

async function analyzeLogicFlow() {
  console.log('=== ДЕТАЙЛЕН АНАЛИЗ НА ЛОГИКАТА ===\n');

  const portal = await db.query.portals.findFirst({ where: eq(portals.id, 'd2') });
  if (!portal) return;

  console.log('🔍 ТЕКУЩО СЪСТОЯНИЕ:');
  console.log(`D2 portal има variantSettings: ${JSON.stringify(portal.variantSettings, null, 2)}`);
  console.log(`D2 portal.min_cells: ${portal.min_cells}`);
  console.log(`D2 portal.max_cells: ${portal.max_cells}\n`);

  console.log('📋 ЛОГИКА В gameService.ts:\n');

  console.log('1. Проверка за variantSettings:');
  console.log('   if (variantId && portal.variantSettings) {');
  console.log('     variantSettings = portal.variantSettings[variantId];');
  console.log('   }');
  console.log('');

  console.log('2. Избор на targetCellCount:');
  console.log('   if (variantSettings) {');
  console.log('     // Използва variantSettings.minCells/maxCells');
  console.log('   } else {');
  console.log('     // Използва portal.min_cells/max_cells');
  console.log('   }');
  console.log('');

  console.log('3. Определяне на границите:');
  console.log('   const maxCells = variantSettings ? variantSettings.maxCells : portal.max_cells;');
  console.log('   const minCells = variantSettings ? variantSettings.minCells : portal.min_cells;');
  console.log('');

  console.log('🧪 ТЕСТ СЦЕНАРИИ:\n');

  // Test different API calls
  const testCases = [
    { url: '/api/game-session/d2', description: 'Без variant параметър' },
    { url: '/api/game-session/d2?variant=t1', description: 'С variant=t1' },
    { url: '/api/game-session/d2?variant=k1', description: 'С variant=k1' },
    { url: '/api/game-session/d2?variant=missing', description: 'С несъществуващ variant' }
  ];

  testCases.forEach(testCase => {
    console.log(`--- ${testCase.description} ---`);
    
    // Parse variant from URL
    const urlParams = new URLSearchParams(testCase.url.split('?')[1] || '');
    const variantId = urlParams.get('variant');
    
    console.log(`   URL: ${testCase.url}`);
    console.log(`   variantId: ${variantId || 'undefined'}`);

    // Simulate gameService logic
    let variantSettings = null;
    if (variantId && portal.variantSettings) {
      variantSettings = portal.variantSettings[variantId];
    }

    if (variantSettings) {
      console.log(`   ✓ Намерени variantSettings: minCells=${variantSettings.minCells}, maxCells=${variantSettings.maxCells}`);
      console.log(`   → Ще генерира ${variantSettings.minCells}-${variantSettings.maxCells} клетки`);
    } else {
      console.log(`   ✗ Не са намерени variantSettings`);
      console.log(`   → Ще използва portal настройки: ${portal.min_cells}-${portal.max_cells} клетки`);
    }
    console.log('');
  });

  console.log('🎯 РЕЗУЛТАТ:');
  console.log('');
  console.log('Проблемът е, че D2 portal има variantSettings за t1 и k1,');
  console.log('което пренаписва оригиналните min_cells/max_cells настройки.');
  console.log('');
  console.log('ТЕКУЩО ПОВЕДЕНИЕ:');
  console.log('• /api/game-session/d2 → 7-11 клетки (използва portal настройки)');
  console.log('• /api/game-session/d2?variant=t1 → 6-8 клетки (използва variant настройки)');
  console.log('• /api/game-session/d2?variant=k1 → 8-10 клетки (използва variant настройки)');
  console.log('');
  console.log('ОЧАКВАНО ПОВЕДЕНИЕ:');
  console.log('• Всички извиквания на D2 → 7-11 клетки (само portal настройки)');
  console.log('• Варианти t1/k1 са предназначени само за D1 portal');
  console.log('');
  console.log('РЕШЕНИЕ:');
  console.log('Премахване на variantSettings от D2 portal (set to null)');

  process.exit(0);
}

analyzeLogicFlow().catch(console.error);