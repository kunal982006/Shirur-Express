import 'dotenv/config';
import { db } from "./db";
import { users, serviceProviders, serviceCategories, restaurantMenuItems } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";
import { v2 as cloudinary } from 'cloudinary';

// ===== CLOUDINARY INIT =====
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
});

// ===== 3 Freepik API Keys with rotation =====
const API_KEYS = [
  "FPSXb268d27481311606044f86e0151332e8",
  "FPSX9c158ba66cc15391497140bb50d1ad83",
  "FPSXb0d5d3d0b2ea09ed7841d9df7c711e72",
];

let currentKeyIndex = 0;
let exhaustedKeys = new Set<number>();

function getNextKey(): string | null {
  if (exhaustedKeys.size >= API_KEYS.length) return null;
  while (exhaustedKeys.has(currentKeyIndex)) {
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  }
  return API_KEYS[currentKeyIndex];
}

function markKeyExhausted(index: number) {
  exhaustedKeys.add(index);
  console.log(`  ⚠️ API Key #${index + 1} rate-limited.`);
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
}

async function searchFreepik(query: string): Promise<string | null> {
  let attempts = 0;
  while (attempts < API_KEYS.length + 1) {
    const apiKey = getNextKey();
    if (!apiKey) {
      console.log("  ⏳ All 3 API keys rate-limited. Waiting 60 seconds...");
      await new Promise(r => setTimeout(r, 60000));
      exhaustedKeys.clear();
      continue;
    }
    const keyIndex = currentKeyIndex;
    const url = `https://api.freepik.com/v1/resources?locale=en-US&term=${encodeURIComponent(query)}&page=1&limit=1&order=relevance`;
    try {
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en-US',
          'Accept': 'application/json',
          'x-freepik-api-key': apiKey
        }
      });
      if (res.status === 429) {
        markKeyExhausted(keyIndex);
        attempts++;
        continue;
      }
      if (!res.ok) return null;
      const data = await res.json() as any;
      if (data.data && data.data.length > 0) {
        const item = data.data[0];
        return item.image?.source?.url || item.image?.source?.medium?.url || item.image?.source?.small?.url || null;
      }
      return null;
    } catch (e) {
      return null;
    }
  }
  return null;
}

function generateSearchQuery(name: string, category: string): string {
    const n = name.toLowerCase();
    if (n.includes("soup")) return "veg clear soup indian bowl";
    if (n.includes("papad")) return "masala roasted papad indian starter";
    if (n.includes("manchurian")) return "veg manchurian dry starter indo chinese";
    if (n.includes("chilli")) return "paneer chilli dry indo chinese";
    if (n.includes("kebab")) return "hara bhara kebab pan fried veg";
    if (n.includes("kaju")) return "kaju curry masala indian veg white gravy";
    if (n.includes("paneer")) {
        if (n.includes("bhurji")) return "paneer bhurji scrambled spicy";
        if (n.includes("palak")) return "palak paneer spinach indian curry";
        return "paneer butter masala indian veg curry";
    }
    if (n.includes(" दाल ") || n.includes("dal")) return "dal fry tadka indian bowl";
    if (n.includes("rice") || n.includes("pulao") || n.includes("biryani")) return "veg biryani jeera rice pulao indian";
    if (n.includes("roti") || n.includes("naan") || n.includes("kulcha") || n.includes("paratha") || n.includes("bhakari") || n.includes("chapati")) return "indian breads naan roti paratha plate";
    if (n.includes("thali") || n.includes("थाळी")) return "indian pure veg thali maharashtrian";
    if (n.includes("hundi") || category.includes("Handi")) return "veg handi indian pot curry";
    if (category.includes("Indian Veg")) return "indian dry veg sabzi thali side";
    // Fallback
    return "delicious indian veg pure food";
}

