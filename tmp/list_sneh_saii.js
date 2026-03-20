
import pkg from 'pg';
const { Client } = pkg;

const databaseUrl = "postgresql://neondb_owner:npg_kuxGK30bPtfv@ep-little-rice-a1lrthg1-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function run() {
    const client = new Client({
        connectionString: databaseUrl,
    });
    await client.connect();
    
    try {
        const res = await client.query("SELECT id, business_name FROM service_providers WHERE business_name ILIKE '%Sneh%' OR business_name ILIKE '%Saii%'");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
