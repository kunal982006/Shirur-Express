import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './shared/schema';
import * as fs from 'fs';

async function check() {
  const sql = neon("postgresql://neondb_owner:npg_kuxGK30bPtfv@ep-little-rice-a1lrthg1-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require");
  const db = drizzle(sql);

  const allBookings = await db.select().from(schema.bookings);
  const plumberBookings = allBookings.filter(b => b.serviceType === 'plumber');

  const allProviders = await db.select().from(schema.serviceProviders);
  const categories = await db.select().from(schema.serviceCategories);
  const plumberCategories = categories.filter(c => c.slug === 'plumber').map(c => c.id);
  const plumberProviders = allProviders.filter(p => plumberCategories.includes(p.categoryId));
  
  const output = {
    plumberBookings,
    plumberCategories,
    plumberProviders
  };
  fs.writeFileSync('output.json', JSON.stringify(output, null, 2));
}

check().catch(console.error);
