import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./db";
import path from "path";

migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
console.log("Migrations complete");
