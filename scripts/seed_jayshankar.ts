
import { db } from "../server/db";
import { serviceProviders, streetFoodItems } from "../shared/schema";
import { eq, ilike } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

async function seedJayShankar() {
    console.log("Checking for 'Jay Shankar Dessert' provider...");

    let provider = await db.query.serviceProviders.findFirst({
        where: ilike(serviceProviders.businessName, "%Jay Shankar Dessert%")
    });

    if (!provider) {
        console.log("Provider not found. Creating 'Jay Shankar Dessert'...");
        const [newProvider] = await db.insert(serviceProviders).values({
            userId: "user_" + createId(), // Placeholder user ID for unrelated provider
            categoryId: "street-food", // Ensure this matches your category ID logic
            businessName: "Jay Shankar Dessert",
            description: "Sweetness in every bite. Famous for Chocolate Bowls and Desserts.",
            address: "Shirur Market, Shirur",
            rating: "4.8",
            isVerified: true,
            serviceArea: 5,
            specializations: ["Desserts", "Chocolate Bowls"],
            galleryImages: ["https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800"] // Placeholder image
        }).returning();
        provider = newProvider;
    } else {
        console.log(`Found existing provider: ${provider.businessName} (${provider.id})`);
    }

    console.log(`Seeding menu items for provider: ${provider.id}...`);

    const menuItems = [
        // Chocolate Bowl Category
        { name: "Dark chocolate bowl", price: "100", category: "Chocolate Bowl", description: "Rich dark chocolate dessert bowl (Regular)" },
        { name: "Dark chocolate bowl (Large)", price: "150", category: "Chocolate Bowl", description: "Rich dark chocolate dessert bowl (Large)" },

        { name: "Triple chocolate bowl", price: "100", category: "Chocolate Bowl", description: "Loaded with three types of chocolate (Regular)" },
        { name: "Triple chocolate bowl (Large)", price: "150", category: "Chocolate Bowl", description: "Loaded with three types of chocolate (Large)" },

        { name: "Kitkat chocolate bowl", price: "120", category: "Chocolate Bowl", description: "Crunchy Kitkat mixed with chocolate (Regular)" },
        { name: "Kitkat chocolate bowl (Large)", price: "170", category: "Chocolate Bowl", description: "Crunchy Kitkat mixed with chocolate (Large)" },

        { name: "Oreo chocolate bowl", price: "120", category: "Chocolate Bowl", description: "Classic Oreo and chocolate combo (Regular)" },
        { name: "Oreo chocolate bowl (Large)", price: "170", category: "Chocolate Bowl", description: "Classic Oreo and chocolate combo (Large)" },

        // Special Chocolate Bowl Category
        { name: "Strawberry chocolate bowl", price: "220", category: "Special Chocolate Bowl", description: "Fresh strawberry flavors with chocolate" },
        { name: "Dryfruit chocolate bowl", price: "220", category: "Special Chocolate Bowl", description: "Rich dry fruits loaded chocolate bowl" },
    ];

    for (const item of menuItems) {
        // Check if item exists to avoid duplicates
        const existing = await db.query.streetFoodItems.findFirst({
            where: (items, { and, eq }) => and(
                eq(items.providerId, provider!.id),
                eq(items.name, item.name)
            )
        });

        if (!existing) {
            await db.insert(streetFoodItems).values({
                providerId: provider.id,
                name: item.name,
                description: item.description,
                price: item.price,
                category: item.category,
                isVeg: true, // All items seem veg (green dot)
                isAvailable: true,
                imageUrl: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500" // Generic dessert placeholder
            });
            console.log(`Added: ${item.name}`);
        } else {
            console.log(`Skipped (Exists): ${item.name}`);
        }
    }

    console.log("Seeding completed successfully!");
    process.exit(0);
}

seedJayShankar().catch((err) => {
    console.error("Error seeding Jay Shankar menu:", err);
    process.exit(1);
});
