import { db } from './server/db.ts';
import { gameLayouts } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

(async () => {
  try {
    console.log('=== CHECKING GAME LAYOUTS ===');
    const layouts = await db.select().from(gameLayouts);
    
    layouts.forEach((layout, i) => {
      console.log(`${i + 1}. Layout ID: ${layout.id}`);
      console.log(`   Name: ${layout.name}`);
      
      if (layout.slots_desktop) {
        console.log(`   Desktop Slots Count: ${layout.slots_desktop.length}`);
        console.log('   Desktop Slots:', JSON.stringify(layout.slots_desktop, null, 2));
      }
      
      if (layout.slots_mobile) {
        console.log(`   Mobile Slots Count: ${layout.slots_mobile.length}`);
        console.log('   Mobile Slots:', JSON.stringify(layout.slots_mobile, null, 2));
      }
      
      console.log('   ---');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
})();