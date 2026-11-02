/**
 * Generate AI images for beauty parlor services using Cloudflare Workers AI (FLUX, free tier).
 *
 * Usage:
 *   npx tsx server/generate-beauty-images.ts --dry-run          # just print prompts, no API calls
 *   npx tsx server/generate-beauty-images.ts                    # PREVIEW: generate & save to generated-images/beauty/ (no DB change)
 *   npx tsx server/generate-beauty-images.ts --apply            # upload previews to Cloudinary & update DB
 *
 * Options:
 *   --all          include services that already have an image (default: only missing ones)
 *   --limit N      process at most N services
 *   --only "text"  only services whose name contains this text (case-insensitive)
 *   --force        regenerate even if a preview file already exists
 *
 * Env (.env):
 *   Cloudflare_Account_ID   (already present)
 *   CLOUDFLARE_AI_TOKEN     API token with "Workers AI" permission
 *   CLOUDINARY_*            (already present, used only with --apply)
 *
 * Free tier: 10,000 Neurons/day (~150+ images). When exhausted the script stops; just rerun tomorrow —
 * already generated previews are skipped, so it resumes where it left off.
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { pool } from './db';
import { v2 as cloudinary } from 'cloudinary';
import { CF_ACCOUNT_ID, CF_AI_TOKEN, SALON_STYLE, QuotaError, generateImage, slugify } from './ai-image-utils';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const APPLY = args.includes('--apply');
const ALL = args.includes('--all');
const FORCE = args.includes('--force');
const LIMIT = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : Infinity;
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1].toLowerCase() : null;

const OUT_DIR = path.resolve('generated-images/beauty');

// ---------- Prompt building ----------
const STYLE = SALON_STYLE;

const FACIAL_DETAILS: [RegExp, string][] = [
  [/gold/i, 'shimmering golden facial cream mask on her face'],
  [/diamond/i, 'sparkling diamond-infused white facial mask on her face'],
  [/pearl/i, 'pearly white glowing facial mask on her face'],
  [/papaya/i, 'orange papaya facial pack on her face, fresh papaya slices on a tray beside her'],
  [/fruit/i, 'fruit facial pack on her face, fresh fruit slices (orange, strawberry, kiwi) on a tray beside her'],
  [/potali|potli/i, 'beautician gently pressing warm herbal potli pouches (cloth bundles) on her face'],
  [/o3/i, 'O3+ professional facial kit products beside her, white cream mask on her face'],
  [/fire.*ice/i, 'red fire-and-ice facial mask on her face, ice crystals in a bowl nearby'],
  [/hydra/i, 'beautician using a hydrafacial vacuum wand device on her face'],
  [/medi/i, 'dermatology-style medi facial with clinical skincare device, clean clinical setting'],
  [/glass glow|bb glow/i, 'beautician using a microneedling pen for BB glow treatment, dewy glass-like skin'],
  [/d-?tan/i, 'de-tan pack being applied with a brush on her face and neck'],
  [/bleach/i, 'pale cream face bleach applied evenly on her face'],
  [/whiten|lightn/i, 'brightening white facial cream applied on her face, glowing skin'],
  [/anti.?aging/i, 'anti-aging facial massage with serum, beautician hands lifting her cheeks'],
  [/acne/i, 'beautician applying a green clay acne treatment mask on her face'],
  [/pigment/i, 'beautician applying brightening serum with a dropper for pigmentation treatment'],
  [/bridal/i, 'luxurious bridal facial, rose petals around, golden glow mask on her face'],
  [/glow/i, 'glow facial kit cream applied on her face, radiant skin'],
  [/clean ?up/i, 'beautician cleansing her face with cotton pads and steam, face cleanup'],
];

const HAIRCUT_DETAILS: [RegExp, string][] = [
  [/straight layer/i, 'back view, long straight hair with soft subtle layers falling evenly'],
  [/u-?shape/i, 'back view, long hair with layers cut in a rounded U-shape at the ends'],
  [/v-?cut/i, 'back view, long hair with the ends cut into a sharp V-shape point in the middle of the back'],
  [/feather/i, 'side view, medium-length hair with soft wispy feathered layers flicked outward around the face'],
  [/step/i, 'back view, long hair cut in distinct visible steps of layers'],
  [/wolf/i, 'front three-quarter view, shaggy textured wolf cut with curtain bangs and choppy layers'],
  [/bob/i, 'side view, sleek chin-length bob haircut with straight even ends'],
  [/blunt/i, 'back view, shoulder-length hair cut perfectly straight across in one blunt even line'],
  [/mushroom/i, 'front view, short rounded mushroom bowl haircut with full fringe'],
  [/round/i, 'back view, medium hair with layers cut in a soft rounded shape'],
  [/layer/i, 'back view, long hair with many bouncy visible layers'],
  [/advance/i, 'three-quarter view, trendy modern layered haircut with face-framing curtain bangs, blow-dried and styled'],
];

const WAX_DETAILS: [RegExp, string][] = [
  [/full body/i, 'beautician doing body waxing on a woman lying on a salon bed, wax strip on the leg, towel covering her body'],
  [/upper lip/i, 'close-up of beautician removing a small wax strip from a woman\'s upper lip'],
  [/lower lip|chin/i, 'close-up of beautician applying wax on a woman\'s chin area below the lower lip'],
  [/forehead/i, 'close-up of beautician applying a small wax strip on a woman\'s forehead'],
  [/face/i, 'close-up of beautician doing facial waxing with a small wax strip on a woman\'s cheek'],
  [/under ?arm/i, 'beautician applying wax on a woman\'s underarm, arm raised, wearing sleeveless top, tasteful'],
  [/arm|hand/i, 'close-up of beautician applying honey-coloured warm wax with a spatula on a woman\'s forearm'],
  [/leg/i, 'close-up of beautician pulling a wax strip from a woman\'s smooth leg'],
];

function buildPrompt(name: string, section: string, sub: string): string {
  const n = name.trim();
  const ctx = `${section} ${sub} ${n}`.toLowerCase();

  // Hair cuts: show the resulting hairstyle clearly
  if (/cut/i.test(n) || /hair cut/i.test(sub)) {
    const d = HAIRCUT_DETAILS.find(([re]) => re.test(n))?.[1] ?? `a freshly styled ${n} hairstyle`;
    return `Indian woman sitting in a salon chair showing her new haircut: ${d}, shiny healthy black hair, ` +
      `hairstyle clearly visible, ${STYLE}`;
  }
  if (/keratin|smoothing|straighten/i.test(ctx)) {
    return `Indian woman with silky straight shiny long hair after ${n}, hairstylist running a flat iron through her hair, ${STYLE}`;
  }
  if (/hair spa/i.test(ctx)) {
    return `Indian woman receiving a relaxing hair spa, hair mask cream on hair, beautician massaging scalp, ${STYLE}`;
  }
  if (/wax|hair removal/i.test(ctx)) {
    const d = WAX_DETAILS.find(([re]) => re.test(n))?.[1] ?? `beautician doing ${n} waxing`;
    return `${d}, ${STYLE}`;
  }
  if (/facial|clean ?up|skin|d-?tan|bleach/i.test(ctx)) {
    const d = FACIAL_DETAILS.find(([re]) => re.test(n))?.[1] ?? `beautician giving a ${n}`;
    return `Indian woman with eyes closed lying relaxed on a salon facial bed, white towel wrapped on her hair, ${d}, ${n}, ${STYLE}`;
  }
  if (/makeup|bridal/i.test(ctx)) {
    return `Makeup artist applying ${n} on an Indian woman, makeup brushes and palette visible, ${STYLE}`;
  }
  if (/thread|eyebrow/i.test(ctx)) {
    return `Close-up of beautician doing eyebrow threading on an Indian woman, ${STYLE}`;
  }
  if (/mani|pedi|nail/i.test(ctx)) {
    return `Close-up of ${n} in a salon, beautician working on nails, ${STYLE}`;
  }
  if (/mehendi|mehndi|henna/i.test(ctx)) {
    return `Close-up of intricate bridal mehendi henna design on hands, ${STYLE}`;
  }
  return `${n} beauty service being performed in a salon, ${STYLE}`;
}

// ---------- Main ----------
async function main() {
  if (!DRY_RUN && !APPLY && (!CF_ACCOUNT_ID || !CF_AI_TOKEN)) {
    console.error('❌ Missing Cloudflare_Account_ID or CLOUDFLARE_AI_TOKEN in .env');
    process.exit(1);
  }
  if (APPLY) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const { rows } = await pool.query(`
    SELECT o.id, COALESCE(NULLIF(TRIM(o.name), ''), t.name) AS name,
           COALESCE(o.section, '') AS section, COALESCE(o.sub_category, '') AS sub,
           o.image_url, p.business_name
    FROM service_offerings o
    JOIN service_providers p ON p.id = o.provider_id
    JOIN service_categories c ON c.id = p.category_id
    LEFT JOIN service_templates t ON t.id = o.template_id
    WHERE c.slug = 'beauty'
    ORDER BY p.business_name, o.section, o.sub_category, name`);

  let items = rows.filter((r: any) => r.name && (ALL || !r.image_url || r.image_url.trim() === ''));
  if (ONLY) items = items.filter((r: any) => r.name.toLowerCase().includes(ONLY));
  items = items.slice(0, LIMIT);

  console.log(`💇 ${items.length} beauty services to process (mode: ${DRY_RUN ? 'DRY RUN' : APPLY ? 'APPLY' : 'PREVIEW'})\n`);

  // Same service name → same image (avoid duplicate generations)
  const byKey = new Map<string, any[]>();
  for (const it of items) {
    const key = slugify(it.name);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(it);
  }

  let generated = 0, applied = 0, skipped = 0, failed = 0;
  const manifest: Record<string, { name: string; prompt: string }> = {};

  for (const [key, group] of Array.from(byKey)) {
    const first = group[0];
    const prompt = buildPrompt(first.name, first.section, first.sub);
    const file = path.join(OUT_DIR, `${key}.jpg`);
    manifest[key] = { name: first.name, prompt };

    if (DRY_RUN) {
      console.log(`• ${first.name}  [${first.section} / ${first.sub}]\n   → ${prompt}\n`);
      continue;
    }

    if (APPLY) {
      if (!fs.existsSync(file)) { console.log(`⏭️  ${first.name}: no preview file yet, skipping`); skipped++; continue; }
      try {
        const up = await cloudinary.uploader.upload(file, {
          folder: 'shirur-express/beauty-ai',
          public_id: key,
          overwrite: true,
          transformation: [{ width: 800, height: 800, crop: 'fill', quality: 'auto', fetch_format: 'auto' }],
        });
        for (const it of group) {
          await pool.query(`UPDATE service_offerings SET image_url = $1, updated_at = NOW() WHERE id = $2`, [up.secure_url, it.id]);
          applied++;
        }
        console.log(`✅ ${first.name} → ${up.secure_url} (${group.length} row${group.length > 1 ? 's' : ''})`);
      } catch (e: any) {
        console.log(`❌ ${first.name}: upload failed – ${e.message}`); failed++;
      }
      continue;
    }

    // PREVIEW mode
    if (fs.existsSync(file) && !FORCE) { console.log(`⏭️  ${first.name}: preview exists`); skipped++; continue; }
    try {
      process.stdout.write(`🎨 ${first.name} ... `);
      const img = await generateImage(prompt);
      fs.writeFileSync(file, img);
      generated++;
      console.log(`saved ${path.relative(process.cwd(), file)}`);
    } catch (e: any) {
      if (e instanceof QuotaError) {
        console.log(`\n⛔ Daily free limit reached. Rerun tomorrow to continue.\n   ${e.message}`);
        break;
      }
      console.log(`❌ ${e.message}`); failed++;
      if (/auth failed/.test(e.message)) break;
    }
  }

  if (!DRY_RUN) {
    const mfile = path.join(OUT_DIR, 'prompts.json');
    const prev = fs.existsSync(mfile) ? JSON.parse(fs.readFileSync(mfile, 'utf8')) : {};
    fs.writeFileSync(mfile, JSON.stringify({ ...prev, ...manifest }, null, 2));
  }

  console.log(`\nDone. generated=${generated} applied=${applied} skipped=${skipped} failed=${failed}`);
  if (!DRY_RUN && !APPLY) {
    console.log(`\n👀 Review images in ${OUT_DIR}`);
    console.log(`   Delete any bad image and rerun to regenerate it (or use --only "name" --force).`);
    console.log(`   When happy: npx tsx server/generate-beauty-images.ts --apply`);
  }
  await pool.end();
}

main().catch(async e => { console.error(e); await pool.end().catch(() => {}); process.exit(1); });
