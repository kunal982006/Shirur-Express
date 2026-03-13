import 'dotenv/config';
import { db } from './server/db';
import { serviceProviders } from '@shared/schema';
import { ilike } from 'drizzle-orm';
import * as fs from 'fs';

async function run() {
    const p = await db.query.serviceProviders.findMany({
        where: ilike(serviceProviders.businessName, '%chicken%')
    });
    fs.writeFileSync('check_chicken_utf8.txt', JSON.stringify(p, null, 2), 'utf-8');
    process.exit(0);
}
run();
