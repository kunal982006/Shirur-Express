
import { db } from "../server/db";
import { sql } from "drizzle-orm";
import fs from 'fs';

async function checkSPColumns() {
    try {
        const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'service_providers';
    `);
        const columns = result.rows.map((row: any) => row.column_name);
        const output = "Columns in 'service_providers' table: " + JSON.stringify(columns);
        console.log(output);
        fs.writeFileSync('sp_columns_log.txt', output);
    } catch (error) {
        const err = "Error fetching columns: " + error
        console.error(err);
        fs.writeFileSync('sp_columns_log.txt', err);
    } finally {
        process.exit(0);
    }
}

checkSPColumns();
