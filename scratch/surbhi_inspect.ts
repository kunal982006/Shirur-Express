import 'dotenv/config';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';
const vs: any = await db.execute(sql`select sp.id, sp.business_name, sp.user_id, sp.profile_image_url, sp.display_order, sp.is_available,
  (select count(*)::int from street_food_items i where i.provider_id=sp.id) items,
  (select count(*)::int from street_food_orders o where o.provider_id=sp.id) orders
  from service_providers sp where sp.category_id='7f0b4ead-2756-4ace-8fd8-f76fb796f343' order by business_name`);
for (const r of (vs.rows ?? vs)) console.log(JSON.stringify(r));
process.exit(0);
