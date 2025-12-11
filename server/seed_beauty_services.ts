
import { db } from "./db";
import { serviceTemplates } from "@shared/schema";
import { eq } from "drizzle-orm";

const beautyServices = [
    // Hair
    {
        categorySlug: "beauty",
        subCategory: "Hair",
        name: "Haircut",
        defaultPrice: "250.00",
        imageUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    },
    {
        categorySlug: "beauty",
        subCategory: "Hair",
        name: "Hair Spa",
        defaultPrice: "800.00",
        imageUrl: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    },
    {
        categorySlug: "beauty",
        subCategory: "Hair",
        name: "Smoothing",
        defaultPrice: "3000.00",
        imageUrl: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    },
    {
        categorySlug: "beauty",
        subCategory: "Hair",
        name: "Keratin",
        defaultPrice: "4000.00",
        imageUrl: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    },

    // Skin
    {
        categorySlug: "beauty",
        subCategory: "Skin",
        name: "Fruit Facial",
        defaultPrice: "500.00",
        imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    },
    {
        categorySlug: "beauty",
        subCategory: "Skin",
        name: "Gold Facial",
        defaultPrice: "1200.00",
        imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    },
    {
        categorySlug: "beauty",
        subCategory: "Skin",
        name: "Bleach",
        defaultPrice: "200.00",
        imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    },
    {
        categorySlug: "beauty",
        subCategory: "Skin",
        name: "Waxing (Full Arms)",
        defaultPrice: "250.00",
        imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    },
    {
        categorySlug: "beauty",
        subCategory: "Skin",
        name: "Waxing (Full Legs)",
        defaultPrice: "350.00",
        imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    },

    // Makeup
    {
        categorySlug: "beauty",
        subCategory: "Makeup",
        name: "Bridal Makeup",
        defaultPrice: "5000.00",
        imageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    },
    {
        categorySlug: "beauty",
        subCategory: "Makeup",
        name: "Party Makeup",
        defaultPrice: "1500.00",
        imageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    },
    {
        categorySlug: "beauty",
        subCategory: "Makeup",
        name: "Threading",
        defaultPrice: "50.00",
        imageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    },

    // Nail
    {
        categorySlug: "beauty",
        subCategory: "Nail",
        name: "Manicure",
        defaultPrice: "400.00",
        imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    },
    {
        categorySlug: "beauty",
        subCategory: "Nail",
        name: "Pedicure",
        defaultPrice: "500.00",
        imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    },
];

async function seed() {
    console.log("Seeding beauty services...");

    // Clear existing templates for beauty
    await db.delete(serviceTemplates).where(eq(serviceTemplates.categorySlug, "beauty"));

    // Insert new templates
    await db.insert(serviceTemplates).values(beautyServices);

    console.log("Done!");
    process.exit(0);
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
