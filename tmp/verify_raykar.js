
import pkg from 'pg';
const { Client } = pkg;

const databaseUrl = "postgresql://neondb_owner:npg_kuxGK30bPtfv@ep-little-rice-a1lrthg1-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const providerId = "ae0afs4sp07891gj3f8suj";

async function run() {
    const client = new Client({
        connectionString: databaseUrl,
    });
    await client.connect();
    
    try {
        const res = await client.query("SELECT name, price, section, sub_category FROM service_offerings WHERE provider_id = $1", [providerId]);
        console.log("Offerings for Raykar:");
        res.rows.forEach(r => console.log(`- ${r.name}: ₹${r.price} (${r.section}/${r.sub_category})`));
        console.log(`Total items: ${res.rows.length}`);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
