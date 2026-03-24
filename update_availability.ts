import "dotenv/config";
import { db } from "./server/db";
import { serviceProviders } from "./shared/schema";

async function run() {
  console.log("Setting all serviceProviders to isAvailable = true...");
  const result = await db.update(serviceProviders).set({ isAvailable: true }).returning();
  console.log(`Updated ${result.length} providers successfully.`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
