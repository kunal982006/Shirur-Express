import { db } from "./server/db";
import { restaurantMenuItems } from "./shared/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

const menuData = [
  // Chinese Rice
  { name: "Chicken Fried Rice (Full)", basePrice: 130, aliases: [] },
  { name: "Chicken Fried Rice (Half)", basePrice: 80, aliases: [] },
  { name: "Chicken Schezwan Rice (Full)", basePrice: 130, aliases: [] },
  { name: "Chicken Schezwan Rice (Half)", basePrice: 80, aliases: [] },
  { name: "Chicken Triple Rice (Full)", basePrice: 180, aliases: [] },
  { name: "Chicken Triple Rice (Half)", basePrice: 120, aliases: [] },
  // Chinese Noodles
  { name: "Chicken Noodles (Full)", basePrice: 130, aliases: [] },
  { name: "Chicken Noodles (Half)", basePrice: 80, aliases: [] },
  { name: "Chicken Schezwan Noodles (Full)", basePrice: 130, aliases: [] },
  { name: "Chicken Schezwan Noodles (Half)", basePrice: 80, aliases: [] },
  { name: "Chicken Triple Noodles (Full)", basePrice: 180, aliases: [] },
  { name: "Chicken Triple Noodles (Half)", basePrice: 120, aliases: [] },
  // Chicken Starters
  { name: "Lollipop Oil Fry (Full)", basePrice: 150, aliases: [] },
  { name: "Lollipop Oil Fry (Half)", basePrice: 80, aliases: [] },
  { name: "Lollipop Masala Dry (Full)", basePrice: 180, aliases: [] },
  { name: "Lollipop Masala Dry (Half)", basePrice: 120, aliases: [] },
  { name: "Chicken Chilly Dry (Full)", basePrice: 170, aliases: [] },
  { name: "Chicken Chilly Dry (Half)", basePrice: 120, aliases: [] },
  { name: "Chicken Tandoori (Full)", basePrice: 400, aliases: [] },
  { name: "Chicken Tandoori (Half)", basePrice: 250, aliases: [] },
  { name: "Chicken Crispy", basePrice: 250, aliases: [] },
  { name: "Chicken Drumstick (Full)", basePrice: 280, aliases: [] },
  { name: "Chicken Drumstick (Half)", basePrice: 140, aliases: [] },
  { name: "Chicken Samosa", basePrice: 100, aliases: [] },
  { name: "Chicken Roll (Plate)", basePrice: 60, aliases: [] },
  { name: "Chicken Steak (Plate)", basePrice: 60, aliases: [] },
  { name: "Chicken Seekh", basePrice: 170, aliases: [] },
  { name: "Chicken 65", basePrice: 170, aliases: [] },
  { name: "Chicken Wings", basePrice: 160, aliases: [] },
  { name: "Chicken Kadi Gosht", basePrice: 120, aliases: [] },
  { name: "Chicken KFC", basePrice: 170, aliases: [] },
  // Veg
  { name: "Paneer Masala", basePrice: 130, aliases: [] },
  { name: "Shevbhaji", basePrice: 120, aliases: [] },
  { name: "Paneer Butter Masala", basePrice: 170, aliases: [] },
  { name: "Matar Paneer", basePrice: 160, aliases: [] },
  { name: "Palak Paneer", basePrice: 180, aliases: [] },
  { name: "Plain Palak", basePrice: 130, aliases: [] },
  { name: "Kaju Masala", basePrice: 180, aliases: [] },
  { name: "Paneer Kadhai", basePrice: 180, aliases: [] },
  { name: "Paneer Angara", basePrice: 190, aliases: [] },
  { name: "Paneer Korma", basePrice: 150, aliases: [] },
  { name: "Paneer Kolhapuri", basePrice: 160, aliases: [] },
  { name: "Paneer Chilly", basePrice: 160, aliases: [] },
  { name: "Dal Tadka", basePrice: 150, aliases: [] },
  { name: "Dal Fry", basePrice: 130, aliases: [] },
  { name: "Dal Makhani", basePrice: 170, aliases: [] },
  { name: "Dal Khichadi", basePrice: 160, aliases: [] },
  // Roti
  { name: "Chapati", basePrice: 15, aliases: [] },
  { name: "Butter Chapati", basePrice: 20, aliases: [] },
  { name: "Tandoor Roti", basePrice: 15, aliases: [] },
  { name: "Butter Roti", basePrice: 25, aliases: [] },
  { name: "Rumali Roti", basePrice: 35, aliases: [] },
  { name: "Plain Naan", basePrice: 25, aliases: ["Sadha Naan"] },
  { name: "Butter Naan", basePrice: 35, aliases: [] },
  { name: "Laccha Paratha", basePrice: 35, aliases: [] },
  // Cold Drinks
  { name: "Thums Up", basePrice: 20, aliases: [] },
  { name: "Sprite", basePrice: 20, aliases: [] },
  { name: "Sting", basePrice: 20, aliases: [] },
  { name: "Water Bottle", basePrice: 20, aliases: ["Pani Bottle"] },
  { name: "Jeera Soda", basePrice: 20, aliases: [] },
  { name: "Maaza", basePrice: 20, aliases: [] },
  // Chicken Main
  { name: "Chicken Masala", basePrice: 150, aliases: [] },
  { name: "Chicken Curry", basePrice: 150, aliases: [] },
  { name: "Chicken Fry", basePrice: 170, aliases: [] },
  { name: "Chicken Korma", basePrice: 200, aliases: [] },
  { name: "Chicken Shahi-Korma", basePrice: 220, aliases: [] },
  { name: "Chicken Angara", basePrice: 250, aliases: [] },
  { name: "Chicken Kolhapuri", basePrice: 180, aliases: [] },
  { name: "Chicken Kadhai", basePrice: 260, aliases: [] },
  { name: "Chicken Do Pyaza", basePrice: 230, aliases: [] },
  { name: "Butter Chicken", basePrice: 300, aliases: [] },
  { name: "Chicken Handi (Full)", basePrice: 480, aliases: [] },
  { name: "Chicken Handi (Half)", basePrice: 330, aliases: [] },
  { name: "Chicken Adraki", basePrice: 210, aliases: [] },
  { name: "Chicken Lasuni", basePrice: 230, aliases: [] },
  { name: "Chicken Patiyala", basePrice: 340, aliases: [] },
  { name: "Chicken Tiranga", basePrice: 650, aliases: [] },
  { name: "Chicken Roast", basePrice: 180, aliases: [] },
  { name: "Chicken Makhani", basePrice: 200, aliases: [] },
  { name: "Chicken Kheema Fry", basePrice: 180, aliases: [] },
  { name: "Chicken Pepper Masala", basePrice: 190, aliases: ["Chicken Paper Masala"] },
  { name: "Chicken Kaleji Petha Fry", basePrice: 140, aliases: [] },
  { name: "Gavran Chicken Kala Masala", basePrice: 180, aliases: [] },
  { name: "Gavran Chicken Fry", basePrice: 200, aliases: [] },
  { name: "Chicken Moghlai", basePrice: 250, aliases: [] },
  { name: "Chicken Hyderabadi", basePrice: 260, aliases: [] },
  { name: "Chicken Sukha", basePrice: 160, aliases: [] },
  { name: "Chicken Garlic Kheema", basePrice: 330, aliases: [] },
  { name: "Chicken Khajana", basePrice: 350, aliases: [] },
  { name: "Chicken Maharaja (Full)", basePrice: 650, aliases: ["Chicken Maharaja Full"] },
  { name: "Chicken Maharaja (Half)", basePrice: 450, aliases: ["Chicken Maharaja Half"] },
  { name: "Chicken Murg Mussallam (Full)", basePrice: 750, aliases: ["Chicken Murg Mussallam Full"] },
  { name: "Chicken Murg Mussallam (Half)", basePrice: 500, aliases: ["Chicken Murg Mussallam Half"] },
  { name: "Chicken Bhuna", basePrice: 210, aliases: [] },
  { name: "Chicken Pepper Dry", basePrice: 180, aliases: ["Chicken Paper Dry"] },
  { name: "Chicken Chilly Gravy", basePrice: 200, aliases: [] },
  { name: "Chicken Dal Gosht", basePrice: 200, aliases: [] },
  { name: "Chicken Achar Gosht", basePrice: 210, aliases: [] },
  { name: "Chicken Dalcha", basePrice: 350, aliases: [] },
  { name: "Chicken Curry (Half)", basePrice: 110, aliases: [] },
  { name: "Anda Masala", basePrice: 130, aliases: [] },
  { name: "Chicken Malwar Fry", basePrice: 190, aliases: [] },
  { name: "Kerala Chicken Curry", basePrice: 240, aliases: [] },
  { name: "Chicken Tutti Frutti", basePrice: 170, aliases: [] },
  // Mutton
  { name: "Mutton Dalcha", basePrice: 400, aliases: [] },
  { name: "Mutton Masala", basePrice: 240, aliases: [] },
  { name: "Mutton Curry", basePrice: 220, aliases: [] },
  { name: "Mutton Fry", basePrice: 280, aliases: [] },
  { name: "Mutton Korma", basePrice: 270, aliases: [] },
  { name: "Mutton Shahi-Korma", basePrice: 310, aliases: [] },
  { name: "Mutton Angara", basePrice: 330, aliases: [] },
  { name: "Mutton Kolhapuri", basePrice: 320, aliases: [] },
  { name: "Mutton Do Pyaza", basePrice: 320, aliases: [] },
  { name: "Mutton Kadhai", basePrice: 370, aliases: [] },
  { name: "Mutton Pepper Masala", basePrice: 280, aliases: ["Mutton Paper Masala"] },
  { name: "Mutton Makhani", basePrice: 290, aliases: [] },
  { name: "Mutton Hyderabadi", basePrice: 360, aliases: [] },
  { name: "Mutton Handi (Full)", basePrice: 700, aliases: ["Mutton Handi Full"] },
  { name: "Mutton Handi (Half)", basePrice: 500, aliases: ["Mutton Handi Half"] },
  { name: "Mutton Roast Pepper", basePrice: 280, aliases: ["Mutton Roast Paper"] },
  { name: "Mutton Roast", basePrice: 250, aliases: [] },
  { name: "Mutton Kheema Fry", basePrice: 220, aliases: [] },
  { name: "Mutton Kheema Masala", basePrice: 230, aliases: [] },
  { name: "Mutton Adraki", basePrice: 270, aliases: [] },
  { name: "Mutton Lahsuni", basePrice: 300, aliases: [] },
  { name: "Mutton Malwar Fry", basePrice: 230, aliases: [] },
  { name: "Mutton Achar Gosht", basePrice: 300, aliases: [] },
  { name: "Mutton Dal Gosht", basePrice: 300, aliases: [] },
  { name: "Vajadi Masala", basePrice: 150, aliases: [] },
  { name: "Vajadi Fry", basePrice: 150, aliases: [] },
  // Biryani
  { name: "Chicken Dum Biryani", basePrice: 150, aliases: [] },
  { name: "Mutton Dum Biryani", basePrice: 350, aliases: [] },
  { name: "Chicken Zamzam Pulav", basePrice: 220, aliases: [] },
  { name: "Chicken Kashmiri Pulav", basePrice: 200, aliases: [] },
  { name: "Jeera Rice (Full)", basePrice: 80, aliases: ["Jeera Rice Full"] },
  { name: "Jeera Rice (Half)", basePrice: 50, aliases: ["Jeera Rice Half"] },
  // Thali
  { name: "Chicken Thali", basePrice: 250, aliases: [] },
  { name: "Mutton Thali", basePrice: 350, aliases: [] },
  { name: "Tiranga Special Mutton Thali", basePrice: 500, aliases: [] },
];

