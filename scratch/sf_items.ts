import { db } from "../server/db";
import { streetFoodItems, serviceProviders } from "../shared/schema";
import { eq, inArray } from "drizzle-orm";
async function run() {
  const items = await db.select({ id: streetFoodItems.id, p: serviceProviders.businessName, c: streetFoodItems.category, n: streetFoodItems.name, pr: streetFoodItems.price, d: streetFoodItems.description }).from(streetFoodItems).innerJoin(serviceProviders, eq(serviceProviders.id, streetFoodItems.providerId)).where(inArray(serviceProviders.businessName, ["Davangiri Loni spanje dosa","Tumkur Tattey Idli","Dalcha Rice"]));
  for (const i of items) console.log(`${i.p} | ${i.c} | ${i.n} | ${i.pr} | ${i.d ?? ""} | ${i.id}`);
  process.exit(0);
}
run();
