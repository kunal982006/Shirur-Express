import 'dotenv/config';
import { db } from "./db";
import { serviceProviders } from "@shared/schema";
import { ilike } from "drizzle-orm";

async function main() {
    const providers = await db.query.serviceProviders.findMany({
        where: ilike(serviceProviders.businessName, '%rassa%')
    });
    console.log("ID_IS: " + providers[0]?.id);
    process.exit(0);
}
main().catch(console.error);
