
import { db } from "../server/db";
import { serviceCategories } from "@shared/schema";
import { eq } from "drizzle-orm";

async function renameElectricianCategory() {
    console.log("Renaming Electrician category...");

    const result = await db.update(serviceCategories)
        .set({ name: "Technician & Electrician" })
        .where(eq(serviceCategories.slug, "electrician"))
        .returning();

    if (result.length > 0) {
        console.log(`Successfully renamed category to '${result[0].name}'.`);
    } else {
        console.log("Category 'electrician' not found or name not changed.");
    }
    process.exit(0);
}

renameElectricianCategory().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
