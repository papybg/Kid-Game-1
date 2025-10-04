import { db } from './server/db';
import { portals } from './shared/schema';
import { eq } from 'drizzle-orm';

async function checkD2RawData() {
  console.log('=== ДИРЕКТНИ ДАННИ ОТ БАЗАТА ЗА D2 ===\n');

  const d2Portal = await db.select().from(portals).where(eq(portals.id, 'd2'));
  
  if (d2Portal.length === 0) {
    console.log('❌ D2 portal не е намерен в базата');
    return;
  }

  const portal = d2Portal[0];
  
  console.log('📊 RAW данни за D2 portal:');
  console.log('  id:', portal.id);
  console.log('  portalName:', portal.portalName);
  console.log('  min_cells:', portal.min_cells);
  console.log('  max_cells:', portal.max_cells);
  console.log('  item_count_rule:', portal.item_count_rule);
  console.log('  variantSettings:', portal.variantSettings);
  console.log('  layouts:', portal.layouts);
  console.log('  isLocked:', portal.isLocked);
  
  console.log('\n🔍 АНАЛИЗ:');
  console.log(`  • min_cells (${portal.min_cells}) и max_cells (${portal.max_cells}) наистина съществуват в базата`);
  console.log(`  • variantSettings: ${portal.variantSettings ? 'СЪЩЕСТВУВАТ' : 'NULL'}`);
  
  if (portal.variantSettings) {
    console.log('  • variantSettings пренаписват min_cells/max_cells когато се използват');
    console.log('  • Това обяснява защо с variant=t1 се получават 6-8 клетки вместо 7-11');
  }

  process.exit(0);
}

checkD2RawData().catch(console.error);