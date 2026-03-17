import { db } from "./server/db";
import fs from "fs";

async function main() {
  const allProviders = await db.query.serviceProviders.findMany({});
  fs.writeFileSync("providers.json", JSON.stringify(allProviders.map(p => ({ id: p.id, name: p.businessName })), null, 2));
  console.log("Wrote to providers.json");
}

main().catch(console.error);
