import { config } from "dotenv";
import pg from "pg";
config();
const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`SELECT id, user_id, service_type, problem_id, status, created_at FROM bookings WHERE provider_id IS NULL AND status = 'cancelled' ORDER BY created_at DESC LIMIT 4`);
    console.table(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

main();
