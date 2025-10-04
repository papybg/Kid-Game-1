import { db } from './server/db';
import { portals } from './shared/schema';
import { eq } from 'drizzle-orm';

async function updateVariantSettings() {
  console.log('Обновяване на variant settings...');

  try {
    // Update portal d1 with variant settings for t1 and k1
    await db.update(portals)
      .set({
        variantSettings: {
          t1: {
            minCells: 6,
            maxCells: 8,
            hasExtraItems: false
          },
          k1: {
            minCells: 8,
            maxCells: 10,
            hasExtraItems: true
          }
        }
      })
      .where(eq(portals.id, 'd1'));

    console.log('✅ Обновен портал d1 с variant settings за t1 и k1');

    // Verify the update
    const updatedPortal = await db.query.portals.findFirst({
      where: eq(portals.id, 'd1')
    });

    console.log('Нови variant settings:', JSON.stringify(updatedPortal?.variantSettings, null, 2));

  } catch (error) {
    console.error('❌ Грешка:', error);
  }

  process.exit(0);
}

updateVariantSettings();