import postgres from 'postgres';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

(async () => {
  try {
    console.log('Preview rows to be deleted:');
    const rows = await sql`SELECT * FROM categories_indices WHERE description IS NULL OR description = ''`;
    console.log(rows);
    if (rows.length === 0) {
      console.log('No rows to delete');
      process.exit(0);
    }

    // Backup
    console.log('Creating backup table categories_indices_backup...');
    await sql`CREATE TABLE IF NOT EXISTS categories_indices_backup AS TABLE categories_indices WITH NO DATA`;
    await sql`INSERT INTO categories_indices_backup SELECT * FROM categories_indices WHERE description IS NULL OR description = ''`;
    console.log('Backup complete');

    // Delete
    const result = await sql`DELETE FROM categories_indices WHERE description IS NULL OR description = '' RETURNING *`;
    console.log('Deleted rows count:', result.length || (result && result.rowCount) || 0);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await sql.end({ timeout: 5 });
  }
})();
