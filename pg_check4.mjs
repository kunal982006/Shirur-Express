import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    try {
        const provRes = await client.query(`SELECT id, "business_name", category_id FROM service_providers WHERE "business_name" ILIKE '%abhiruchi%'`);
        const abhiruchiId = provRes.rows[0].id;

        const street = await client.query(`SELECT id, name FROM street_food_items WHERE "provider_id" = $1`, [abhiruchiId]);
        const grocery = await client.query(`SELECT id, name FROM grocery_products WHERE "provider_id" = $1`, [abhiruchiId]);
        const cake = await client.query(`SELECT id, name FROM cake_products WHERE "provider_id" = $1`, [abhiruchiId]);

        console.log("-----------------------");
        console.log("STREET FOOD:", street.rows.length);
        console.log("GROCERY:", grocery.rows.length);
        console.log("CAKE:", cake.rows.length);
        console.log("-----------------------");

    } catch (e) {
        console.error("error", e.message);
    } finally {
        await client.end();
        process.exit(0);
    }
}
check();
