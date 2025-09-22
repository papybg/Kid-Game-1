import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { portals, gameItems, gameLayouts, categoriesIndices } from './shared/schema.js';
import fs from 'fs/promises';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

// Database connection
const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const client = postgres(connectionString);
const db = drizzle(client);

async function loadJSONData() {
  try {
    // Load data from JSON files
    const portalsData = JSON.parse(
      await fs.readFile('./client/public/data/portals.json', 'utf-8')
    );
    
    const themesData = JSON.parse(
      await fs.readFile('./client/public/data/themes.json', 'utf-8')
    );
    
    const layoutData = JSON.parse(
      await fs.readFile('./client/public/data/layouts/d1.json', 'utf-8')
    );

    return {
      portals: portalsData.portals,
      gameItems: themesData.allItems,
      layout: layoutData
    };
  } catch (error) {
    console.error('Error loading JSON data:', error);
    throw error;
  }
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  try {
    const { portals: portalsData, gameItems: gameItemsData, layout } = await loadJSONData();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await db.delete(portals);
    await db.delete(gameItems);
    await db.delete(gameLayouts);
    await db.delete(categoriesIndices);

    // Insert categories and indices mapping first
    console.log('📚 Inserting categories indices...');
    const categoriesData = [
      { id: 1, categoryName: "домашни", indexValue: "h", description: "Домашни животни" },
      { id: 2, categoryName: "селскостопански", indexValue: "p", description: "Селскостопански животни" },
      { id: 3, categoryName: "транспорт", indexValue: "i", description: "Транспорт - влак" },
      { id: 4, categoryName: "транспорт", indexValue: "r", description: "Транспорт - автобус" },
      { id: 5, categoryName: "транспорт", indexValue: "s", description: "Транспорт - самолет" },
      { id: 6, categoryName: "птици", indexValue: "s", description: "Птици" },
    ];

    for (const catData of categoriesData) {
      await db.insert(categoriesIndices).values(catData);
    }

    // Insert portals
    console.log('🚪 Inserting portals...');
    for (const portal of portalsData) {
      // Determine level settings based on portal properties
      let min_cells = 6;
      let max_cells = 8;
      let item_count_rule: 'equals_cells' | 'cells_plus_two' = 'equals_cells';
      
      // You can customize these values based on portal properties
      // For now, using default values - you can adjust based on your needs
      if (portal.difficulty === 'hard' || portal.difficulty === 'advanced') {
        min_cells = 7;
        max_cells = 9;
        item_count_rule = 'cells_plus_two';
      } else if (portal.difficulty === 'medium') {
        min_cells = 8;
        max_cells = 10;
        item_count_rule = 'equals_cells';
      }
      
      await db.insert(portals).values({
        id: portal.id,
        portalName: portal.name,
        fileName: `dolina-large`, // Use existing background file
        iconFileName: `dolina-small.png`, // Use small background as icon
        layouts: portal.layouts,
        cellCount: 6, // Set default cell count
        min_cells: min_cells,
        max_cells: max_cells,
        item_count_rule: item_count_rule,
        isLocked: portal.isLocked
      });
    }

    // Insert game items (fixing index field to be string)
    console.log('🎮 Inserting game items...');
    for (const item of gameItemsData) {
      await db.insert(gameItems).values({
        id: item.id,
        name: item.name,
        image: item.image,
        index: item.index.toString(), // Convert to string as schema expects
        category: item.category
      });
    }

    // Insert layout
    console.log('🗺️  Inserting layout...');
    await db.insert(gameLayouts).values({
      id: layout.id,
      name: layout.name,
      backgroundLarge: layout.backgroundLarge,
      backgroundSmall: layout.backgroundSmall,
      slots: layout.slots.map((slot: any) => ({
        index: slot.index.map((i: number) => i.toString()), // Convert to string array
        position: slot.position,
        diameter: slot.diameter
      }))
    });

    console.log('✅ Database seeding completed successfully!');
    
    // Display summary
    console.log('\n📊 Seeding Summary:');
    console.log(`   • Categories Indices: ${categoriesData.length}`);
    console.log(`   • Portals: ${portalsData.length}`);
    console.log(`   • Game Items: ${gameItemsData.length}`);
    console.log(`   • Layouts: 1`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the seeding
seedDatabase().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});