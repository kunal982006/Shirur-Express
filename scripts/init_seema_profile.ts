
import { db } from "../server/db";
import { users, serviceProviders, serviceCategories } from "@shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    // 1. Find User
    const user = await db.query.users.findFirst({
        where: eq(users.username, "seema wagmare")
    });

    if (!user) {
        console.error("User 'seema wagmare' not found!");
        process.exit(1);
    }
    console.log("Found User:", user.id);

    // 2. Find Category
    let category = await db.query.serviceCategories.findFirst({
        where: eq(serviceCategories.slug, "beauty")
    });

    if (!category) {
        console.log("Category 'beauty' not found, trying 'beauty-parlor'...");
        category = await db.query.serviceCategories.findFirst({
            where: eq(serviceCategories.slug, "beauty-parlor")
        });
    }

    if (!category) {
        console.error("Category 'beauty' or 'beauty-parlor' not found!");
        process.exit(1);
    }
    console.log("Found Category:", category.name, category.id);

    // 3. Check Provider
    const provider = await db.query.serviceProviders.findFirst({
        where: eq(serviceProviders.userId, user.id)
    });

    if (provider) {
        console.log("Provider profile already exists:", provider.businessName);
    } else {
        console.log("Creating provider profile...");
        await db.insert(serviceProviders).values({
            userId: user.id,
            categoryId: category.id,
            businessName: "Seema Wagmare",
            description: "Professional Beauty Services",
            shortDescription: "Beauty Parlor",
            rating: "5.0",
            isAvailable: true,
            serviceArea: 10,
            address: "Shirur", // Default
            contactPhone: user.phone || "0000000000",
            experienceYears: 1
        });
        console.log("Provider profile created successfully!");
    }
}

main().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
