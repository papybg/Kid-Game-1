import { db } from './server/db.ts';
import { portals } from './shared/schema.ts';

(async () => {
  try {
    console.log('=== PORTALS IN DATABASE ===');
    const allPortals = await db.select().from(portals);
    allPortals.forEach((portal, i) => {
      console.log(`${i + 1}. ID: ${portal.id}`);
      console.log(`   Name: ${portal.name}`);
      console.log(`   Min Cells: ${portal.min_cells}`);
      console.log(`   Max Cells: ${portal.max_cells}`);
      console.log(`   Layouts: ${JSON.stringify(portal.layouts)}`);
      console.log('   ---');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
})();