const menuItems = [
    // Soup
    { name: "टोमॅटो सूप (Tomato Soup)", price: "70", category: "Soup", cuisine: "Indian", isVeg: true },
    { name: "व्हेज मंचाऊ सूप (Veg Manchow Soup)", price: "80", category: "Soup", cuisine: "Indian", isVeg: true },
    { name: "व्हेज मनचोरीयन सूप (Veg Manchurian Soup)", price: "85", category: "Soup", cuisine: "Indian", isVeg: true },

    // Starter
    { name: "रोस्टेड पापड (Roasted Papad)", price: "20", category: "Starter", cuisine: "Indian", isVeg: true },
    { name: "फ्राय पापड (Fry Papad)", price: "25", category: "Starter", cuisine: "Indian", isVeg: true },
    { name: "मसाला पापड (Masala Papad)", price: "30", category: "Starter", cuisine: "Indian", isVeg: true },
    { name: "हराभरा कबाब (Hara Bhara Kebab)", price: "180", category: "Starter", cuisine: "Indian", isVeg: true },
    { name: "पनीर मंचुरीयन (Paneer Manchurian)", price: "190", category: "Starter", cuisine: "Indian", isVeg: true },
    { name: "पनीर चिली ड्राय (Paneer Chilli Dry)", price: "180", category: "Starter", cuisine: "Indian", isVeg: true },
    { name: "पनीर चिली ग्रेव्ही (Paneer Chilli Gravy)", price: "200", category: "Starter", cuisine: "Indian", isVeg: true },
    { name: "सोयाबीन चिली ड्राय (Soyabean Chilli Dry)", price: "130", category: "Starter", cuisine: "Indian", isVeg: true },
    { name: "सोयाबीन चिली ग्रेव्ही (Soyabean Chilli Gravy)", price: "170", category: "Starter", cuisine: "Indian", isVeg: true },
    { name: "मशरूम चिली ड्राय (Mushroom Chilli Dry)", price: "190", category: "Starter", cuisine: "Indian", isVeg: true },
    { name: "मशरूम चिली ग्रेव्ही (Mushroom Chilli Gravy)", price: "200", category: "Starter", cuisine: "Indian", isVeg: true },
    { name: "व्हेज मंचुरीयन ड्राय (Veg Manchurian Dry)", price: "160", category: "Starter", cuisine: "Indian", isVeg: true },
    { name: "व्हेज मंचुरीयन ग्रेव्ही (Veg Manchurian Gravy)", price: "180", category: "Starter", cuisine: "Indian", isVeg: true },

    // Indian Veg
    { name: "व्हेज कोल्हापुरी (Veg Kolhapuri)", price: "150", category: "Indian Veg", cuisine: "Indian", isVeg: true },
    { name: "व्हेज मराठा (Veg Maratha)", price: "160", category: "Indian Veg", cuisine: "Indian", isVeg: true },
    { name: "मिक्स व्हेज (Mix Veg)", price: "140", category: "Indian Veg", cuisine: "Indian", isVeg: true },
    { name: "ग्रीन पिस मसाला (Green Peas Masala)", price: "130", category: "Indian Veg", cuisine: "Indian", isVeg: true },
    { name: "मशरूम मसाला (Mushroom Masala)", price: "170", category: "Indian Veg", cuisine: "Indian", isVeg: true },
    { name: "मटकी फ्राय (Matki Fry)", price: "130", category: "Indian Veg", cuisine: "Indian", isVeg: true },
    { name: "मटकी मसाला (Matki Masala)", price: "140", category: "Indian Veg", cuisine: "Indian", isVeg: true },
    { name: "आलू मटर (Aloo Matar)", price: "130", category: "Indian Veg", cuisine: "Indian", isVeg: true },
    { name: "बैंगन मसाला (Baingan Masala)", price: "120", category: "Indian Veg", cuisine: "Indian", isVeg: true },
    { name: "सोयाबीन मसाला (Soyabean Masala)", price: "130", category: "Indian Veg", cuisine: "Indian", isVeg: true },
    { name: "आलू पालक (Aloo Palak)", price: "130", category: "Indian Veg", cuisine: "Indian", isVeg: true },
    { name: "प्लेन पालक (Plain Palak)", price: "130", category: "Indian Veg", cuisine: "Indian", isVeg: true },
    { name: "लसूणी पालक (Lasooni Palak)", price: "140", category: "Indian Veg", cuisine: "Indian", isVeg: true },
    { name: "शेवगा मसाला (Shevga Masala)", price: "150", category: "Indian Veg", cuisine: "Indian", isVeg: true },
    { name: "शेवगा करी (Shevga Curry)", price: "150", category: "Indian Veg", cuisine: "Indian", isVeg: true },
    { name: "शेवभाजी (Shev Bhaji)", price: "120", category: "Indian Veg", cuisine: "Indian", isVeg: true },
    { name: "शेव टमाटर (Shev Tamatar)", price: "130", category: "Indian Veg", cuisine: "Indian", isVeg: true },
    { name: "भेंडी फ्राय (Bhendi Fry)", price: "130", category: "Indian Veg", cuisine: "Indian", isVeg: true },
    { name: "आलू जीरा (Aloo Jeera)", price: "140", category: "Indian Veg", cuisine: "Indian", isVeg: true },

    // Paneer Special
    { name: "पनीर लपेटा (Paneer Lapeta)", price: "285", category: "Paneer Special", cuisine: "Indian", isVeg: true },
    { name: "पनीर भुर्जी (Paneer Bhurji)", price: "200", category: "Paneer Special", cuisine: "Indian", isVeg: true },
    { name: "पनीर मसाला (Paneer Masala)", price: "180", category: "Paneer Special", cuisine: "Indian", isVeg: true },
    { name: "पालक पनीर (Palak Paneer)", price: "150", category: "Paneer Special", cuisine: "Indian", isVeg: true },
    { name: "पनीर टिका मसाला (Paneer Tikka Masala)", price: "160", category: "Paneer Special", cuisine: "Indian", isVeg: true },
    { name: "बटर पनीर मसाला (Butter Paneer Masala)", price: "180", category: "Paneer Special", cuisine: "Indian", isVeg: true },
    { name: "पनीर पसंदा (Paneer Pasanda)", price: "230", category: "Paneer Special", cuisine: "Indian", isVeg: true },
    { name: "पनीर खडा मसाला (Paneer Khada Masala)", price: "240", category: "Paneer Special", cuisine: "Indian", isVeg: true },
    { name: "पनीर कोफ़्ता (Paneer Kofta)", price: "230", category: "Paneer Special", cuisine: "Indian", isVeg: true },
    { name: "पनीर अंगारा (Paneer Angara)", price: "240", category: "Paneer Special", cuisine: "Indian", isVeg: true },
    { name: "पनीर कढाई (Paneer Kadhai)", price: "240", category: "Paneer Special", cuisine: "Indian", isVeg: true },

    // Handi Special
    { name: "व्हेज हंडी हाफ (Veg Handi Half)", price: "300", category: "Handi Special", cuisine: "Indian", isVeg: true },
    { name: "व्हेज हंडी फुल (Veg Handi Full)", price: "450", category: "Handi Special", cuisine: "Indian", isVeg: true },
    { name: "शेवगा हंडी हाफ (Shevga Handi Half)", price: "300", category: "Handi Special", cuisine: "Indian", isVeg: true },
    { name: "शेवगा हंडी फुल (Shevga Handi Full)", price: "500", category: "Handi Special", cuisine: "Indian", isVeg: true },
    { name: "पनीर हंडी हाफ (Paneer Handi Half)", price: "350", category: "Handi Special", cuisine: "Indian", isVeg: true },
    { name: "पनीर हंडी फुल (Paneer Handi Full)", price: "550", category: "Handi Special", cuisine: "Indian", isVeg: true },
    { name: "काजू हंडी हाफ (Kaju Handi Half)", price: "350", category: "Handi Special", cuisine: "Indian", isVeg: true },
    { name: "काजू हंडी फुल (Kaju Handi Full)", price: "600", category: "Handi Special", cuisine: "Indian", isVeg: true },
    { name: "शेवगापुरी हाफ (Shevgapuri Half)", price: "250", category: "Handi Special", cuisine: "Indian", isVeg: true },
    { name: "शेवगापुरी फुल (Shevgapuri Full)", price: "400", category: "Handi Special", cuisine: "Indian", isVeg: true },
    { name: "व्हेज मखमली हाफ (Veg Makhmali Half)", price: "350", category: "Handi Special", cuisine: "Indian", isVeg: true },
    { name: "व्हेज मखमली फुल (Veg Makhmali Full)", price: "550", category: "Handi Special", cuisine: "Indian", isVeg: true },
    { name: "पनीर मखमली हाफ (Paneer Makhmali Half)", price: "450", category: "Handi Special", cuisine: "Indian", isVeg: true },
    { name: "पनीर मखमली फुल (Paneer Makhmali Full)", price: "600", category: "Handi Special", cuisine: "Indian", isVeg: true },

    // Ganga Special Veg
    { name: "गंगा ड्रॅगन स्पे. व्हेज (Ganga Dragon Sp. Veg)", price: "250", category: "Ganga Special", cuisine: "Indian", isVeg: true },
    { name: "गंगा ड्रॅगन स्पे. पनीर (Ganga Dragon Sp. Paneer)", price: "250", category: "Ganga Special", cuisine: "Indian", isVeg: true },
    { name: "गंगा ड्रॅगन स्पे. काजू (Ganga Dragon Sp. Kaju)", price: "250", category: "Ganga Special", cuisine: "Indian", isVeg: true },

    // Rice
    { name: "साधा राईस हाफ (Sadha Rice Half)", price: "50", category: "Rice", cuisine: "Indian", isVeg: true },
    { name: "साधा राईस फुल (Sadha Rice Full)", price: "80", category: "Rice", cuisine: "Indian", isVeg: true },
    { name: "जिरा राईस हाफ (Jeera Rice Half)", price: "60", category: "Rice", cuisine: "Indian", isVeg: true },
    { name: "जिरा राईस फुल (Jeera Rice Full)", price: "90", category: "Rice", cuisine: "Indian", isVeg: true },
    { name: "स्टीम राईस हाफ (Steam Rice Half)", price: "50", category: "Rice", cuisine: "Indian", isVeg: true },
    { name: "स्टीम राईस फुल (Steam Rice Full)", price: "80", category: "Rice", cuisine: "Indian", isVeg: true },
    { name: "व्हेज पुलाव (Veg Pulao)", price: "160", category: "Rice", cuisine: "Indian", isVeg: true },
    { name: "व्हेज बिर्याणी (Veg Biryani)", price: "180", category: "Rice", cuisine: "Indian", isVeg: true },
    { name: "इंद्रायणी राईस हाफ (Indrayani Rice Half)", price: "60", category: "Rice", cuisine: "Indian", isVeg: true },
    { name: "इंद्रायणी राईस फुल (Indrayani Rice Full)", price: "100", category: "Rice", cuisine: "Indian", isVeg: true },
    { name: "मसाला राईस (Masala Rice)", price: "150", category: "Rice", cuisine: "Indian", isVeg: true },
    { name: "कर्ड राईस (Curd Rice)", price: "160", category: "Rice", cuisine: "Indian", isVeg: true },
    { name: "दाल खिचडी (Dal Khichdi)", price: "150", category: "Rice", cuisine: "Indian", isVeg: true },
    { name: "बटर दाल खिचडी (Butter Dal Khichdi)", price: "160", category: "Rice", cuisine: "Indian", isVeg: true },

    // Breads
    { name: "रोटी (Roti)", price: "15", category: "Breads", cuisine: "Indian", isVeg: true },
    { name: "बटर रोटी (Butter Roti)", price: "20", category: "Breads", cuisine: "Indian", isVeg: true },
    { name: "नान (Naan)", price: "30", category: "Breads", cuisine: "Indian", isVeg: true },
    { name: "बटर नान (Butter Naan)", price: "35", category: "Breads", cuisine: "Indian", isVeg: true },
    { name: "बटर कुलचा (Butter Kulcha)", price: "40", category: "Breads", cuisine: "Indian", isVeg: true },
    { name: "साधा परोठा (Sadha Paratha)", price: "30", category: "Breads", cuisine: "Indian", isVeg: true },
    { name: "बटर परोठा (Butter Paratha)", price: "35", category: "Breads", cuisine: "Indian", isVeg: true },
    { name: "आलू परोठा (Aloo Paratha)", price: "60", category: "Breads", cuisine: "Indian", isVeg: true },
    { name: "बाजरीची भाकरी (Bajari Bhakari)", price: "25", category: "Breads", cuisine: "Indian", isVeg: true },
    { name: "बटर चपाती (Butter Chapati)", price: "15", category: "Breads", cuisine: "Indian", isVeg: true },
    { name: "साधी चपाती (Sadhi Chapati)", price: "20", category: "Breads", cuisine: "Indian", isVeg: true },

    // Special Veg
    { name: "व्हेज तिरंगा (Veg Tiranga)", price: "300", category: "Special Veg", cuisine: "Indian", isVeg: true },
    { name: "व्हेज पटीयाला (Veg Patiala)", price: "220", category: "Special Veg", cuisine: "Indian", isVeg: true },
    { name: "व्हेज भुना (Veg Bhuna)", price: "220", category: "Special Veg", cuisine: "Indian", isVeg: true },
    { name: "व्हेज अंगारा (Veg Angara)", price: "220", category: "Special Veg", cuisine: "Indian", isVeg: true },
    { name: "व्हेज कस्तुरी (Veg Kasturi)", price: "220", category: "Special Veg", cuisine: "Indian", isVeg: true },
    { name: "व्हेज कढाई (Veg Kadhai)", price: "220", category: "Special Veg", cuisine: "Indian", isVeg: true },
    { name: "शाही पनीर (स्वीट) (Shahi Paneer - Sweet)", price: "250", category: "Special Veg", cuisine: "Indian", isVeg: true },
    { name: "मलाई कोफ्ता (स्वीट) (Malai Kofta - Sweet)", price: "250", category: "Special Veg", cuisine: "Indian", isVeg: true },

    // Kaju Special
    { name: "काजू करी (Kaju Curry)", price: "160", category: "Kaju Special", cuisine: "Indian", isVeg: true },
    { name: "काजू मसाला (Kaju Masala)", price: "160", category: "Kaju Special", cuisine: "Indian", isVeg: true },
    { name: "काजू पनीर मसाला (Kaju Paneer Masala)", price: "165", category: "Kaju Special", cuisine: "Indian", isVeg: true },
    { name: "काजू कढाई (Kaju Kadhai)", price: "220", category: "Kaju Special", cuisine: "Indian", isVeg: true },

    // Dal Special
    { name: "दाल तडका (Dal Tadka)", price: "130", category: "Dal Special", cuisine: "Indian", isVeg: true },
    { name: "दाल फ्राय (Dal Fry)", price: "110", category: "Dal Special", cuisine: "Indian", isVeg: true },
    { name: "कोल्हापुरी दाल तडका (Kolhapuri Dal Tadka)", price: "140", category: "Dal Special", cuisine: "Indian", isVeg: true },
    { name: "बटर दाल फ्राय (Butter Dal Fry)", price: "120", category: "Dal Special", cuisine: "Indian", isVeg: true },
    { name: "लसूणी दाल तडका (Lasooni Dal Tadka)", price: "120", category: "Dal Special", cuisine: "Indian", isVeg: true },

    // Thalis
    { name: "महाराष्ट्रीयन स्पे. व्हेज थाळी (Maharashtrian Sp. Veg Thali)", price: "210", category: "Thali", cuisine: "Maharashtrian", isVeg: true },
    { name: "स्पे. पिठलं भाकरी थाळी (Sp. Pithal Bhakari)", price: "180", category: "Thali", cuisine: "Maharashtrian", isVeg: true },
    { name: "व्हेज थाळी (Veg Thali)", price: "150", category: "Thali", cuisine: "Maharashtrian", isVeg: true },
];

