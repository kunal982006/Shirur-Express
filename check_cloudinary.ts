import { db } from "./server/db";
import { restaurantMenuItems } from "@shared/schema";
import { isNotNull, notIlike, and } from "drizzle-orm";

async function checkCloudinary() {
  const items = await db.query.restaurantMenuItems.findMany({
    where: and(
      isNotNull(restaurantMenuItems.imageUrl),
      notIlike(restaurantMenuItems.imageUrl, "%res.cloudinary.com%")
    )
  });
  
  console.log(`Total non-Cloudinary images: ${items.length}`);
  if (items.length > 0) {
      console.log("Sample URLs:");
      items.slice(0, 5).forEach(i => console.log(i.imageUrl));
  }
}

checkCloudinary().catch(console.error).then(() => process.exit(0));
