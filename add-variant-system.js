import { db } from './server/db.ts';

async function addVariantSystem() {
  try {
    console.log('Добавяне на система за варианти...');

    // Create game_variants table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS game_variants (
        id VARCHAR PRIMARY KEY,
        name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Add variant_settings column to portals
    await db.execute(`
      ALTER TABLE portals
      ADD COLUMN IF NOT EXISTS variant_settings JSONB NOT NULL DEFAULT '{}'
    `);

    console.log('✅ Система за варианти е добавена успешно!');
  } catch (error) {
    console.error('❌ Грешка при добавяне на системата за варианти:', error);
  }
}

addVariantSystem();