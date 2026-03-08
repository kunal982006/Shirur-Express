import { db } from "./db";
import { users, serviceProviders } from "@shared/schema";
import { ilike } from "drizzle-orm";

async function main() {
    const p = await db.query.serviceProviders.findMany({
        where: ilike(serviceProviders.businessName, "%rassa%")
    });
    console.log("Providers:", p.map(pr => pr.businessName + " (" + pr.id + ")"));

    const u = await db.query.users.findMany({
        where: ilike(users.username, "%rassa%")
    });
    console.log("Users:", u.map(us => us.username + " (" + us.id + ")"));
    process.exit(0);
}

main().catch(console.error);
