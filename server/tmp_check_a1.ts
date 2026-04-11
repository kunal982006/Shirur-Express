import 'dotenv/config';
import { db } from "./db";
import { users, serviceProviders } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

async function query() {
    const providers = await db.query.serviceProviders.findMany({
        where: ilike(serviceProviders.businessName, "%A1%"),
        with: {
            user: true
        }
    });

    for (const p of providers) {
        console.log(`Business Name: ${p.businessName}`);
        if (p.user) {
            console.log(`Username: ${p.user.username}`);
            console.log(`Password: ${p.user.password}`);
        }
    }

    const allUsers = await db.query.users.findMany({
        where: ilike(users.username, "%a1%"),
    });

    for (const u of allUsers) {
        console.log(`Find user query:`);
        console.log(`Username: ${u.username}`);
        console.log(`Password: ${u.password}`);
    }
}
query().then(() => process.exit(0)).catch(console.error);
