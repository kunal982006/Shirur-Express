import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    try {
        const provRes = await client.query(`SELECT id, "business_name", category_id FROM service_providers WHERE "business_name" ILIKE '%abhiruchi%'`);
        const abhiruchiId = provRes.rows[0].id;
        const items = await client.query(`SELECT id, name, category, is_popular FROM restaurant_menu_items WHERE "provider_id" = $1`, [abhiruchiId]);

        console.log("-----------------------");
        console.log("MENU ITEMS COUNT FOR ABHIRUCHI:", items.rows.length);
        if (items.rows.length === 0) {
            console.log("NO MENU ITEMS FOUND FOR ABHIRUCHI in 'restaurant_menu_items'");
        }
        console.log("-----------------------");
    } catch (e) {
        console.error("error", e.message);
    } finally {
        await client.end();
        process.exit(0);
    }
}
check();
