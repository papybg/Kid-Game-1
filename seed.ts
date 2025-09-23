import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { portals, gameItems, gameLayouts, categoriesIndices } from './shared/schema.ts';
import fs from 'fs/promises';
import { config } from 'dotenv';

config();

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const client = postgres(connectionString);
const db = drizzle(client);

async function loadJSONData() {
    try {
        const portalsData = JSON.parse(await fs.readFile('./client/public/data/portals.json', 'utf-8'));
        const themesData = JSON.parse(await fs.readFile('./client/public/data/themes.json', 'utf-8'));
        const layoutData = JSON.parse(await fs.readFile('./client/public/data/layouts/d1.json', 'utf-8'));
        return { portals: portalsData.portals, gameItems: themesData.allItems, layout: layoutData };
    } catch (error) {
        console.error('Error loading JSON data:', error);
        throw error;
    }
}

async function seedDatabase() {
  console.log(' Starting database seeding...');
  
  try {
    const { portals: portalsData, gameItems: gameItemsData, layout: layoutData } = await loadJSONData();

    await db.transaction(async (tx) => {
        console.log(' Clearing existing data...');
        await tx.delete(gameLayouts);
        await tx.delete(gameItems);
        await tx.delete(portals);
        await tx.delete(categoriesIndices);
        console.log('Data cleared.');

        console.log('📚 Inserting categories indices...');
        const categoriesData = [
            { id: 1, categoryName: "домашни", indexValue: "h", description: "Домашни животни" },
            { id: 2, categoryName: "селскостопански", indexValue: "p", description: "Селскостопански животни" },
            { id: 3, categoryName: "транспорт", indexValue: "i", description: "Транспорт - влак" },
            { id: 4, categoryName: "транспорт", indexValue: "r", description: "Транспорт - автобус" },
            { id: 5, categoryName: "транспорт", indexValue: "s", description: "Транспорт - самолет" },
            { id: 6, categoryName: "птици", indexValue: "s", description: "Птици" },
        ];
        await tx.insert(categoriesIndices).values(categoriesData);
        console.log(` -> Inserted ${categoriesData.length} categories.`);

        console.log('🚪 Inserting portals...');
        const portalValues = portalsData.map((portal: any) => ({
            id: portal.id,
            portalName: portal.name,
            fileName: portal.id === 'd1' ? 'dolina-large' : 'dolina-large', // Map based on portal id
            iconFileName: portal.id === 'd1' ? 'dolina-small.png' : 'dolina-small.png', // Map based on portal id
            layouts: portal.layouts,
            cellCount: 6, // Hardcoded for now
            min_cells: 6,
            max_cells: 8,
            item_count_rule: 'equals_cells',
            isLocked: portal.isLocked,
        }));
        await tx.insert(portals).values(portalValues);
        console.log(` -> Inserted ${portalValues.length} portals.`);

        console.log('🎮 Inserting game items...');
        const gameItemValues = gameItemsData.map((item: any) => ({
            id: item.id, name: item.name, image: item.image, index: item.index.toString(), category: item.category
        }));
        await tx.insert(gameItems).values(gameItemValues);
        console.log(` -> Inserted ${gameItemValues.length} game items.`);

        console.log('🗺️ Inserting layout...');
        // Generate mobile slots by scaling desktop positions
        const desktopSlots = layoutData.slots;
        const mobileSlots = desktopSlots.map((slot: any) => ({
            index: slot.index,
            position: {
                top: `${Math.round(parseFloat(slot.position.top) * 0.6)}%`, // Scale to 60% and keep as percentage
                left: `${Math.round(parseFloat(slot.position.left) * 0.6)}%` // Scale to 60% and keep as percentage
            },
            diameter: '40px' // Fixed pixel size for mobile
        }));
        
        await tx.insert(gameLayouts).values({
            id: 'd1', 
            name: layoutData.name, 
            backgroundLarge: layoutData.backgroundLarge, 
            backgroundSmall: layoutData.backgroundSmall,
            slots_desktop: desktopSlots, 
            slots_mobile: mobileSlots,
        });
        console.log(` -> Inserted 1 layout with mobile slots.`);
    });

    console.log('✅ Database seeding transaction completed successfully!');
    
  } catch (error) {
    console.error(' Error seeding database:', error);
    throw error;
  } finally {
    console.log('Ending database connection...');
    await client.end();
    console.log('Connection ended.');
  }
}

seedDatabase();
