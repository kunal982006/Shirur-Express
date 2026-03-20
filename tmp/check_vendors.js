
import { config } from "dotenv";
config();
import pkg from 'pg';
const { Client } = pkg;

async function run() {
    const client = new Client(process.env.DATABASE_URL);
    await client.connect();
    try {
        const res = await client.query("SELECT id, business_name, category_id, user_id FROM service_providers WHERE user_id = 'arueszlsn796skko2btuhwn8'");
        console.log(JSON.stringify(res.rows, null, 2));
        
        const res2 = await client.query("SELECT id, name, slug FROM service_categories WHERE slug = 'street-food'");
        console.log("Category:", JSON.stringify(res2.rows, null, 2));
    } finally {
        await client.end();
    }
}
run();
