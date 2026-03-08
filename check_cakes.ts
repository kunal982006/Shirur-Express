import { db } from "./server/db";
import { cakeProducts, serviceProviders } from "@shared/schema";
import { eq } from "drizzle-orm";

async function run() {
    const cakes = await db.select().from(cakeProducts);
    console.log("Cakes total:", cakes.length);
    if (cakes.length > 0) {
        console.log("Cake 0:", cakes[0].name, "Provider ID:", cakes[0].providerId);
        const provider = await db.select().from(serviceProviders).where(eq(serviceProviders.id, cakes[0].providerId));
        console.log("Provider for cake:", provider[0]?.businessName, provider[0]?.categoryId);
    }
}

run().catch(console.error).then(() => process.exit(0));
