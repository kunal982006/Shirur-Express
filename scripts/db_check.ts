import 'dotenv/config';
import { db } from '../server/db';
import { serviceProviders, groceryProducts } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const providers = await db.select().from(serviceProviders);
  console.log("Providers:", providers.map(p => ({ id: p.id, name: p.businessName })));

  const firstFew = await db.select().from(groceryProducts).limit(5);
  console.log("Sample Grocery Products:", firstFew.map(p => ({ id: p.id, name: p.name, providerId: p.providerId })));

  process.exit(0);
}
main().catch(console.error);
