import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

// This script normalizes gameItems.category to a single-letter value (first char of index)
// Run locally with: npx tsx scripts/normalize-categories.ts

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set in .env');
  process.exit(1);
}

async function main() {
  const dbUrl: string = process.env.DATABASE_URL as string;
  const sql = postgres(dbUrl);

  try {
    console.log('Fetching game items with missing or multi-letter categories...');
    const rows = await sql`SELECT id, index, category FROM game_items`;

    const toUpdate = rows.filter((r: any) => {
      if (!r.category) return true;
      // If category is more than 1 char, we consider normalizing
      return typeof r.category === 'string' && r.category.length > 1;
    });

    console.log(`Found ${toUpdate.length} items to normalize.`);
    for (const r of toUpdate) {
      const newCat = (r.index && r.index.length > 0) ? r.index[0] : null;
      if (!newCat) continue;
      console.log(`Updating item ${r.id}: index='${r.index}' category='${r.category}' -> '${newCat}'`);
      await sql`UPDATE game_items SET category = ${newCat} WHERE id = ${r.id}`;
    }

    console.log('Normalization complete');
  } catch (err) {
    console.error('Error during normalization:', err);
  } finally {
    sql.end({ timeout: 0 });
  }
}

main();
