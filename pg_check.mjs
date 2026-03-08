import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    try {
        const res = await client.query(`SELECT id, "business_name", category_id FROM service_providers WHERE "business_name" ILIKE '%abhiruchi%'`);
        console.log("-----------------------");
        console.log("ABHIRUCHI DATA:", res.rows);
        console.log("-----------------------");
    } catch (e) {
        console.error("error", e.message);
    } finally {
        await client.end();
        process.exit(0);
    }
}
check();
