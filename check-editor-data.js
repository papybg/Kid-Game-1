import { db } from './server/db.ts';
import { portals } from './shared/schema.ts';

(async () => {
  try {
    console.log('=== CHECKING FOR PORTAL EDITOR DATA ===');
    const allPortals = await db.select().from(portals);
    allPortals.forEach((portal, i) => {
      console.log(`${i + 1}. Portal ID: ${portal.id}`);
      if (portal.editor_data) {
        console.log('   Editor Data Found:');
        console.log('   Desktop Slots:', JSON.stringify(portal.editor_data.desktopSlots, null, 2));
        if (portal.editor_data.mobileSlots) {
          console.log('   Mobile Slots:', JSON.stringify(portal.editor_data.mobileSlots, null, 2));
        }
      } else {
        console.log('   No editor data');
      }
      console.log('   ---');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
})();