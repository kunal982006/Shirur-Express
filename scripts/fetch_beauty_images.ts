/**
 * Fetch unique beauty service images from Pexels and update DB.
 * Usage: npx tsx scripts/fetch_beauty_images.ts
 */
import 'dotenv/config';
import { db } from '../server/db';
import { serviceTemplates, serviceOfferings } from '../shared/schema';
import { eq, ilike } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';
const IMAGE_DIR = path.resolve('client/public/images/beauty');

if (!PEXELS_API_KEY) {
    console.error('ERROR: Set PEXELS_API_KEY in your .env file');
    process.exit(1);
}

// Each beauty service mapped to a specific Pexels search query
const BEAUTY_IMAGE_MAP: Record<string, string> = {
    'haircut': 'woman haircut salon scissors professional',
    'hair_spa': 'hair spa treatment oil massage salon',
    'smoothing': 'hair smoothing straightening treatment salon',
    'keratin': 'keratin hair treatment shiny smooth',
    'hair_coloring': 'hair coloring dye salon colorful',
    'fruit_facial': 'fruit facial skincare spa treatment',
    'gold_facial': 'gold facial luxury skincare spa',
    'diamond_facial': 'diamond facial premium skincare',
    'bleach': 'skin bleach face treatment beauty',
    'waxing_arms': 'wax arm beauty smooth skin salon',
    'waxing_legs': 'wax legs smooth skin beauty salon',
    'waxing_full': 'full body waxing beauty salon',
    'bridal_makeup': 'bridal makeup bride wedding beautiful',
    'party_makeup': 'party makeup glamorous evening look',
    'threading': 'eyebrow threading beauty salon close up',
    'manicure': 'manicure nail art salon hands beautiful',
    'pedicure': 'pedicure foot spa salon care',
    'nail_art': 'nail art colorful design creative',
    'gel_nails': 'gel nails polish salon shiny',
    'head_massage': 'head massage relaxing salon spa',
    'cleanup': 'face cleanup skincare beauty treatment',
    'detan': 'de-tan face treatment bright skin',
    'hair_trim': 'hair trim bangs styling salon',
    'straightening': 'hair straightening iron sleek salon',
    'mehendi': 'mehendi henna hands design bridal',
    'saree_draping': 'saree draping styling indian fashion',
};

function downloadImage(url: string, filepath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        const doGet = (u: string) => {
            https.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
                if (response.statusCode === 301 || response.statusCode === 302) {
                    const loc = response.headers.location;
                    if (loc) { doGet(loc); return; }
                }
                response.pipe(file);
                file.on('finish', () => { file.close(); resolve(); });
            }).on('error', (err) => {
                fs.unlink(filepath, () => { });
                reject(err);
            });
        };
        doGet(url);
    });
}

