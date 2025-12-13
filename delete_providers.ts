
import { db } from "./server/db";
import { serviceProviders, serviceCategories } from "@shared/schema";
import { eq, and, notInArray } from "drizzle-orm";
import fs from 'fs';

async function deleteProviders() {
    try {
        const beauty = await db.query.serviceCategories.findFirst({
            where: eq(serviceCategories.slug, "beauty")
        });

        if (!beauty) {
            console.log("Beauty category not found");
            process.exit(0);
        }

        const keepIds = [
            'vvahx703oxsd24t0iyvbvjyw', // Sneh hair& beauty
            'vyw7422xa6j3hmxbu5ujjb8r'  // parlor1
        ];

        console.log(`Keeping IDs: ${keepIds.join(', ')}`);

        const result = await db.delete(serviceProviders)
            .where(and(
                eq(serviceProviders.categoryId, beauty.id),
                notInArray(serviceProviders.id, keepIds)
            ))
            .returning();

        const log = `Deleted ${result.length} providers.\n` +
            result.map(p => `Deleted: ${p.businessName} (${p.id})`).join('\n');
        console.log(log);
        fs.writeFileSync('delete_log.txt', log);

    } catch (error) {
        console.error("Error deleting providers:", error);
        fs.writeFileSync('delete_log.txt', "Error: " + error);
    } finally {
        process.exit(0);
    }
}

deleteProviders();
