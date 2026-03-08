import('dotenv').then(dotenv => dotenv.config());
import { neon } from '@neondatabase/serverless';

async function verify() {
    const sql = neon(process.env.DATABASE_URL!);
    console.log("Checking DB directly for 'abhiruchi'...");
    try {
        const rows = await sql`SELECT id, "businessName", "categoryId" FROM service_providers WHERE "businessName" ILIKE '%abhiruchi%'`;
        console.log(rows);
    } catch (e) {
        console.error(e);
    }
}
verify();
