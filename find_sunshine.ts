import { db } from "./server/db";
import { serviceProviders, restaurantMenuItems } from "@shared/schema";
import { ilike } from "drizzle-orm";

async function main() {
  const provider = await db.query.serviceProviders.findFirst({
    where: ilike(serviceProviders.businessName, "%sunshine cafe%")
  });

  if (!provider) {
    console.error("Provider 'Sunshine Cafe' not found");
    // Just searching for sunshine
    const sunshine = await db.query.serviceProviders.findMany({
      where: ilike(serviceProviders.businessName, "%sunshine%")
    });
    console.log("Found matches for 'sunshine':");
    console.log(sunshine.map(p => ({ id: p.id, name: p.businessName })));
    process.exit(1);
  }

  console.log("Provider found:", provider.businessName, "with ID:", provider.id);
}

main().catch(console.error);