async function main() {
  const providerId = "haz4toiex4r3sn6kn1za5c5f";

  console.log("Updating Hotel Tiranga Menu...");

  const existingItems = await db.query.restaurantMenuItems.findMany({
    where: eq(restaurantMenuItems.providerId, providerId)
  });

  for (const item of menuData) {
    const newPrice = (item.basePrice * 1.10).toFixed(2);
    
    // Find matching item
    const match = existingItems.find(ex => 
      ex.name.toLowerCase() === item.name.toLowerCase() || 
      item.aliases.some(alias => alias.toLowerCase() === ex.name.toLowerCase())
    );

    if (match) {
      await db.update(restaurantMenuItems)
        .set({ price: newPrice, name: item.name }) // standardize name
        .where(eq(restaurantMenuItems.id, match.id));
      console.log(`Updated [${item.name}]: ${match.price} -> ${newPrice}`);
    } else {
      await db.insert(restaurantMenuItems).values({
        id: createId(),
        providerId: providerId,
        name: item.name,
        price: newPrice,
        isVeg: item.name.includes("Paneer") || item.name.includes("Veg") || item.name.includes("Dal") || item.name.includes("Rice") || item.name.includes("Roti") || item.name.includes("Chapati"), // naive veg mapping
        isAvailable: true,
      });
      console.log(`Inserted [${item.name}]: ${newPrice}`);
    }
  }

  // Increase any remaining existing items by 10%
  console.log("Applying 10% increase to remaining items not explicitly matched...");
  for (const ex of existingItems) {
    const isMatched = menuData.find(item => 
      ex.name.toLowerCase() === item.name.toLowerCase() || 
      item.aliases.some(alias => alias.toLowerCase() === ex.name.toLowerCase())
    );
    if (!isMatched) {
      const oldPrice = parseFloat(ex.price as string);
      if (!isNaN(oldPrice)) {
        const newPrice = (oldPrice * 1.10).toFixed(2);
        await db.update(restaurantMenuItems)
          .set({ price: newPrice })
          .where(eq(restaurantMenuItems.id, ex.id));
        console.log(`Auto-increased [${ex.name}]: ${oldPrice} -> ${newPrice}`);
      }
    }
  }

  console.log("Update completed.");
  process.exit(0);
}

main().catch(console.error);
