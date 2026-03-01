import 'dotenv/config';
import { db } from './server/db';
import { restaurantMenuItems, streetFoodItems } from './shared/schema';
import { ilike } from 'drizzle-orm';
import * as fs from 'fs';

async function run() {
    const lassis = await db.select().from(restaurantMenuItems).where(ilike(restaurantMenuItems.name, '%lassi%')).limit(10);
    const pizzas = await db.select().from(restaurantMenuItems).where(ilike(restaurantMenuItems.name, '%pizza%')).limit(10);

    // Check street food too just in case
    const sfLassi = await db.select().from(streetFoodItems).where(ilike(streetFoodItems.name, '%lassi%')).limit(5);
    const sfPizza = await db.select().from(streetFoodItems).where(ilike(streetFoodItems.name, '%pizza%')).limit(5);

    const out = {
        restaurantLassis: lassis.map(l => ({ name: l.name, category: l.category, image: l.imageUrl })),
        restaurantPizzas: pizzas.map(p => ({ name: p.name, category: p.category, image: p.imageUrl })),
        streetFoodLassis: sfLassi.map(l => ({ name: l.name, desc: l.description, image: l.imageUrl })),
        streetFoodPizzas: sfPizza.map(p => ({ name: p.name, desc: p.description, image: p.imageUrl }))
    };

    fs.writeFileSync('db_results.json', JSON.stringify(out, null, 2), 'utf-8');
    console.log("Done");
    process.exit(0);
}

run();
