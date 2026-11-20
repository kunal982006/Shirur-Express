import { db } from "../server/db";
import { streetFoodItems, serviceProviders } from "../shared/schema";
import { eq } from "drizzle-orm";
async function run() {
  const items = await db.select({ p: serviceProviders.businessName, c: streetFoodItems.category, n: streetFoodItems.name }).from(streetFoodItems).innerJoin(serviceProviders, eq(serviceProviders.id, streetFoodItems.providerId));
  const m: Record<string, Record<string, number>> = {};
  for (const i of items) { (m[i.p] ??= {}); m[i.p][i.c ?? "(none)"] = (m[i.p][i.c ?? "(none)"] || 0) + 1; }
  console.log(JSON.stringify(m, null, 1));
  process.exit(0);
}
run();