async function runGangaPipeline() {
    console.log("== Starting Ganga Grand Pipeline ==");
    
    // 1. Category
    const categories = await db.query.serviceCategories.findMany();
    const restaurantCategory = categories.find(c => c.slug.includes("restaurant") || c.slug.includes("food"));
    if (!restaurantCategory) throw new Error("No restaurant category found!");

    let userId;
    const user = await db.query.users.findFirst({ where: eq(users.username, "ganga_grand") });
    if (user) {
        userId = user.id;
    } else {
        console.log("Creating user ganga_grand...");
        const newUser = await db.insert(users).values({
            username: "ganga_grand", email: "ganga@shirur.com", password: "ganga@password", role: "provider"
        }).returning();
        userId = newUser[0].id;
    }

    let providerId;
    const provider = await db.query.serviceProviders.findFirst({ where: eq(serviceProviders.userId, userId) });
    if (provider) {
        providerId = provider.id;
    } else {
        console.log("Creating provider Ganga Grand Restaurant...");
        const newProvider = await db.insert(serviceProviders).values({
            userId, categoryId: restaurantCategory.id, businessName: "Ganga Grand Restaurant", address: "Shivaji Chowk, Shirur", isAvailable: true, isVerified: true, profileImageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600"
        }).returning();
        providerId = newProvider[0].id;
    }

    // 2. Insert Menu Items
    const existingCount = await db.query.restaurantMenuItems.findMany({ where: eq(restaurantMenuItems.providerId, providerId) });
    if (existingCount.length === 0) {
        console.log(`Inserting ${menuItems.length} menu items...`);
        const itemsToInsert = menuItems.map(item => ({ providerId, ...item }));
        await db.insert(restaurantMenuItems).values(itemsToInsert);
    } else {
        console.log("Menu items already exist. Proceeding to images.");
    }

    // 3. Process Images
    const items = await db.query.restaurantMenuItems.findMany({ where: eq(restaurantMenuItems.providerId, providerId) });
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.imageUrl && item.imageUrl.includes("cloudinary.com")) continue;

        const query = generateSearchQuery(item.name, item.category || '');
        console.log(`[${i+1}/${items.length}] "${item.name}" -> query: "${query}"`);

        const imageUrl = await searchFreepik(query);
        if (imageUrl) {
            try {
                const res = await cloudinary.uploader.upload(imageUrl, {
                    folder: 'shirur-express/ganga-menu', transformation: [{ width: 800, height: 800, crop: 'limit' }]
                });
                await db.update(restaurantMenuItems).set({ imageUrl: res.secure_url }).where(eq(restaurantMenuItems.id, item.id));
                console.log(`  ✅ Uploaded: ${res.secure_url}`);
            } catch (err) {
                console.error("  ❌ Cloudinary fail");
            }
        } else {
            console.log("  ❌ Freepik not found");
        }
        await new Promise(r => setTimeout(r, 1000));
    }
    console.log("🎉 DONE GANGA PIPELINE");
    process.exit(0);
}

runGangaPipeline().catch(console.error);
