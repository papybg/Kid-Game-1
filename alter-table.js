import { db } from './server/db';

async function alterTable() {
  try {
    // First, create sequence if not exists
    await db.execute('CREATE SEQUENCE IF NOT EXISTS game_items_id_seq');
    // Then set default
    await db.execute('ALTER TABLE game_items ALTER COLUMN id SET DEFAULT nextval(\'game_items_id_seq\')');
    // Then set the sequence to the max id
    await db.execute('SELECT setval(\'game_items_id_seq\', (SELECT MAX(id) FROM game_items))');
    console.log('Table altered successfully');
  } catch (error) {
    console.error('Error altering table:', error);
  }
}

alterTable();