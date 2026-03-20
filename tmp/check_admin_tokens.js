
import { config } from "dotenv";
config();
import pkg from 'pg';
const { Client } = pkg;

async function run() {
    const client = new Client(process.env.DATABASE_URL);
    await client.connect();
    try {
        const res = await client.query("SELECT id, username, fcm_token, fcm_tokens FROM users WHERE username = 'main_branch'");
        console.log(JSON.stringify(res.rows, null, 2));
    } finally {
        await client.end();
    }
}
run();
