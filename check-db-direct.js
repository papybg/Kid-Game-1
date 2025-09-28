import { db } from './server/db.ts';
import { gameVariants, portals, categoriesIndices } from './shared/schema.ts';

async function checkDatabase() {
  try {
    console.log('Checking database...');

    const variants = await db.select().from(gameVariants);
    console.log('DB Variants:', variants.length, 'records');

    const dbPortals = await db.select().from(portals);
    console.log('DB Portals:', dbPortals.length, 'records');

    const categories = await db.select().from(categoriesIndices);
    console.log('DB Categories:', categories.length, 'records');

    if (variants.length > 0) {
      console.log('First variant:', variants[0]);
    }

    if (dbPortals.length > 0) {
      console.log('First portal:', dbPortals[0]);
    }

    if (categories.length > 0) {
      console.log('First category:', categories[0]);
    }

  } catch (error) {
    console.error('Database error:', error);
  }
}

checkDatabase();