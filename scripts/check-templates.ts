
import { db } from "../server/db";
import { serviceTemplates } from "../shared/schema";
import { eq } from "drizzle-orm";

async function checkTemplates() {
    console.log("Checking service templates...");

    const templates = await db.select().from(serviceTemplates).where(eq(serviceTemplates.categorySlug, "beauty-parlor"));
    console.log(`Found ${templates.length} templates.`);

    templates.forEach(t => {
        console.log(`- SubCat: ${t.subCategory}, Name: ${t.name}, Price: ${t.defaultPrice}`);
    });

    process.exit(0);
}

checkTemplates().catch(console.error);
