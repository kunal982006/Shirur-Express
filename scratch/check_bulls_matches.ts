import { config } from "dotenv";
import fs from "fs";
import { updatedBullsMenu } from "./bulls_updated_menu_data";
config();

const currentDb: Array<{ id: string; name: string; category: string; price: string; is_veg: boolean; image_url: string | null; description: string | null }> = 
  JSON.parse(fs.readFileSync("scratch/bulls_current_db_utf8.json", "utf8"));

const dbMapByName = new Map<string, typeof currentDb[0]>();
for (const item of currentDb) {
  dbMapByName.set(item.name.toLowerCase().trim(), item);
}

console.log("Checking match rate between new card items and current DB items:");
let matched = 0;
let unmatched = 0;

for (const item of updatedBullsMenu) {
  const key = item.name.toLowerCase().trim();
  const found = dbMapByName.get(key);
  if (found) {
    matched++;
  } else {
    // Try relaxed search
    const cleanName = key.replace(/[^a-z0-9]/g, "");
    const approx = currentDb.find(d => d.name.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanName);
    if (approx) {
      console.log(`  Approx matched: "${item.name}" -> DB: "${approx.name}" (image: ${!!approx.image_url})`);
      matched++;
    } else {
      console.log(`  UNMATCHED: "${item.name}" (Cat: ${item.category})`);
      unmatched++;
    }
  }
}

console.log(`\nResult: Matched=${matched}, Unmatched=${unmatched}, Total new items=${updatedBullsMenu.length}`);
