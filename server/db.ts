import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Check for Pooler URL usage
if (!process.env.DATABASE_URL.includes("-pooler") && !process.env.DATABASE_URL.includes("neondatabase.com")) {
  console.warn("⚠️ WARNING: Your DATABASE_URL does not look like a Neon pooled connection string. Ensure you are using the pooled URL for production stability.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  max: 20
});

export const db = drizzle({ client: pool, schema });

// Retry Strategy for Database Connection
const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // 2 seconds

export async function checkDatabaseConnection() {
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      console.log(`[DB] Attempting connection (Try ${retries + 1}/${MAX_RETRIES})...`);
      const client = await pool.connect();
      client.release();
      console.log("[DB] Database connected successfully.");
      return true;
    } catch (err: any) {
      retries++;
      console.error(`[DB] Connection failed (Attempt ${retries}/${MAX_RETRIES}):`, err.message);

      if (err.code === 'ENOTFOUND') {
        console.error("   ❌ DNS/Network Error: The database host could not be resolved. Checking network...");
      } else if (err.code === '28P01') {
        console.error("   ❌ Authentication Error: Invalid credentials.");
        throw err; // Don't retry auth errors, they won't fix themselves
      }

      if (retries >= MAX_RETRIES) {
        console.error("[DB] Max retries reached. Database connection failed.");
        throw err;
      }

      console.log(`[DB] Waiting ${RETRY_DELAY}ms before retrying...`);
      await new Promise(res => setTimeout(res, RETRY_DELAY));
    }
  }
}
