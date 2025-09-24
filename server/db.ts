import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema.js";
import { config } from 'dotenv';

// Load environment variables
config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

console.log('Connecting to database...');
const client = postgres(process.env.DATABASE_URL);
console.log('Database client created');

export const db = drizzle(client, { schema });
console.log('Database connection established');