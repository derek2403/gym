import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dbPath = process.env.DATABASE_URL?.replace("file:", "") || path.join(process.cwd(), "data", "gym.db");

const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// Auto-migrate on first connection
const migrationsPath = path.join(process.cwd(), "drizzle");
if (fs.existsSync(migrationsPath)) {
  try {
    migrate(db, { migrationsFolder: migrationsPath });
  } catch (e) {
    // Migrations already applied
  }
}

export { schema };
