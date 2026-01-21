
import { db } from "../server/db";
import { serviceProviders, streetFoodItems } from "../shared/schema";
import { eq } from "drizzle-orm";

async function correctSeedJayShankar() {
    const targetProviderId = "rc51keaiqwb2bnw426t7rqdk"; // ID from user logs
    console.log(`Targeting logged-in provider: ${targetProviderId}`);

    // 1. Update the provider details to match "Jay Shankar Dessert"
    await db.update(serviceProviders)
        .set({
            businessName: "Jay Shankar Dessert",
            description: "Sweetness in every bite. Famous for Chocolate Bowls and Desserts.",
            categoryId: "street-food", // Force category to street-food so dashboard works
            specializations: ["Desserts", "Chocolate Bowls"],
            rating: "4.8",
            isAvailable: true,
            serviceArea: 5,
        })
        .where(eq(serviceProviders.id, targetProviderId));

    console.log("Provider profile updated.");

    // 2. Define Menu Items
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

    // 3. Clear existing items for this provider to avoid duplicates/confusion from previous runs
    await db.delete(streetFoodItems).where(eq(streetFoodItems.providerId, targetProviderId));
    console.log("Cleared old menu items.");

    // 4. Insert new items
    for (const item of menuItems) {
        await db.insert(streetFoodItems).values({
            providerId: targetProviderId,
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            isVeg: true,
            isAvailable: true,
            imageUrl: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500"
        });
        console.log(`Added: ${item.name}`);
    }

    console.log("Re-seeding completed for the correct account!");
    process.exit(0);
}

correctSeedJayShankar().catch((err) => {
    console.error("Error re-seeding Jay Shankar menu:", err);
    process.exit(1);
});
