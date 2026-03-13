import 'dotenv/config';
import { db } from './server/db';
import { serviceProviders } from '@shared/schema';
import { ilike } from 'drizzle-orm';

async function run() {
    const p = await db.query.serviceProviders.findMany({
        where: ilike(serviceProviders.businessName, '%chicken%')
    });
    console.log(JSON.stringify(p, null, 2));
    process.exit(0);
}
run();
