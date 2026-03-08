import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    try {
        const res = await client.query(`SELECT id, "name" FROM service_categories WHERE id = '6810f39a-bceb-417a-b2ca-9555b99856da'`);
        console.log("-----------------------");
        console.log("CATEGORY DATA:", res.rows);
        console.log("-----------------------");
    } catch (e) {
        console.error("error", e.message);
    } finally {
        await client.end();
        process.exit(0);
    }
}
check();
