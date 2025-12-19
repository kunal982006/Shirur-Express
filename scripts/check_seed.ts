import "dotenv/config";
import { storage } from "../server/storage";
import * as fs from 'fs';

async function check() {
    const log = (msg: string) => fs.appendFileSync('seed_log.txt', msg + '\n');
    try {
        log("Starting check...");
        const categories = await storage.getServiceCategories();
        const restaurantCategory = categories.find(c => c.slug === "restaurants");
        if (restaurantCategory) {
            log("Restaurant category found.");

            const providers = await storage.getServiceProviders("restaurants");
            providers.forEach(p => log(`Found provider: ${p.businessName} (${p.id})`));

            const target = providers.find(p => p.businessName === "Pizza Burger Express Shirur");
            if (target) {
                log(`Selected target: ${target.id}`);
                const items = await storage.getRestaurantMenuItems(target.id);

                log(`Found ${items.length} menu items.`);
                items.forEach(i => log(`- ${i.name}: ${i.price}`));
            } else {
                log("Provider 'Pizza Burger Express Shirur' NOT found.");
            }
        } else {
            log("Restaurant category NOT found.");
        }
        process.exit(0);
    } catch (e) {
        log("Error: " + e);
        process.exit(1);
    }
}
check();
