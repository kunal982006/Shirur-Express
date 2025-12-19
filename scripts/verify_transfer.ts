
import "dotenv/config";
import { storage } from "../server/storage";

async function verify() {
    const existingProviderId = "rjawf1f4xpr8a7hht2v68mrt";
    console.log("Verifying menu for provider: " + existingProviderId);
    const items = await storage.getRestaurantMenuItems(existingProviderId);
    console.log(`Count: ${items.length}`);
    items.slice(0, 5).forEach(i => console.log(`- ${i.name}`));
    process.exit(0);
}

verify();
