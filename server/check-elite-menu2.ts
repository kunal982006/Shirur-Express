import 'dotenv/config';
import { db } from "./db";
import { serviceProviders, restaurantMenuItems } from "@shared/schema";
import { ilike, eq, sql } from "drizzle-orm";
import * as fs from "fs";

async function check() {
    const lines: string[] = [];

    const providers = await db.select({
        id: serviceProviders.id,
        name: serviceProviders.businessName,
        userId: serviceProviders.userId
    }).from(serviceProviders).where(ilike(serviceProviders.businessName, "%Elite%"));

    lines.push("=== Elite providers ===");
    for (const p of providers) {
        lines.push(`Provider: "${p.name}" | ID: ${p.id} | userId: ${p.userId}`);
        const count = await db.select({ cnt: sql<number>`count(*)` }).from(restaurantMenuItems).where(eq(restaurantMenuItems.providerId, p.id));
        lines.push(`  Menu items: ${count[0].cnt}`);
    }

    const urlProviderId = "oig6pewj42lgbrh65va882ht";
    const urlProvider = await db.select({
        id: serviceProviders.id,
        name: serviceProviders.businessName
    }).from(serviceProviders).where(eq(serviceProviders.id, urlProviderId));

    lines.push("\n=== Provider from URL ===");
    lines.push(`URL ID: ${urlProviderId}`);
    lines.push(`Found: ${JSON.stringify(urlProvider)}`);

    if (urlProvider.length > 0) {
        const count = await db.select({ cnt: sql<number>`count(*)` }).from(restaurantMenuItems).where(eq(restaurantMenuItems.providerId, urlProviderId));
        lines.push(`Menu items for URL provider: ${count[0].cnt}`);
    }

    fs.writeFileSync("elite_check_result.txt", lines.join("\n"), "utf-8");
    console.log("Done. Check elite_check_result.txt");
    process.exit(0);
}

check();
