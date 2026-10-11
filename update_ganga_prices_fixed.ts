import { db } from "./server/db";
import { restaurantMenuItems } from "./shared/schema";
import { eq } from "drizzle-orm";

const newMenuMap: Record<string, number> = {
  // Soups
  "व्हेज मनचोरीयन सूप (Veg Manchurian Soup)": 70,
  "व्हेज मंचाऊ सूप (Veg Manchow Soup)": 85,
  "टोमॅटो सूप (Tomato Soup)": 70,

  // Starters
  "पनीर चिली ड्राय (Paneer Chilli Dry)": 180,
  "मशरूम चिली ड्राय (Mushroom Chilli Dry)": 190,
  "सोयाबीन चिली ड्राय (Soyabean Chilli Dry)": 130,
  "व्हेज मंचुरीयन ड्राय (Veg Manchurian Dry)": 190,
  "व्हेज मंचुरीयन ग्रेव्ही (Veg Manchurian Gravy)": 190,
  "हराभरा कबाब (Hara Bhara Kebab)": 180,

  // Handi
  "पनीर हंडी फुल (Paneer Handi Full)": 550,
  "पनीर हंडी हाफ (Paneer Handi Half)": 350,
  "व्हेज हंडी फुल (Veg Handi Full)": 450,
  "व्हेज हंडी हाफ (Veg Handi Half)": 300,

  // Special Dish
  "पनीर मसाला (Paneer Masala)": 160,
  "पनीर लपेटा (Paneer Lapeta)": 285,
  "पनीर अंगारा (Paneer Angara)": 240,
  "व्हेज कस्तुरी (Veg Kasturi)": 240,
  "आख्खा मसूर (Akkha Masoor)": 150,
  "लसूणी पालक (Lasooni Palak)": 140,
  "बैंगन मसाला (Baingan Masala)": 130,
  "मशरूम मसाला (Mushroom Masala)": 170,
  "व्हेज मराठा (Veg Maratha)": 160,
  "शेवभाजी (Shev Bhaji)": 120,

  // Thali
  "महाराष्ट्रीयन स्पे. व्हेज थाळी (Maharashtrian Sp. Veg Thali)": 210,
  "स्पे. पिठलं भाकरी थाळी (Sp. Pithal Bhakari)": 180,

  // Roti
  "रोटी (Roti)": 15,
  "बटर रोटी (Butter Roti)": 20,
  "नान (Naan)": 30,
  "बटर नान (Butter Naan)": 35,
  "साधी चपाती (Sadhi Chapati)": 15,
  "बाजरीची भाकरी (Bajari Bhakari)": 25,

  // Rice
  "जिरा राईस फुल (Jeera Rice Full)": 90,
  "जिरा राईस हाफ (Jeera Rice Half)": 50,
  "स्टीम राईस फुल (Steam Rice Full)": 90,
  "स्टीम राईस हाफ (Steam Rice Half)": 50,
  "इंद्रायणी राईस फुल (Indrayani Rice Full)": 100,
  "इंद्रायणी राईस हाफ (Indrayani Rice Half)": 60,
  "दाल खिचडी (Dal Khichdi)": 150,
  "व्हेज पुलाव (Veg Pulao)": 160,
  "व्हेज बिर्याणी (Veg Biryani)": 180,
};

async function main() {
  const providerId = "s7f2xhvq5tdzcpoi89stmdjq";
  const items = await db.query.restaurantMenuItems.findMany({
    where: eq(restaurantMenuItems.providerId, providerId)
  });

  console.log(`Found ${items.length} items. Processing updates...`);

  for (const item of items) {
    let newPrice = 0;
    
    if (newMenuMap[item.name]) {
      const basePrice = newMenuMap[item.name];
      newPrice = Math.round(basePrice * 1.10); // Increase by 10%
      
      const newPriceStr = newPrice.toFixed(2);
      
      if (item.price !== newPriceStr) {
        await db.update(restaurantMenuItems)
          .set({ price: newPriceStr })
          .where(eq(restaurantMenuItems.id, item.id));
        console.log(`Updated [${item.name}]: ${item.price} -> ${newPriceStr}`);
      }
    }
  }

  console.log("Update complete!");
  process.exit(0);
}

main().catch(console.error);
