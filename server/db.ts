// server/db.ts
// Database connection - SAFE: Handles errors gracefully

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";

neonConfig.webSocketConstructor = ws;

// Check for DATABASE_URL - but don't crash immediately
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ FATAL: DATABASE_URL environment variable is not set.");
  console.error("   The server cannot start without a database connection.");
  console.error("   Please set DATABASE_URL in your environment variables.");
  // We throw here because we truly cannot proceed without a database
  throw new Error("DATABASE_URL must be set. Cannot start server without database.");
}

// Warn about pooler URL
if (!databaseUrl.includes("-pooler") && !databaseUrl.includes("https://shirur-express.onrender.com")) {
  console.warn("⚠️ WARNING: DATABASE_URL doesn't appear to use Neon pooler. Consider using the pooled connection for production stability.");
}

export const pool = new Pool({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 10000, // 10 seconds timeout
  max: 10, // Reduced from 20 — Neon has a 20 conn limit per branch, leaving headroom
  idleTimeoutMillis: 30000,
});

export const db = drizzle({ client: pool, schema });

// Retry Strategy for Database Connection
const MAX_RETRIES = 5;
const RETRY_DELAY = 3000; // 3 seconds

export async function checkDatabaseConnection(): Promise<boolean> {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      console.log(`[DB] Attempting connection (Try ${retries + 1}/${MAX_RETRIES})...`);
      const client = await pool.connect();

      // Quick test query
      await client.query('SELECT 1');
      
      // Enable pg_trgm extension for fuzzy/elastic search
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
        await client.query("SET pg_trgm.similarity_threshold = 0.15");
        console.log("✅ [DB] pg_trgm extension enabled for fuzzy search.");
        // Auto-create analytics tables if not already present
        await client.query(`
          CREATE TABLE IF NOT EXISTS user_analytics_events (
            id TEXT PRIMARY KEY,
            user_id VARCHAR,
            session_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            page TEXT NOT NULL,
            referrer TEXT,
            metadata JSONB,
            duration_seconds INTEGER,
            device_type TEXT,
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS user_sessions (
            id TEXT PRIMARY KEY,
            user_id VARCHAR,
            session_id TEXT NOT NULL UNIQUE,
            started_at TIMESTAMP DEFAULT NOW(),
            ended_at TIMESTAMP,
            total_pages INTEGER DEFAULT 0,
            entry_page TEXT,
            exit_page TEXT,
            device_type TEXT,
            user_agent TEXT
          );

          CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON user_analytics_events(created_at);
          CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON user_analytics_events(event_type);
          CREATE INDEX IF NOT EXISTS idx_analytics_page ON user_analytics_events(page);
          CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON user_analytics_events(session_id);
        `);
        console.log("✅ [DB] User analytics tables ensured.");
      } catch (trgmErr: any) {
        console.warn("⚠️ [DB] DB schema setup notice:", trgmErr.message);
      }
      
      client.release();

      console.log("✅ [DB] Database connected successfully.");
      return true;

    } catch (err: any) {
      retries++;
      const errorCode = err.code || 'UNKNOWN';
      const errorMessage = err.message || 'Unknown error';

      console.error(`[DB] Connection failed (Attempt ${retries}/${MAX_RETRIES}): [${errorCode}] ${errorMessage}`);

      // Specific error handling
      if (errorCode === 'ENOTFOUND' || errorCode === 'EAI_AGAIN') {
        console.error("   → DNS/Network Error: Cannot resolve database host.");
      } else if (errorCode === '28P01' || errorCode === '28000') {
        console.error("   → Authentication Error: Invalid credentials.");
        // Don't retry auth errors - they won't fix themselves
        throw new Error(`Database authentication failed: ${errorMessage}`);
      } else if (errorCode === '3D000') {
        console.error("   → Database does not exist.");
        throw new Error(`Database not found: ${errorMessage}`);
      } else if (errorCode === 'ETIMEDOUT' || errorCode === 'ECONNREFUSED') {
        console.error("   → Connection timeout/refused. Database may be sleeping or unreachable.");
      }

      if (retries >= MAX_RETRIES) {
        console.error("❌ [DB] Max retries reached. Database connection failed.");
        throw new Error(`Database connection failed after ${MAX_RETRIES} attempts: ${errorMessage}`);
      }

      console.log(`[DB] Waiting ${RETRY_DELAY}ms before retry...`);
      await new Promise(res => setTimeout(res, RETRY_DELAY));
    }
  }

  return false;
}

// Handle pool errors gracefully
pool.on('error', (err) => {
  console.error('[DB Pool] Unexpected error on idle client:', err.message);
  // Don't crash - just log and let the pool handle reconnection
});
