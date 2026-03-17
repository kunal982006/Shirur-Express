import { db } from "./server/db";
import { serviceProviders } from "@shared/schema";

async function main() {
  const allProviders = await db.query.serviceProviders.findMany({});
  console.log(allProviders.map(p => ({ id: p.id, name: p.businessName })));
}

main().catch(console.error);