async function searchPexels(query: string): Promise<string | null> {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=square`;
    try {
        const res = await fetch(url, { headers: { 'Authorization': PEXELS_API_KEY } });
        const data = await res.json() as any;
        if (data.photos && data.photos.length > 0) {
            return data.photos[0].src.medium;
        }
    } catch (e) {
        console.error(`Pexels search failed for "${query}":`, e);
    }
    return null;
}

// Map a service name to an image key
function getImageKey(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('bridal') && n.includes('makeup')) return 'bridal_makeup';
    if (n.includes('party') && n.includes('makeup')) return 'party_makeup';
    if (n.includes('mehendi') || n.includes('mehndi')) return 'mehendi';
    if (n.includes('saree') && n.includes('drap')) return 'saree_draping';
    if (n.includes('gel') && n.includes('nail')) return 'gel_nails';
    if (n.includes('nail') && n.includes('art')) return 'nail_art';
    if (n.includes('gold') && n.includes('facial')) return 'gold_facial';
    if (n.includes('diamond') && n.includes('facial')) return 'diamond_facial';
    if (n.includes('fruit') && n.includes('facial')) return 'fruit_facial';
    if (n.includes('facial')) return 'fruit_facial';
    if (n.includes('hair') && n.includes('spa')) return 'hair_spa';
    if (n.includes('hair') && n.includes('color')) return 'hair_coloring';
    if (n.includes('smoothing') || n.includes('smooth')) return 'smoothing';
    if (n.includes('keratin')) return 'keratin';
    if (n.includes('straighten')) return 'straightening';
    if (n.includes('hair') && n.includes('trim')) return 'hair_trim';
    if (n.includes('haircut') || n.includes('hair cut')) return 'haircut';
    if (n.includes('bleach')) return 'bleach';
    if (n.includes('wax') && n.includes('full')) return 'waxing_full';
    if (n.includes('wax') && n.includes('arm')) return 'waxing_arms';
    if (n.includes('wax') && n.includes('leg')) return 'waxing_legs';
    if (n.includes('wax')) return 'waxing_full';
    if (n.includes('thread')) return 'threading';
    if (n.includes('manicure')) return 'manicure';
    if (n.includes('pedicure')) return 'pedicure';
    if (n.includes('cleanup') || n.includes('clean up')) return 'cleanup';
    if (n.includes('detan') || n.includes('de-tan')) return 'detan';
    if (n.includes('head') && n.includes('massage')) return 'head_massage';
    if (n.includes('makeup')) return 'party_makeup';
    return 'haircut'; // generic fallback
}

async function main() {
    console.log('=== Beauty Service Image Downloader ===\n');

    // Ensure directory exists
    if (!fs.existsSync(IMAGE_DIR)) {
        fs.mkdirSync(IMAGE_DIR, { recursive: true });
    }

    // Step 1: Download all unique images
    const downloadedImages: Record<string, string> = {};
    const totalKeys = Object.keys(BEAUTY_IMAGE_MAP).length;
    let idx = 0;

    for (const [key, query] of Object.entries(BEAUTY_IMAGE_MAP)) {
        idx++;
        const filename = `${key}.jpg`;
        const filepath = path.join(IMAGE_DIR, filename);

        if (fs.existsSync(filepath) && fs.statSync(filepath).size > 5000) {
            console.log(`[${idx}/${totalKeys}] SKIP (exists): ${key}`);
            downloadedImages[key] = `/images/beauty/${filename}`;
            continue;
        }

        console.log(`[${idx}/${totalKeys}] Searching: "${query}"...`);
        const imageUrl = await searchPexels(query);

        if (imageUrl) {
            try {
                await downloadImage(imageUrl, filepath);
                downloadedImages[key] = `/images/beauty/${filename}`;
                console.log(`  ✓ Downloaded: ${filename}`);
            } catch (e) {
                console.error(`  ✗ Download failed: ${key}`, e);
            }
        } else {
            console.log(`  ✗ No results for: ${query}`);
        }

        await new Promise(r => setTimeout(r, 400)); // rate limit
    }

    console.log(`\nDownloaded ${Object.keys(downloadedImages).length} unique images.\n`);

    // Step 2: Update service_templates (seed data)
    console.log('Updating service_templates...');
    const templates = await db.select().from(serviceTemplates).where(eq(serviceTemplates.categorySlug, 'beauty'));
    let tCount = 0;

    for (const t of templates) {
        const key = getImageKey(t.name);
        if (downloadedImages[key]) {
            await db.update(serviceTemplates)
                .set({ imageUrl: downloadedImages[key] })
                .where(eq(serviceTemplates.id, t.id));
            tCount++;
        }
    }
    console.log(`Updated ${tCount}/${templates.length} templates.\n`);

    // Step 3: Update service_offerings (actual provider data)
    console.log('Updating service_offerings...');
    const offerings = await db.select().from(serviceOfferings);
    let oCount = 0;

    for (const o of offerings) {
        const name = o.name || '';
        const key = getImageKey(name);
        if (downloadedImages[key]) {
            await db.update(serviceOfferings)
                .set({ imageUrl: downloadedImages[key] })
                .where(eq(serviceOfferings.id, o.id));
            oCount++;
        }
    }
    console.log(`Updated ${oCount}/${offerings.length} offerings.\n`);

    console.log('=== DONE ===');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
