import 'dotenv/config';
import fs from 'fs';
import { db } from '../server/db';
import { serviceProviders, groceryProducts } from '../shared/schema';

async function main() {
  const gProducts = await db.select().from(groceryProducts);
  
  const providers = await db.select().from(serviceProviders);
  const providerMap = new Map();
  providers.forEach(p => providerMap.set(p.id, p.businessName));

  const providerCounts = new Map();
  gProducts.forEach(p => {
    providerCounts.set(p.providerId, (providerCounts.get(p.providerId) || 0) + 1);
  });

  const summary = Array.from(providerCounts.entries()).map(([id, count]) => ({
    providerId: id,
    businessName: providerMap.get(id),
    productCount: count
  }));

  const sampleProducts = gProducts.slice(0, 10).map(p => ({ name: p.name }));

  const data = {
    summary,
    sampleProducts
  };

  fs.writeFileSync('gmart_info.json', JSON.stringify(data, null, 2));
  console.log("Wrote products to gmart_info.json");

  process.exit(0);
}
main().catch(console.error);
