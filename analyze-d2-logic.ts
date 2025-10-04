import { db } from './server/db';
import { portals } from './shared/schema';
import { eq } from 'drizzle-orm';

async function analyzeD2Logic() {
  console.log('=== АНАЛИЗ НА ЛОГИКАТА ЗА D2 PORTAL ===\n');

  const portal = await db.query.portals.findFirst({ where: eq(portals.id, 'd2') });
  if (!portal) {
    console.log('❌ Portal D2 не е намерен');
    return;
  }

  console.log(`📊 D2 Portal настройки:`);
  console.log(`   min_cells: ${portal.min_cells}`);
  console.log(`   max_cells: ${portal.max_cells}`);
  console.log(`   variantSettings: ${portal.variantSettings ? 'ДА' : 'НЕ'}`);
  
  if (portal.variantSettings) {
    console.log(`   variantSettings съдържание:`, JSON.stringify(portal.variantSettings, null, 4));
  }

  console.log('\n🔍 АНАЛИЗ НА ЛОГИКАТА В gameService.ts:\n');

  // Simulate logic for different scenarios
  const scenarios = [
    { variantId: undefined, description: 'Без variant' },
    { variantId: 't1', description: 'С variant=t1' },
    { variantId: 'k1', description: 'С variant=k1' },
    { variantId: 'unknown', description: 'С неизвестен variant' }
  ];

  scenarios.forEach(scenario => {
    console.log(`--- Сценарий: ${scenario.description} ---`);

    // Step 1: Get variant settings
    let variantSettings: { minCells: number; maxCells: number; hasExtraItems: boolean } | null = null;
    if (scenario.variantId && portal.variantSettings) {
      variantSettings = portal.variantSettings[scenario.variantId];
      console.log(`   ✓ variantSettings намерени:`, variantSettings);
    } else {
      console.log(`   ✗ variantSettings НЕ са намерени`);
      console.log(`     - variantId: ${scenario.variantId}`);
      console.log(`     - portal.variantSettings: ${portal.variantSettings ? 'съществуват' : 'null'}`);
    }

    // Step 2: Calculate targetCellCount
    let targetCellCount: number;
    if (variantSettings) {
      if (variantSettings.minCells === variantSettings.maxCells) {
        targetCellCount = variantSettings.minCells;
        console.log(`   → targetCellCount: ${targetCellCount} (фиксиран от variant)`);
      } else {
        const min = variantSettings.minCells;
        const max = variantSettings.maxCells;
        targetCellCount = min + Math.floor(Math.random() * (max - min + 1));
        console.log(`   → targetCellCount: ${targetCellCount} (случаен между ${min}-${max} от variant)`);
      }
    } else {
      // Fallback to portal settings
      const min = portal.min_cells;
      const max = portal.max_cells;
      targetCellCount = min + Math.floor(Math.random() * (max - min + 1));
      console.log(`   → targetCellCount: ${targetCellCount} (случаен между ${min}-${max} от portal)`);
    }

    // Step 3: Calculate limits
    const maxCells = variantSettings ? variantSettings.maxCells : portal.max_cells;
    const minCells = variantSettings ? variantSettings.minCells : portal.min_cells;
    console.log(`   → maxCells граница: ${maxCells} (от ${variantSettings ? 'variant' : 'portal'})`);
    console.log(`   → minCells граница: ${minCells} (от ${variantSettings ? 'variant' : 'portal'})`);

    // Step 4: Level type
    let levelType: string;
    if (variantSettings) {
      levelType = variantSettings.hasExtraItems ? 'cells_plus_two' : 'equals_cells';
      console.log(`   → levelType: ${levelType} (от variant.hasExtraItems=${variantSettings.hasExtraItems})`);
    } else {
      // Fallback logic would be gameMode === 'advanced' ? 'cells_plus_two' : 'equals_cells'
      levelType = 'equals_cells'; // assuming simple mode
      console.log(`   → levelType: ${levelType} (fallback за simple mode)`);
    }

    console.log('');
  });

  console.log('🎯 ЗАКЛЮЧЕНИЕ:');
  console.log('   • Ако D2 няма variantSettings → ще използва min_cells/max_cells от portal');
  console.log('   • Ако D2 има variantSettings → ще използва настройките от variant');
  console.log('   • Текущо D2 има variantSettings, затова не използва portal настройките');
  console.log('   • За да използва min_cells/max_cells, variantSettings трябва да е null');

  process.exit(0);
}

analyzeD2Logic().catch(console.error);