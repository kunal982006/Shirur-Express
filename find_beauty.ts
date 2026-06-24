import { db } from "./server/db";
import { serviceProviders } from "./shared/schema";
import { ilike } from "drizzle-orm";

async function main() {
  const providers = await db.select().from(serviceProviders).where(ilike(serviceProviders.businessName, "%sneh%"));
  console.log(providers.map(p => `${p.id} - ${p.businessName}`));
  process.exit(0);
}

main();
