/**
 * Fetch unique food images from Pexels and update the database.
 * 
 * Usage: PEXELS_API_KEY=xxx npx tsx scripts/fetch_pexels_images.ts
 * 
 * Get a free API key at: https://www.pexels.com/api/
 */
import 'dotenv/config';
import { db } from '../server/db';
import { streetFoodItems, restaurantMenuItems } from '../shared/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';
const IMAGE_DIR = path.resolve('client/public/images/menu-items');

if (!PEXELS_API_KEY) {
    console.error('ERROR: Set PEXELS_API_KEY in your .env file');
    console.error('Get a free key at: https://www.pexels.com/api/');
    process.exit(1);
}

// Map each unique food concept to a Pexels search query
// We want UNIQUE images per food type
const FOOD_IMAGE_MAP: Record<string, string> = {
    // Momos
    'chicken_fried_momos': 'fried dumplings crispy',
    'chicken_steam_momos': 'steamed dumplings bamboo basket',
    'veg_fried_momos': 'vegetable fried dumplings',
    'veg_steam_momos': 'steamed dim sum dumplings',
    'paneer_momos': 'paneer stuffed dumplings indian',
    'chicken_cheese_momos': 'cheese dumplings golden',
    'chicken_peri_peri_momos': 'spicy dumplings chili sauce',
    'chicken_tandur_momos': 'tandoori momos plate',
    'chicken_achari_momos': 'pickled spicy dumplings',

    // Chocolate bowls
    'dark_chocolate_bowl': 'dark chocolate dessert bowl',
    'oreo_chocolate_bowl': 'oreo chocolate dessert bowl',
    'kitkat_chocolate_bowl': 'chocolate wafer dessert bowl',
    'strawberry_chocolate_bowl': 'strawberry chocolate dessert',
    'triple_chocolate_bowl': 'triple chocolate mousse bowl',
    'dryfruit_chocolate_bowl': 'dry fruit chocolate dessert',

    // Chinese
    'chinese_bhel': 'chinese bhel crunchy snack indian',
    'manchurian': 'veg manchurian gravy indian chinese',
    'manchau_soup': 'manchow soup crispy noodles',
    'noodles': 'hakka noodles Indo-Chinese',

    // Street food staples
    'pav_bhaji': 'pav bhaji indian street food',
    'vada_pav': 'vada pav indian burger',
    'dabeli': 'dabeli indian street food',
    'chicken_dabeli': 'chicken stuffed bun indian',
    'cheese_dabeli': 'cheese dabeli spicy indian',
    'dosa': 'masala dosa south indian',
    'paper_dosa': 'paper dosa crispy south indian',

    // Non-veg snacks
    'chicken_burger': 'chicken burger sesame bun',
    'chicken_pizza': 'chicken pizza pepperoni cheese',
    'chicken_kurkure': 'crispy chicken fingers strips',

    // Pav
    'butter_pav': 'butter pav bread indian',

    // === RESTAURANT CATEGORIES ===
    // Burgers
    'burger': 'gourmet burger cheese lettuce',
    'grilled_burger': 'grilled chicken burger premium',
    'veg_burger': 'vegetable burger patty',

    // Pizza
    'pizza': 'pizza cheese pepperoni',
    'veg_pizza': 'vegetable pizza colorful toppings',
    'paneer_pizza': 'paneer tikka pizza indian',
    'chicken_pizza_restaurant': 'bbq chicken pizza',

    // Fried chicken
    'fried_chicken': 'fried chicken crispy golden',
    'chicken_wings': 'crispy chicken wings spicy',
    'chicken_drumstick': 'fried chicken drumstick',
    'chicken_strips': 'chicken tender strips',
    'chicken_popcorn': 'chicken popcorn bites crispy',

    // Wraps & rolls
    'wrap': 'chicken wrap tortilla',
    'veg_wrap': 'vegetable wrap fresh',
    'paneer_wrap': 'paneer tikka wrap indian',

    // Sandwich
    'sandwich': 'grilled sandwich cheese',
    'paneer_sandwich': 'paneer grilled sandwich',
    'chocolate_sandwich': 'chocolate grilled sandwich nutella',

    // Fries
    'fries': 'french fries golden crispy',
    'peri_peri_fries': 'peri peri seasoned fries',
    'cheese_fries': 'loaded cheese fries',

    // Coffee & beverages
    'cold_coffee': 'cold coffee iced mocha',
    'thick_cold_coffee': 'thick cold coffee frappe',
    'mocktail': 'blue lagoon mocktail',
    'mojito': 'virgin mojito fresh mint',
    'milkshake': 'chocolate milkshake tall glass',
    'fruit_juice': 'fresh fruit juice glass',

    // Indian main course
    'chicken_curry': 'chicken curry indian gravy',
    'mutton_curry': 'mutton curry rich gravy',
    'paneer_dish': 'paneer butter masala',
    'veg_curry': 'mixed vegetable curry indian',
    'egg_curry': 'egg curry indian masala',
    'biryani': 'chicken biryani rice basmati',
    'kheema': 'keema paratha mince meat',
    'thali': 'indian thali complete meal',
    'paratha': 'stuffed paratha butter',
    'butter_chicken': 'butter chicken naan',
    'dal': 'dal tadka yellow lentils',

    // Chinese restaurant
    'fried_rice': 'fried rice chinese wok',
    'hakka_noodles': 'hakka noodles indo chinese',
    'manchurian_dry': 'manchurian dry indo chinese',

    // Desserts
    'dessert': 'gulab jamun indian sweet',
    'cake_slice': 'chocolate cake slice premium',
    'pastry': 'pastry cream dessert',

    // Salad & soup
    'salad': 'fresh green salad bowl',
    'soup': 'hot soup bowl steaming',

    // Rice
    'rice_dish': 'jeera rice basmati',
    'pulao': 'vegetable pulao rice',

    // Pasta
    'pasta': 'pasta creamy sauce',

    // Bucket/combo
    'bucket_combo': 'fried chicken bucket family',

    // Samosa & snacks
    'samosa': 'samosa indian snack crispy',
    'pani_puri': 'pani puri golgappa indian',
    'chole_bhature': 'chole bhature north indian',
    'paneer_tikka': 'paneer tikka grilled skewer',
};

