
import { config } from "dotenv";
config();
import pkg from 'pg';
const { Client } = pkg;

async function run() {
    const client = new Client(process.env.DATABASE_URL);
    await client.connect();
    try {
        const res = await client.query("SELECT id, business_name, category_id, user_id FROM service_providers WHERE category_id = '7f0b4ead-2756-4ace-8fd8-f76fb796f343'");
        console.log("Vendors:", JSON.stringify(res.rows, null, 2));
    } finally {
        await client.end();
    }
}
run();
