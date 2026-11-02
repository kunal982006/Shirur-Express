/**
 * Generate images for the static salon menu shown on the beauty page (client/src/pages/BeautyDetail.tsx → INITIAL_MENU).
 * That page does not read service_offerings from the DB, so images are written to
 * client/src/data/salonMenuImages.ts as { [menuItemId]: cloudinaryUrl }.
 *
 *   npx tsx server/generate-salon-menu-images.ts            # PREVIEW → generated-images/salon-menu/<id>.jpg
 *   npx tsx server/generate-salon-menu-images.ts --apply    # upload to Cloudinary + write salonMenuImages.ts
 *   options: --only <id>  --force
 *
 * Adding a new menu item to BeautyDetail.tsx? Add a prompt below with the same id, then rerun both steps.
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { SALON_STYLE, QuotaError, generateImage } from './ai-image-utils';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const FORCE = args.includes('--force');
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

const OUT_DIR = path.resolve('generated-images/salon-menu');
const REUSE_DIR = path.resolve('generated-images/beauty'); // images already approved in the first batch
const MAP_FILE = path.resolve('client/src/data/salonMenuImages.ts');

const HAIR = (look: string) =>
  `Indian woman sitting in a salon chair showing her new haircut: ${look}, shiny healthy black hair, hairstyle clearly visible, ${SALON_STYLE}`;
const KID = (look: string) =>
  `Cute smiling little Indian girl about 6 years old sitting in a salon chair with a fresh ${look}, ${SALON_STYLE}`;
const FACE = (d: string) =>
  `Indian woman with eyes closed lying relaxed on a salon bed, white towel wrapped on her hair, ${d}, ${SALON_STYLE}`;

// id → prompt (string) or reuse an image from the first batch ({ reuse: 'file-name' })
const ITEMS: Record<string, string | { reuse: string }> = {
  // Haircuts
  'hw-1': { reuse: 'straight-layer-cut' }, // close match from first batch
  'hw-2': { reuse: 'u-shape-hair-cut' },
  'hw-3': { reuse: 'v-cut' },
  'hw-4': { reuse: 'wolf-cut' }, // close match from first batch
  'hw-5': { reuse: 'layer-hair-cut' },
  'hw-6': { reuse: 'feather-cut' },
  'hw-7': { reuse: 'advance-hair-cut' }, // close match from first batch
  'hw-8': HAIR('front view, long hair with soft curtain bangs parted in the middle and flowing layers'),
  'hw-9': { reuse: 'blunt-cut' }, // close match from first batch
  'hw-10': HAIR('back view, long hair with very soft natural subtle layers, smooth and light'),
  'hw-11': { reuse: 'step-cut' }, // close match from first batch
  'hw-12': { reuse: 'round-hair-cut' }, // close match from first batch
  'hw-13': HAIR('three-quarter view, voluminous feather cut with airy feathered layers flicked outward, lots of volume'),
  'hw-14': HAIR('back view, very long waist-length hair with stylish visible step layers'),
  'hw-15': HAIR('back view, very long hair with long smooth flowing layers'),
  'kh-1': KID('short neat little round haircut'),
  'kh-2': KID('rounded bouncy apple cut bob with fringe'),
  'kh-3': { reuse: 'mushroom-cut' },
  'kh-4': { reuse: 'bob-cut' }, // close match from first batch
  // Hair colour
  'hc-1': `Close-up of hair colourist applying dark brown hair dye with a brush to the roots along the hair parting of an Indian woman, root touch-up, colour bowl in hand, ${SALON_STYLE}`,
  'hc-2': HAIR('back view, long hair freshly coloured in rich glossy burgundy brown global hair colour'),
  'hc-3': HAIR('back view, long black hair with caramel blonde highlight streaks'),
  // Treatments
  'hcd-1': `Close-up of beautician applying anti-dandruff treatment cream to the scalp of an Indian woman, hair parted in sections, ${SALON_STYLE}`,
  'hcd-2': `Close-up of beautician applying hair regrowth serum with a dropper to the scalp of an Indian woman, scalp massage, ${SALON_STYLE}`,
  'hs-1': `Hairstylist using a flat iron straightener on an Indian woman's long hair, perfectly straight sleek hair, ${SALON_STYLE}`,
  'hs-2': `Indian woman with soft silky smooth frizz-free long hair after hair smoothening, stylist combing her hair, ${SALON_STYLE}`,
  'hs-3': { reuse: 'keratin-treatment' },
  'hs-4': `Hairstylist applying hair botox treatment cream with a brush on an Indian woman's long hair sections, ${SALON_STYLE}`,
  'hs-5': `Indian woman with mirror-like glossy shiny straight long hair after nanoplastia treatment, hair reflecting light, ${SALON_STYLE}`,
  'hs-6': `Luxury hair treatment, stylist applying golden shimmering hair mask to an Indian woman's long hair, gold tones, ${SALON_STYLE}`,
  // Face wax
  'fw-1': { reuse: 'face-wax' }, // close match from first batch
  'fw-2': { reuse: 'upper-lip-wax' }, // close match from first batch
  'fw-3': { reuse: 'forehead-wax' }, // close match from first batch
  'fw-4': `Close-up of beautician applying warm white paraffin wax on an Indian woman's face with a brush, glowing skin, ${SALON_STYLE}`,
  // Body wax
  'bw-1': { reuse: 'full-arms-half-arms-waxing' }, // close match from first batch
  'bw-2': { reuse: 'hand-wax' }, // close match from first batch
  'bw-3': { reuse: 'full-legs-half-legs-waxing' }, // close match from first batch
  'bw-4': { reuse: 'full-body-waxing' }, // close match from first batch
  // Manicure / pedicure
  'hf-1': `Close-up of manicure, beautician filing and shaping an Indian woman's nails, hands on a towel, ${SALON_STYLE}`,
  'hf-2': `Close-up of spa manicure, Indian woman's hands soaking in a bowl of water with rose petals, scrub and hand cream nearby, ${SALON_STYLE}`,
  'hf-3': `Close-up of pedicure, beautician cleaning and trimming an Indian woman's toenails, feet on a towel, ${SALON_STYLE}`,
  'hf-4': `Close-up of spa pedicure, Indian woman's feet in a foot spa tub with flower petals and foam, beautician massaging feet, ${SALON_STYLE}`,
};

// ---------- Cloudinary helpers ----------
function initCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  // reused images first (no API needed), then the ones to generate
  const ids = Object.keys(ITEMS)
    .filter(id => !ONLY || id === ONLY)
    .sort((a, b) => Number(typeof ITEMS[a] === 'string') - Number(typeof ITEMS[b] === 'string'));

  if (APPLY) {
    initCloudinary();
    const map: Record<string, string> = {};
    for (const id of ids) {
      const file = path.join(OUT_DIR, `${id}.jpg`);
      if (!fs.existsSync(file)) { console.log(`⏭️  ${id}: no preview yet`); continue; }
      const up = await cloudinary.uploader.upload(file, {
        folder: 'shirur-express/salon-menu',
        public_id: id,
        overwrite: true,
        transformation: [{ width: 800, height: 800, crop: 'fill', quality: 'auto', fetch_format: 'auto' }],
      });
      map[id] = up.secure_url.replace('/upload/', '/upload/w_240,h_240,c_fill,q_auto,f_auto/');
      console.log(`✅ ${id} → ${map[id]}`);
    }
    // merge with existing map so --only doesn't drop other entries
    let existing: Record<string, string> = {};
    if (fs.existsSync(MAP_FILE)) {
      const m = fs.readFileSync(MAP_FILE, 'utf8').match(/=\s*(\{[\s\S]*\});/);
      if (m) existing = JSON.parse(m[1]);
    }
    const merged = { ...existing, ...map };
    fs.mkdirSync(path.dirname(MAP_FILE), { recursive: true });
    fs.writeFileSync(MAP_FILE,
      `// AUTO-GENERATED by server/generate-salon-menu-images.ts — menu item id → image URL\n` +
      `export const SALON_MENU_IMAGES: Record<string, string> = ${JSON.stringify(merged, null, 2)};\n`);
    console.log(`\n📝 Wrote ${Object.keys(merged).length} entries to ${path.relative(process.cwd(), MAP_FILE)}`);
    return;
  }

  let generated = 0, skipped = 0, failed = 0;
  for (const id of ids) {
    const file = path.join(OUT_DIR, `${id}.jpg`);
    if (fs.existsSync(file) && !FORCE) { skipped++; continue; }
    const spec = ITEMS[id];
    if (typeof spec !== 'string') {
      fs.copyFileSync(path.join(REUSE_DIR, `${spec.reuse}.jpg`), file);
      console.log(`♻️  ${id}: reused ${spec.reuse}.jpg`); generated++;
      continue;
    }
    try {
      process.stdout.write(`🎨 ${id} ... `);
      fs.writeFileSync(file, await generateImage(spec));
      generated++; console.log('saved');
    } catch (e: any) {
      if (e instanceof QuotaError) { console.log(`\n⛔ Daily free limit reached. Rerun tomorrow.\n   ${e.message}`); break; }
      console.log(`❌ ${e.message}`); failed++;
      if (/auth failed/.test(e.message)) break;
    }
  }
  console.log(`\nDone. generated=${generated} skipped=${skipped} failed=${failed}`);
  console.log(`👀 Review: ${OUT_DIR}\n   Then: npx tsx server/generate-salon-menu-images.ts --apply`);
}

main().catch(e => { console.error(e); process.exit(1); });
