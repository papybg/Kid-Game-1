import { db } from './server/db.ts';
import { portals } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

(async () => {
  try {
    console.log('Updating portal d1 cell limits...');
    
    await db.update(portals)
      .set({ 
        min_cells: 6,
        max_cells: 6,
        name: 'Зелена долина - Ниво 1'
      })
      .where(eq(portals.id, 'd1'));
    
    console.log('✅ Portal d1 updated to have exactly 6 cells');
    
    // Проверка
    const updated = await db.select().from(portals).where(eq(portals.id, 'd1'));
    console.log('Updated portal:', updated[0]);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
})();