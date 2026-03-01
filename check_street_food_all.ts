import 'dotenv/config';
import { db } from './server/db';
import { streetFoodItems, restaurantMenuItems } from './shared/schema';
import * as fs from 'fs';

async function run() {
    const sf = await db.select().from(streetFoodItems);
    const rm = await db.select().from(restaurantMenuItems);

    const out = {
        streetFoodCount: sf.length,
        streetFoodItems: sf.map(s => ({ id: s.id, name: s.name, image: s.imageUrl, category: s.category })),
        restaurantMenuCount: rm.length,
        // Just sample first 30 restaurant items
        restaurantSample: rm.slice(0, 30).map(r => ({ id: r.id, name: r.name, image: r.imageUrl, category: r.category }))
    };

    fs.writeFileSync('all_food_items.json', JSON.stringify(out, null, 2), 'utf-8');
    console.log(`Street food: ${sf.length}, Restaurant: ${rm.length}`);
    process.exit(0);
}

run();
