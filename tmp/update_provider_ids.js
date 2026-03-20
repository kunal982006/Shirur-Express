
import pkg from 'pg';
const { Client } = pkg;

const databaseUrl = "postgresql://neondb_owner:npg_kuxGK30bPtfv@ep-little-rice-a1lrthg1-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function run() {
    const client = new Client({
        connectionString: databaseUrl,
    });
    await client.connect();
    
    try {
        await client.query("UPDATE service_offerings SET provider_id = 'ae0afs4sp07891gj3f8sujrr' WHERE provider_id = 'ae0afs4sp07891gj3f8suj'");
        await client.query("UPDATE service_offerings SET provider_id = 'r078e4l5r66rry01pi8d1vhy' WHERE provider_id = 'r078e4l5r66rry01pi8d1v'");
        await client.query("UPDATE service_offerings SET provider_id = 'vvahx703oxsd24t0iyvbvjyw' WHERE provider_id = 'vvahx703oxsd24t0iyvbvj'");
        
        console.log("Updated provider IDs in service_offerings successfully.");
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
