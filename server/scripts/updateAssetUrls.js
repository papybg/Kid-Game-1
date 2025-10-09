#!/usr/bin/env node
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { gameItems, portals, categoriesIndices } from '../../shared/schema.js';

// Load .env from repo root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

async function updateField(table, idCol, idVal, field, newValue) {
  try {
    await db.update(table).set({ [field]: newValue }).where(table[idCol].equals(idVal));
    console.log(`Updated ${field} for id=${idVal}`);
  } catch (err) {
    console.error('Update failed:', err);
  }
}

async function processTable(table, idCol, fields) {
  console.log(`\n--- Scanning ${table.sqlName} ---`);
  const rows = await db.select().from(table);
  for (const row of rows) {
    for (const field of fields) {
      const val = row[field];
      if (!val || typeof val !== 'string') continue;
      if (val.startsWith('/') || val.startsWith('./') || val.startsWith('images/')) {
        console.log(`\nRecord id=${row[idCol]} field=${field} current path is: ${val}`);
        const answer = await ask('Please paste the new Cloudinary URL (or leave empty to skip): ');
        const newUrl = answer.trim();
        if (newUrl) {
          await updateField(table, idCol, row[idCol], field, newUrl);
        } else {
          console.log('Skipped');
        }
      }
    }
  }
}

async function run() {
  try {
    // Adjust this list if your schema has other fields that need updating
    await processTable(gameItems, 'id', ['image', 'audio']);
    await processTable(portals, 'id', ['fileName', 'iconFileName']);
    await processTable(categoriesIndices, 'id', ['description']);
    console.log('\nDone updating assets.');
  } catch (err) {
    console.error('Error during update:', err);
  } finally {
    rl.close();
    await client.end();
  }
}

run();
