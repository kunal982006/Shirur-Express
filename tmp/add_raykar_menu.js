
import pkg from 'pg';
const { Client } = pkg;
import { createId } from "@paralleldrive/cuid2";

const databaseUrl = "postgresql://neondb_owner:npg_kuxGK30bPtfv@ep-little-rice-a1lrthg1-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const providerId = "ae0afs4sp07891gj3f8suj";
const section = "Skincare";
const subCategory = "Facials";

const items = [
    { name: "VLCC", price: "999" },
    { name: "Shills professional facial", price: "999" },
    { name: "Gold facial", price: "999" },
    { name: "O3", price: "1499" },
    { name: "Glod cleanup", price: "499" },
    { name: "Mixfruit", price: "499" },
    { name: "Dr Rashel", price: "499" },
    { name: "Dtan", price: "499" }
];

async function run() {
    const client = new Client({
        connectionString: databaseUrl,
    });
    await client.connect();
    
    try {
        for (const item of items) {
            const id = createId();
            const query = `
                INSERT INTO service_offerings (id, provider_id, name, section, sub_category, price, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, true)
            `;
            await client.query(query, [id, providerId, item.name, section, subCategory, item.price]);
            console.log(`Inserted: ${item.name}`);
        }
        console.log("Finished adding menu items.");
    } catch (err) {
        console.error("Error inserting items:", err);
    } finally {
        await client.end();
    }
}

run();
