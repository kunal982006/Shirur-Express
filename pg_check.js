const { Client } = require('pg');
require('dotenv').config();

async function check() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    try {
        const res = await client.query(`SELECT id, "businessName", "categoryId" FROM service_providers WHERE "businessName" ILIKE '%abhiruchi%'`);
        console.log("RAW DB RESPONSE:", res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
check();
