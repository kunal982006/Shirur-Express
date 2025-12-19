
import { db } from "../server/db";
import { sql } from "drizzle-orm";
import fs from 'fs';

async function checkColumns() {
    try {
        const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
        const columns = result.rows.map((row: any) => row.column_name);
        const output = "Columns in 'users' table: " + JSON.stringify(columns);
        console.log(output);
        fs.writeFileSync('columns_log.txt', output);
    } catch (error) {
        const err = "Error fetching columns: " + error
        console.error(err);
        fs.writeFileSync('columns_log.txt', err);
    } finally {
        process.exit(0);
    }
}

checkColumns();
