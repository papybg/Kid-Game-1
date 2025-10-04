import { db } from './server/db';
import { portals } from './shared/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

async function removeD2VariantSettings() {
  await db.update(portals)
    .set({ variantSettings: sql`NULL` })
    .where(eq(portals.id, 'd2'));

  console.log('✅ Премахнати variant settings за D2');

  // Verify
  const portal = await db.query.portals.findFirst({ where: eq(portals.id, 'd2') });
  console.log('D2 variantSettings:', portal?.variantSettings);

  process.exit(0);
}

removeD2VariantSettings().catch(console.error);