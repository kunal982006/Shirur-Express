import 'dotenv/config';
import { db } from '../server/db';
import { groceryProducts } from '@shared/schema';

async function clearGroceryImages() {
  console.log("🧹 Clearing all grocery product images...");

  try {
    // Update all grocery products, setting imageUrl to null
    console.log("Starting database update...");
    const result = await db.update(groceryProducts)
      .set({ imageUrl: null })
      .returning({ updatedId: groceryProducts.id });

    console.log(`✅ Successfully cleared images for ${result.length} grocery products.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing grocery images:", error);
    process.exit(1);
  }
}

clearGroceryImages();
