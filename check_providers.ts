
import { db } from "./server/db";
import { serviceProviders, serviceCategories } from "@shared/schema";
import { eq } from "drizzle-orm";
import fs from 'fs';

async function listProviders() {
    try {
        const beauty = await db.query.serviceCategories.findFirst({
            where: eq(serviceCategories.slug, "beauty")
        });

        if (!beauty) {
            fs.writeFileSync('providers.log', "Beauty category not found");
            process.exit(0);
        }

        const providers = await db.query.serviceProviders.findMany({
            where: eq(serviceProviders.categoryId, beauty.id)
        });

        const log = providers.map(p => `- ${p.businessName} (ID: ${p.id})`).join('\n');
        console.log(log);
        fs.writeFileSync('providers.log', log);
    } catch (error: any) {
        fs.writeFileSync('providers.log', "Error: " + error.toString());
    } finally {
        process.exit(0);
    }
}

listProviders();
