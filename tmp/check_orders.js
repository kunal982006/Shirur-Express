
import { config } from "dotenv";
config();
import pkg from 'pg';
const { Client } = pkg;

async function run() {
    const client = new Client(process.env.DATABASE_URL);
    await client.connect();
    try {
        const res = await client.query("SELECT * FROM street_food_orders ORDER BY created_at DESC LIMIT 5");
        console.log(JSON.stringify(res.rows, null, 2));
    } finally {
        await client.end();
    }
}
run();
