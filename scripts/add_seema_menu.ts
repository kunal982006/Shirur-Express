
import { db } from "../server/db";
import { serviceProviders, serviceOfferings } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

async function main() {
    const providerName = "Unique Salon"; // Stored in DB
    const provider = await db.query.serviceProviders.findFirst({
        where: ilike(serviceProviders.businessName, providerName)
    });

    if (!provider) {
        console.error(`Provider '${providerName}' not found. Cannot add menu.`);
        process.exit(1);
    }

    console.log(`Found provider: ${provider.businessName} (${provider.id})`);

    // Define Menu
    const menuItems = [
        // Section: Hair, SubCategory: Haircut
        { section: "Hair", subCategory: "Haircut", name: "Bob cut", price: "300", duration: 30 },
        { section: "Hair", subCategory: "Haircut", name: "Wolf cut", price: "280", duration: 30 },
        { section: "Hair", subCategory: "Haircut", name: "Lob (long hair)", price: "350", duration: 30 },
        { section: "Hair", subCategory: "Haircut", name: "Pixie cut", price: "320", duration: 30 },
        { section: "Hair", subCategory: "Haircut", name: "Curtain Bangs", price: "450", duration: 30 },

        // Section: Hair, SubCategory: Hairstyles
        { section: "Hair", subCategory: "Hairstyles", name: "The Bevelled Bob", price: "350", duration: 15 },
        { section: "Hair", subCategory: "Hairstyles", name: "The Power Pixie", price: "300", duration: 15 },
        { section: "Hair", subCategory: "Hairstyles", name: "Birkin Bangs & Soft Layers", price: "500", duration: 15 },
        { section: "Hair", subCategory: "Hairstyles", name: "The Modern Shag (The \"Pammy\" Shag)", price: "450", duration: 15 },
        { section: "Hair", subCategory: "Hairstyles", name: "Liquid Mirror Hair (Ultra-Glossy)", price: "350", duration: 15 },

        // Section: Hair, SubCategory: Hair Treatments
        { section: "Hair", subCategory: "Hair Treatments", name: "Straightening", price: "5000", duration: 120 },
        { section: "Hair", subCategory: "Hair Treatments", name: "Smoothening", price: "4500", duration: 120 },
        { section: "Hair", subCategory: "Hair Treatments", name: "Hair Botox", price: "5500", duration: 120 }, // Corrected "Buttocks" to "Hair Botox"
        { section: "Hair", subCategory: "Hair Treatments", name: "Keratin", price: "4500", duration: 120 },
        { section: "Hair", subCategory: "Hair Treatments", name: "Nanoplastia", price: "5500", duration: 120 },

        // Section: Skin Care, SubCategory: Facials
        { section: "Skin Care", subCategory: "Facials", name: "Potali facial", price: "900", duration: 30 },
        { section: "Skin Care", subCategory: "Facials", name: "Gold facial", price: "900", duration: 30 },
        { section: "Skin Care", subCategory: "Facials", name: "Silver facial", price: "800", duration: 30 },
        { section: "Skin Care", subCategory: "Facials", name: "Platinum facial", price: "900", duration: 30 },
        { section: "Skin Care", subCategory: "Facials", name: "Acne facial", price: "700", duration: 30 },

        // Section: Skin Care, SubCategory: Hair Removal
        { section: "Skin Care", subCategory: "Hair Removal", name: "Hand wax", price: "500", duration: 30 },
        { section: "Skin Care", subCategory: "Hair Removal", name: "Leg wax", price: "750", duration: 30 },
        { section: "Skin Care", subCategory: "Hair Removal", name: "Full body wax", price: "900", duration: 30 },
        { section: "Skin Care", subCategory: "Hair Removal", name: "Underarms", price: "450", duration: 30 },
        { section: "Skin Care", subCategory: "Hair Removal", name: "Eyebrows", price: "50", duration: 15 },

        // Section: Makeover, SubCategory: Makeup
        { section: "Makeover", subCategory: "Makeup", name: "Simple makeup", price: "300", duration: 30 },
        { section: "Makeover", subCategory: "Makeup", name: "HD makeup", price: "400", duration: 30 },
        { section: "Makeover", subCategory: "Makeup", name: "Party makeup", price: "500", duration: 30 },
        { section: "Makeover", subCategory: "Makeup", name: "Simple HD makeup", price: "450", duration: 30 },
        { section: "Makeover", subCategory: "Makeup", name: "Heavy HD makeup", price: "600", duration: 30 },

        // Section: Makeover, SubCategory: Nail Art
        { section: "Makeover", subCategory: "Nail Art", name: "French manicure", price: "1500", duration: 60 },
        { section: "Makeover", subCategory: "Nail Art", name: "Ombre/gradient", price: "900", duration: 60 },
        { section: "Makeover", subCategory: "Nail Art", name: "Geometric", price: "1200", duration: 60 },
        { section: "Makeover", subCategory: "Nail Art", name: "Floral", price: "9500", duration: 60 }, // Kept 9500 as requested
        { section: "Makeover", subCategory: "Nail Art", name: "Abstract", price: "1200", duration: 60 },
    ];

    console.log("Adding items...");
    await db.delete(serviceOfferings).where(eq(serviceOfferings.providerId, provider.id)); // Clear old items to prevent duplicates

    for (const item of menuItems) {
        await db.insert(serviceOfferings).values({
            providerId: provider.id,
            section: item.section,
            subCategory: item.subCategory,
            name: item.name,
            price: item.price,
            duration: item.duration,
            isActive: true,
            categorySlug: "beauty" // or beauty-parlor
        });
        console.log(`Added: ${item.name}`);
    }

    console.log("Menu added successfully!");
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