function downloadImage(url: string, filepath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
            // Follow redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                const redirectUrl = response.headers.location;
                if (redirectUrl) {
                    downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
                    return;
                }
            }
            response.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
}

async function searchPexels(query: string): Promise<string | null> {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=square`;

    try {
        const res = await fetch(url, {
            headers: { 'Authorization': PEXELS_API_KEY }
        });
        const data = await res.json() as any;

        if (data.photos && data.photos.length > 0) {
            // Use medium size (350px) - perfect for cards
            return data.photos[0].src.medium;
        }
    } catch (e) {
        console.error(`Pexels search failed for "${query}":`, e);
    }
    return null;
}

function getImageKey(name: string, category: string): string {
    const n = name.toLowerCase();
    const c = (category || '').toLowerCase();

    // --- Street food matching (specific first) ---
    if (n.includes('peri peri') && n.includes('fried') && n.includes('momo')) return 'chicken_peri_peri_momos';
    if (n.includes('peri peri') && n.includes('steam') && n.includes('momo')) return 'chicken_peri_peri_momos';
    if (n.includes('achari') && n.includes('momo')) return 'chicken_achari_momos';
    if (n.includes('acharya') && n.includes('momo')) return 'chicken_achari_momos';
    if (n.includes('tandur') && n.includes('momo')) return 'chicken_tandur_momos';
    if (n.includes('cheese') && n.includes('fried') && n.includes('momo')) return 'chicken_cheese_momos';
    if (n.includes('cheese') && n.includes('steam') && n.includes('momo')) return 'chicken_cheese_momos';
    if (n.includes('chicken') && n.includes('fried') && n.includes('momo')) return 'chicken_fried_momos';
    if (n.includes('chicken') && n.includes('steam') && n.includes('momo')) return 'chicken_steam_momos';
    if (n.includes('paneer') && n.includes('momo')) return 'paneer_momos';
    if (n.includes('veg') && n.includes('fried') && n.includes('momo')) return 'veg_fried_momos';
    if (n.includes('veg') && n.includes('steam') && n.includes('momo')) return 'veg_steam_momos';
    if (c.includes('momo') && n.includes('veg')) return 'veg_steam_momos';
    if (c.includes('momo') && n.includes('paneer')) return 'paneer_momos';
    if (c.includes('momo') && n.includes('chicken')) return 'chicken_steam_momos';

    // Chocolate bowls
    if (n.includes('kitkat') && n.includes('chocolate')) return 'kitkat_chocolate_bowl';
    if (n.includes('oreo') && n.includes('chocolate')) return 'oreo_chocolate_bowl';
    if (n.includes('strawberry') && n.includes('chocolate')) return 'strawberry_chocolate_bowl';
    if (n.includes('triple') && n.includes('chocolate')) return 'triple_chocolate_bowl';
    if (n.includes('dryfruit') && n.includes('chocolate')) return 'dryfruit_chocolate_bowl';
    if (n.includes('dark') && n.includes('chocolate')) return 'dark_chocolate_bowl';

    // Chinese
    if (n.includes('chinese') && n.includes('bhel')) return 'chinese_bhel';
    if (n.includes('manchau') || n.includes('manchow')) return 'manchau_soup';
    if (n.includes('manchurian')) return 'manchurian';
    if (n.includes('noodle')) return 'noodles';

    // Specific street food
    if (n.includes('paper') && n.includes('dosa')) return 'paper_dosa';
    if (n.includes('dosa')) return 'dosa';
    if (n.includes('cheese') && n.includes('pav') && n.includes('bhaji')) return 'pav_bhaji';
    if (n.includes('butter') && n.includes('pav') && n.includes('bhaji')) return 'pav_bhaji';
    if (n.includes('pav') && n.includes('bhaji')) return 'pav_bhaji';
    if (n.includes('chinese') && n.includes('vada')) return 'vada_pav';
    if (n.includes('vada') && n.includes('pav')) return 'vada_pav';
    if (n.includes('butter') && n.includes('pav')) return 'butter_pav';
    if (n.includes('cheese') && n.includes('dabel')) return 'cheese_dabeli';
    if (n.includes('chicken') && n.includes('dabel')) return 'chicken_dabeli';
    if (n.includes('kachhi') && n.includes('dabel')) return 'dabeli';
    if (n.includes('dabel')) return 'dabeli';
    if (n.includes('kurkure')) return 'chicken_kurkure';

    // Restaurant categories
    // Pizza
    if (n.includes('paneer') && n.includes('pizza')) return 'paneer_pizza';
    if (n.includes('veg') && n.includes('pizza')) return 'veg_pizza';
    if ((n.includes('chicken') || n.includes('non-veg')) && n.includes('pizza')) return 'chicken_pizza_restaurant';
    if (n.includes('pizza') || c.includes('pizza')) return 'pizza';

    // Burger
    if (n.includes('grilled') && n.includes('burger')) return 'grilled_burger';
    if (n.includes('veg') && n.includes('burger')) return 'veg_burger';
    if (n.includes('burger') || c.includes('burger')) return 'burger';

    // Fried chicken
    if (n.includes('wing')) return 'chicken_wings';
    if (n.includes('drumstick')) return 'chicken_drumstick';
    if (n.includes('strip') || n.includes('tender')) return 'chicken_strips';
    if (n.includes('popcorn') || n.includes('cruncho') || n.includes('pop')) return 'chicken_popcorn';
    if (c.includes('fried chicken')) return 'fried_chicken';

    // Wraps
    if (n.includes('paneer') && (n.includes('wrap') || c.includes('wrap'))) return 'paneer_wrap';
    if (n.includes('veg') && (n.includes('wrap') || c.includes('wrap'))) return 'veg_wrap';
    if (n.includes('wrap') || c.includes('wrap')) return 'wrap';

    // Sandwich
    if (n.includes('chocol') && n.includes('sandwich')) return 'chocolate_sandwich';
    if (n.includes('paneer') && n.includes('sandwich')) return 'paneer_sandwich';
    if (n.includes('sandwich') || c.includes('sandwich')) return 'sandwich';

    // Fries  
    if (n.includes('peri') && n.includes('fries')) return 'peri_peri_fries';
    if (n.includes('cheese') && n.includes('fries')) return 'cheese_fries';
    if (n.includes('fries') || c.includes('fries')) return 'fries';

    // Coffee & beverages
    if (n.includes('thick') && n.includes('coffee')) return 'thick_cold_coffee';
    if (n.includes('cold') && n.includes('coffee')) return 'cold_coffee';
    if (n.includes('coffee')) return 'cold_coffee';
    if (n.includes('mojito')) return 'mojito';
    if (n.includes('lagoon') || n.includes('laggon') || c.includes('mocktail')) return 'mocktail';
    if (n.includes('shake') || n.includes('mastani')) return 'milkshake';
    if (n.includes('juice')) return 'fruit_juice';

    // Indian mains
    if (n.includes('biryani')) return 'biryani';
    if (n.includes('butter') && n.includes('chicken')) return 'butter_chicken';
    if (n.includes('chicken') && n.includes('curry')) return 'chicken_curry';
    if (n.includes('mutton')) return 'mutton_curry';
    if (n.includes('kheema') || n.includes('keema')) return 'kheema';
    if (n.includes('egg') || n.includes('anda')) return 'egg_curry';
    if (n.includes('thali')) return 'thali';
    if (n.includes('chole')) return 'chole_bhature';
    if (n.includes('paneer') && n.includes('tikka')) return 'paneer_tikka';
    if (n.includes('samosa')) return 'samosa';
    if (n.includes('pani') && n.includes('puri')) return 'pani_puri';
    if (n.includes('paratha') || c.includes('paratha')) return 'paratha';
    if (n.includes('dal') && !n.includes('dabel')) return 'dal';

    // Chinese restaurant
    if (n.includes('fried') && n.includes('rice')) return 'fried_rice';
    if (n.includes('hakka') || (n.includes('noodle') && !n.includes('manchow'))) return 'hakka_noodles';

    // General categories
    if (n.includes('pasta')) return 'pasta';
    if (n.includes('salad')) return 'salad';
    if (n.includes('soup')) return 'soup';
    if (n.includes('pulao')) return 'pulao';
    if (n.includes('rice')) return 'rice_dish';
    if (n.includes('cake') || n.includes('pastry')) return 'dessert';
    if (c.includes('bucket')) return 'bucket_combo';

    // Broad fallbacks
    if (n.includes('paneer')) return 'paneer_dish';
    if (n.includes('chicken')) return 'chicken_curry';
    if (n.includes('veg')) return 'veg_curry';

    return '';
}

async function main() {
    console.log('=== Pexels Food Image Downloader ===\n');

    // Ensure image directory exists
    if (!fs.existsSync(IMAGE_DIR)) {
        fs.mkdirSync(IMAGE_DIR, { recursive: true });
    }

    // Step 1: Download all unique images from Pexels
    const downloadedImages: Record<string, string> = {};
    const totalKeys = Object.keys(FOOD_IMAGE_MAP).length;
    let idx = 0;

    for (const [key, query] of Object.entries(FOOD_IMAGE_MAP)) {
        idx++;
        const filename = `${key}.jpg`;
        const filepath = path.join(IMAGE_DIR, filename);

        // Skip if already downloaded
        if (fs.existsSync(filepath) && fs.statSync(filepath).size > 5000) {
            console.log(`[${idx}/${totalKeys}] SKIP (exists): ${key}`);
            downloadedImages[key] = `/images/menu-items/${filename}`;
            continue;
        }

        console.log(`[${idx}/${totalKeys}] Searching: "${query}"...`);
        const imageUrl = await searchPexels(query);

        if (imageUrl) {
            try {
                await downloadImage(imageUrl, filepath);
                downloadedImages[key] = `/images/menu-items/${filename}`;
                console.log(`  ✓ Downloaded: ${filename}`);
            } catch (e) {
                console.error(`  ✗ Download failed: ${key}`, e);
            }
        } else {
            console.log(`  ✗ No results for: ${query}`);
        }

        // Rate limit: 200 requests/hour for Pexels
        await new Promise(r => setTimeout(r, 400));
    }

    console.log(`\nDownloaded ${Object.keys(downloadedImages).length} unique images.\n`);

    // Step 2: Update Street Food Items
    console.log('Updating Street Food items...');
    const streetFood = await db.select().from(streetFoodItems);
    let sfUpdated = 0;

    for (const item of streetFood) {
        const imageKey = getImageKey(item.name, item.category || '');
        if (imageKey && downloadedImages[imageKey]) {
            await db.update(streetFoodItems)
                .set({ imageUrl: downloadedImages[imageKey] })
                .where(eq(streetFoodItems.id, item.id));
            sfUpdated++;
        }
    }
    console.log(`Updated ${sfUpdated}/${streetFood.length} street food items.\n`);

    // Step 3: Update Restaurant Menu Items
    console.log('Updating Restaurant Menu items...');
    const menuItems = await db.select().from(restaurantMenuItems);
    let rmUpdated = 0;

    const BATCH_SIZE = 50;
    const updates: Promise<any>[] = [];

    for (const item of menuItems) {
        const imageKey = getImageKey(item.name, item.category || '');
        if (imageKey && downloadedImages[imageKey]) {
            updates.push(
                db.update(restaurantMenuItems)
                    .set({ imageUrl: downloadedImages[imageKey] })
                    .where(eq(restaurantMenuItems.id, item.id))
            );
            rmUpdated++;
        }
    }

    // Execute in batches
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        await Promise.all(updates.slice(i, i + BATCH_SIZE));
        process.stdout.write(`\r  Updated ${Math.min(i + BATCH_SIZE, updates.length)}/${updates.length}`);
    }

    console.log(`\nUpdated ${rmUpdated}/${menuItems.length} restaurant menu items.`);
    console.log('\n=== DONE ===');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
