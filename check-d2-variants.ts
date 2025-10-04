import { db } from './server/db';
import { portals } from './shared/schema';
import { eq } from 'drizzle-orm';

async function checkD2VariantSettings() {
  const portal = await db.query.portals.findFirst({ where: eq(portals.id, 'd2') });
  console.log('D2 portal variantSettings:', JSON.stringify(portal?.variantSettings, null, 2));
  process.exit(0);
}

checkD2VariantSettings().catch(console.error);