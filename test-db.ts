import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { portals } from './shared/schema.js';

async function testDbConnection() {
  console.log("--- Стартирам тест на връзката с базата данни ---");
  let client;
  try {
    console.log("1. Зареждам .env файла...");
    config();
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL не е намерен в .env файла.");
    }
    console.log("-> DATABASE_URL е намерен.");

    console.log("2. Създавам връзка към PostgreSQL...");
    client = postgres(connectionString, { max: 1, onnotice: () => {} });
    const db = drizzle(client);
    console.log("-> Връзката е създадена.");

    console.log("3. Изпълнявам проста заявка (взимам 1 портал)...");
    const result = await db.select({ id: portals.id }).from(portals).limit(1);
    console.log(`-> Заявката е изпълнена. Намерени редове: ${result.length}`);

    console.log("\n✅ УСПЕХ: Връзката с базата данни работи.");

  } catch (error) {
    console.error("\n❌ ПРОВАЛ: Възникна грешка по време на теста.");
    console.error(error);
  } finally {
    if (client) {
       await client.end();
       console.log("-> Връзката е затворена.");
    }
  }
}

testDbConnection();