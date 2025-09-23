import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { portals, gameItems, gameLayouts, categoriesIndices } from './shared/schema.js';
import { config } from 'dotenv';

config();

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const client = postgres(connectionString);
const db = drizzle(client);

async function viewDatabaseContents() {
  console.log('📊 СЪДЪРЖАНИЕ НА БАЗАТА ДАННИ\n');

  try {
    // Portals
    console.log('🚪 ПОРТАЛИ:');
    const portalsData = await db.select().from(portals);
    portalsData.forEach(portal => {
      console.log(`  ID: ${portal.id}`);
      console.log(`  Име: ${portal.portalName}`);
      console.log(`  Фон: ${portal.fileName}`);
      console.log(`  Иконка: ${portal.iconFileName}`);
      console.log(`  Клетки: ${portal.min_cells}-${portal.max_cells}`);
      console.log(`  Правило: ${portal.item_count_rule}`);
      console.log(`  Заключен: ${portal.isLocked ? 'Да' : 'Не'}`);
      console.log('');
    });

    // Game Items
    console.log('🎮 ПРЕДМЕТИ:');
    const itemsData = await db.select().from(gameItems);
    itemsData.forEach(item => {
      console.log(`  ID: ${item.id} | Име: ${item.name} | Индекс: ${item.index} | Категория: ${item.category || 'Няма'}`);
    });
    console.log('');

    // Categories
    console.log('📂 КАТЕГОРИИ:');
    const categoriesData = await db.select().from(categoriesIndices);
    categoriesData.forEach(cat => {
      console.log(`  ${cat.categoryName} (${cat.indexValue}): ${cat.description}`);
    });
    console.log('');

    // Layouts
    console.log('🗺️ ЛЕЙАУТИ:');
    const layoutsData = await db.select().from(gameLayouts);
    layoutsData.forEach(layout => {
      console.log(`  ID: ${layout.id} | Име: ${layout.name}`);
      console.log(`  Фон (голям): ${layout.backgroundLarge}`);
      console.log(`  Фон (малък): ${layout.backgroundSmall}`);
      console.log(`  Клетки (desktop): ${layout.slots_desktop?.length || 0}`);
      console.log(`  Клетки (mobile): ${layout.slots_mobile?.length || 0}`);
      console.log('');
    });

  } catch (error) {
    console.error('Грешка при четене на базата:', error);
  } finally {
    await client.end();
  }
}

viewDatabaseContents();