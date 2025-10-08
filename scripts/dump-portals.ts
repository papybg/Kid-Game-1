import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { portals } from '../shared/schema.ts';
import { config } from 'dotenv';

config();

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const client = postgres(connectionString);
const db = drizzle(client);

async function dumpPortals() {
  try {
    console.log('=== PORTALS DUMP ===');
    const all = await db.select().from(portals);
    if (all.length === 0) {
      console.log('No portals found');
      return;
    }
    all.forEach((p, i) => {
      console.log(`\n#${i + 1} ID: ${p.id}`);
      console.log(`  portalName: ${p.portalName || p.name || ''}`);
      console.log(`  fileName: ${p.fileName}`);
      console.log(`  iconFileName: ${p.iconFileName}`);
      console.log(`  min_cells: ${p.min_cells}`);
      console.log(`  max_cells: ${p.max_cells}`);
      console.log(`  item_count_rule: ${p.item_count_rule}`);
      console.log(`  variantSettings: ${JSON.stringify(p.variantSettings)}`);
    });
  } catch (err) {
    console.error('Error dumping portals:', err);
  } finally {
    await client.end();
  }
}

dumpPortals().catch(console.error);
