/**
 * Generate AI food images for one restaurant's menu (restaurant_menu_items) with Cloudflare Workers AI.
 *
 *   npx tsx server/generate-restaurant-images.ts --provider tiranga --dry-run   # print dish → prompt, no API calls
 *   npx tsx server/generate-restaurant-images.ts --provider tiranga             # PREVIEW → generated-images/restaurants/<slug>/
 *   npx tsx server/generate-restaurant-images.ts --provider tiranga --apply     # upload previews to Cloudinary + update DB
 *
 * Options:
 *   --all            include items that already have an image (default: only items with no image)
 *   --stock          also include items using a bundled stock photo (/images/...), but not AI/Cloudinary ones
 *   --only "text"    only dishes whose name contains this text
 *   --force          regenerate even if a preview file exists
 *   --veg            pure-veg restaurant: vegetarian prompts only (never chicken/egg)
 *   --clear-images   back up the current image URLs to old-image-urls.json, then remove them from the DB
 *
 * (Full)/(Half)/(Plate) variants and spelling variants (Gost/Gosht, Chilly/Chilli…) share one image.
 * Free tier is limited per day: when it runs out the script stops; rerun the next day and it resumes.
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { pool } from './db';
import { v2 as cloudinary } from 'cloudinary';
import { QuotaError, generateImage, slugify } from './ai-image-utils';
import { describeVeg } from './veg-dish-prompts';
import { describeExtra } from './extra-dish-prompts';

const args = process.argv.slice(2);
const arg = (f: string) => (args.includes(f) ? args[args.indexOf(f) + 1] : null);
const DRY_RUN = args.includes('--dry-run');
const APPLY = args.includes('--apply');
const ALL = args.includes('--all');
const STOCK = args.includes('--stock');
const FORCE = args.includes('--force');
const CLEAR = args.includes('--clear-images');
const VEG = args.includes('--veg');
const PROVIDER = arg('--provider');
const ONLY = arg('--only')?.toLowerCase() ?? null;
const STEPS = 4;

const STYLE =
  'professional Indian restaurant food photography, close-up, 45-degree angle, dark wooden table, warm natural light, ' +
  'appetizing, sharp focus, shallow depth of field, square composition, no people, no hands, no text, no letters, no watermark, no logo';

// ---------- Name normalisation: variants that should share one image ----------
function dishKey(name: string): string {
  let n = name.toLowerCase().replace(/\((full|half|plate)\)/g, ' ')
    .replace(/\([^)]*(person|piece|family pack|kilogram|grams|kg)[^)]*\)/g, ' ').replace(/\(\d+\s*("|in|inch)?\)/g, ' ');
  const fixes: [RegExp, string][] = [
    [/\bgost\b|\bgosh\b/g, 'gosht'], [/chilly/g, 'chilli'], [/pulav/g, 'pulao'], [/sukha/g, 'sukka'],
    [/lahsuni/g, 'lasuni'], [/khichadi/g, 'khichdi'], [/moghlai/g, 'moglai'], [/seekh/g, 'seek'],
    [/tutti[- ]?frutt?i/g, 'tutti frutti'], [/malwar|malvan|malbar/g, 'malabar'], [/steak/g, 'stick'],
    [/thumbs up|thums up/g, 'thums up'],
  ];
  for (const [re, to] of fixes) n = n.replace(re, to);
  return slugify(n);
}

// ---------- Dish descriptions ----------
const MEAT: Record<string, string> = {
  chicken: 'bone-in chicken pieces',
  mutton: 'tender dark mutton (goat meat) pieces on the bone',
  paneer: 'soft white paneer cubes',
};
const bowl = 'served in a round steel serving bowl, garnished with fresh coriander';

// Whole-dish descriptions, matched against the normalised name (first match wins)
const SPECIAL: [RegExp, string][] = [
  // Biryani & rice
  [/chicken dum biryani/, 'chicken dum biryani, long-grain saffron and white basmati rice layered with chicken pieces, fried onions and mint, served on a plate with raita'],
  [/mutton dum biryani/, 'mutton dum biryani, long-grain saffron and white basmati rice layered with dark mutton pieces, fried onions and mint, served on a plate with raita'],
  [/kashmiri pulao/, 'chicken Kashmiri pulao, mildly sweet white basmati rice with chicken pieces, cashews, raisins and fruit bits, on a plate'],
  [/zamzam pulao/, 'rich chicken pulao, golden-yellow basmati rice with chicken pieces, fried onions, cashews and a halved boiled egg, on a plate'],
  [/jeera rice/, 'jeera rice, plain white basmati rice tempered with cumin seeds and coriander, in a steel bowl'],
  // Chinese
  [/schezwan noodles/, 'chicken schezwan noodles, spicy red-orange stir-fried noodles with shredded chicken and vegetables, on a white plate'],
  [/triple noodles/, 'chicken triple schezwan, noodles and fried rice together on one plate with a bowl of red schezwan gravy and crispy fried noodles on top'],
  [/chicken noodles/, 'chicken hakka noodles, light brown stir-fried noodles with shredded chicken, cabbage, carrot and spring onion, on a white plate'],
  [/schezwan rice/, 'chicken schezwan fried rice, spicy red-orange fried rice with chicken bits and spring onion, on a white plate'],
  [/triple rice/, 'chicken triple schezwan rice, fried rice and noodles on one plate with a bowl of red schezwan gravy and crispy fried noodles on top'],
  [/fried rice/, 'chicken fried rice, Indo-Chinese fried rice with chicken bits, egg, carrot, beans and spring onion, on a white plate'],
  // Starters
  [/chicken 65/, 'chicken 65, bite-sized deep-fried red spicy boneless chicken pieces tossed with curry leaves and green chillies, on a plate'],
  [/chilli dry/, 'chilli chicken dry, Indo-Chinese crispy boneless chicken tossed with green capsicum, onion and soy chilli sauce, no gravy, on a plate'],
  [/paneer chilli/, 'paneer chilli dry, Indo-Chinese fried paneer cubes tossed with green capsicum, onion and soy chilli sauce, on a plate'],
  [/chicken crispy/, 'crispy chicken, thin strips of deep-fried crispy chicken tossed in red sauce with sesame seeds and spring onion, on a plate'],
  [/drumstick/, 'fried chicken drumsticks (leg pieces) with a crisp reddish-brown spiced coating, on a plate with onion rings and lemon'],
  [/chicken kfc/, 'crispy fried chicken pieces with a crunchy golden-brown breaded coating, piled on a plate with ketchup'],
  [/kadi gosht/, 'dry-fried chicken pieces tossed with curry leaves, green chillies and spices, on a plate with onion rings'],
  [/chicken roll/, 'chicken rolls, crispy golden fried rolls stuffed with spiced chicken, cut open on a plate with ketchup'],
  [/chicken samosa/, 'chicken samosas, triangular golden-fried pastries with minced chicken filling, on a plate with green chutney'],
  [/chicken seek/, 'chicken seekh kebab, long grilled minced chicken kebabs with char marks, on a plate with onion rings, lemon and mint chutney'],
  [/chicken stick/, 'chicken sticks, grilled spiced boneless chicken pieces on wooden skewers, on a plate with onion rings and lemon'],
  [/tandoori/, 'tandoori chicken, charred red-orange roasted chicken leg and breast pieces, on a plate with onion rings, lemon and mint chutney'],
  [/chicken wings/, 'spicy fried chicken wings glazed in red sauce, on a plate'],
  [/lollipop masala/, 'chicken lollipops tossed in thick dry red masala with spring onion, bone handles visible, on a plate'],
  [/lollipop oil fry/, 'chicken lollipops, deep-fried crispy red chicken drumettes with bone handles, arranged on a plate with schezwan sauce'],
  // Drinks
  [/jeera soda/, 'a glass of fizzy brown jeera masala soda with ice and a lemon slice'],
  [/maaza/, 'a plain straight-sided glass tumbler filled with chilled thick orange-yellow mango juice, a fresh mango beside it'],
  [/thums up.*sprite.*sting/, 'three plain glasses of cold soft drinks side by side: dark cola, clear lemon soda and red energy drink, with ice'],
  [/thums up/, 'a glass of chilled dark cola with ice cubes and fizz'],
  [/sprite/, 'a glass of chilled clear lemon-lime soda with ice cubes and bubbles'],
  [/sting/, 'a glass of chilled bright red energy drink with ice cubes'],
  [/water bottle/, 'a plain sealed clear plastic drinking water bottle with condensation, no label'],
  // Roti
  [/butter chapati/, 'soft wheat chapatis brushed with melting butter, stacked on a plate'],
  [/chapati/, 'soft thin wheat chapatis stacked on a steel plate'],
  [/butter roti/, 'tandoori rotis brushed with butter, stacked in a basket'],
  [/tandoor roti/, 'tandoori rotis with charred spots, stacked in a basket lined with cloth'],
  [/rumali/, 'rumali roti, very thin large soft flatbread folded like a handkerchief on a plate'],
  [/butter naan/, 'butter naan, soft leavened flatbread glistening with butter and coriander, in a basket'],
  [/plain naan/, 'plain naan, soft teardrop-shaped leavened flatbread with charred bubbles, in a basket'],
  [/laccha paratha/, 'laccha paratha, crisp flaky multi-layered spiral flatbread on a plate'],
  // Thali
  [/special mutton thali/, 'large special mutton thali, big steel plate with mutton curry, dry mutton fry, red rassa, white rassa, egg, bhakri, rice, onion and lemon'],
  [/mutton thali/, 'mutton thali, steel plate with a bowl of dark mutton curry, red rassa, chapati, rice, onion and lemon'],
  [/chicken thali/, 'chicken thali, steel plate with a bowl of chicken curry, red rassa, chapati, rice, onion and lemon'],
  // Veg
  [/dal khichdi/, 'dal khichdi, soft yellow rice and lentil khichdi with ghee tempering, in a steel bowl with papad'],
  [/dal makhani/, 'dal makhani, creamy dark brown black lentil dal with a swirl of cream, in a steel bowl'],
  [/dal tadka/, 'dal tadka, yellow lentil dal with red chilli, garlic and cumin tempering on top, in a steel bowl'],
  [/dal fry/, 'dal fry, thick yellow lentil dal with onion and tomato, garnished with coriander, in a steel bowl'],
  [/kaju masala/, `kaju masala, whole cashew nuts in creamy orange-brown gravy, ${bowl}`],
  [/matar paneer/, `matar paneer, paneer cubes and green peas in red-orange tomato gravy, ${bowl}`],
  [/palak paneer/, `palak paneer, white paneer cubes in smooth dark green spinach gravy with a swirl of cream, ${bowl}`],
  [/plain palak/, `plain palak, smooth dark green spinach gravy with garlic tempering, ${bowl}`],
  [/paneer butter masala/, `paneer butter masala, paneer cubes in smooth creamy orange gravy with a swirl of cream, ${bowl}`],
  [/shevbhaji/, 'shev bhaji, spicy red Maharashtrian curry topped with lots of crispy yellow sev, in a steel bowl'],
  // Egg
  [/anda curry/, 'anda curry, halved boiled eggs in thin spicy red curry, in a steel bowl with coriander'],
  [/anda masala/, 'anda masala, boiled eggs in thick brown onion-tomato masala gravy, in a steel bowl with coriander'],
  // Chicken / mutton specials
  [/butter chicken/, `butter chicken, boneless chicken pieces in smooth creamy orange tomato-butter gravy with a swirl of cream, ${bowl}`],
  [/murg mussallam/, 'murgh musallam, a whole roasted chicken sitting in rich thick brown-orange gravy, garnished with halved boiled eggs and coriander, in a large oval dish'],
  [/kaleji petha/, 'chicken liver and gizzard dry fry with onions, curry leaves and spices, on a plate with lemon'],
  [/garlic kheema/, 'chicken garlic kheema, dry spicy minced chicken cooked with lots of garlic, garnished with coriander, in a steel bowl'],
  [/gavran chicken kala masala/, 'gavran (country) chicken in dark blackish-brown Maharashtrian kala masala gravy, in a steel bowl'],
  [/gavran chicken fry/, 'gavran (country) chicken dry fry, small dark bone-in chicken pieces coated in dark roasted masala, on a plate with onion'],
  [/kerala chicken/, 'Kerala chicken curry, chicken pieces in orange-yellow coconut milk curry with curry leaves, in a bowl'],
  [/chicken chilli gravy/, 'chilli chicken gravy, Indo-Chinese boneless chicken in glossy dark soy gravy with green capsicum and spring onion, in a bowl'],
  [/chicken tiranga/, 'tricolour chicken, one dish with three stripes of chicken gravy side by side: orange-red, creamy white and green'],
  [/vajadi fry/, 'vajadi fry, small chopped pieces of goat offal dry-fried with onions, spices and coriander, on a plate with lemon'],
  [/vajadi masala/, 'vajadi masala, small chopped pieces of goat offal in thick spicy brown masala gravy, in a steel bowl'],
];

// Gravy / cooking styles applied to chicken, mutton or paneer (first match wins)
const STYLES: [RegExp, (m: string) => string][] = [
  [/shahi korma/, m => `${m} in rich creamy pale golden cashew gravy garnished with cream, cashews and saffron, ${bowl}`],
  [/korma/, m => `${m} in creamy light brown korma gravy, ${bowl}`],
  [/kolhapuri/, m => `${m} in fiery dark red spicy Kolhapuri gravy with red chilli oil floating on top, ${bowl}`],
  [/angara/, m => `${m} in smoky bright red spicy gravy, ${bowl}`],
  [/kadhai/, m => `${m} in thick semi-dry masala with chunks of green capsicum and onion, served in a small iron kadhai`],
  [/handi/, m => `${m} in rich brown gravy served in a clay handi pot, garnished with coriander`],
  [/hyderabadi/, m => `${m} in green-brown gravy made with mint, coriander and fried onions, ${bowl}`],
  [/makhani/, m => `${m} in smooth orange buttery makhani gravy with cream, ${bowl}`],
  [/do pyaza/, m => `${m} in brown gravy with lots of large onion petals, ${bowl}`],
  [/adraki/, m => `${m} in thick brown ginger-flavoured gravy with a small pinch of finely chopped ginger on top, ${bowl}`],
  [/lasuni/, m => `${m} in brown gravy topped with golden fried garlic, ${bowl}`],
  [/achar gosht/, m => `${m} in tangy red pickle-spiced gravy with whole green chillies, ${bowl}`],
  [/dal gosht/, m => `${m} cooked in thick yellow lentil dal with red chilli tempering, ${bowl}`],
  [/dalcha/, m => `${m} in yellowish-brown lentil stew with bottle gourd pieces, ${bowl}`],
  [/pepper masala/, m => `${m} in dark brown black-pepper gravy with crushed peppercorns, ${bowl}`],
  [/pepper dry|roast pepper/, m => `${m} dry-roasted with crushed black pepper and curry leaves, no gravy, on a plate with onion rings`],
  [/roast/, m => `${m} dry-roasted dark brown, coated in thick roasted masala, on a plate with onion rings and lemon`],
  [/malabar fry/, m => `${m} dry-fried with coconut slivers, curry leaves and dried red chillies, on a plate`],
  [/kheema fry/, m => `dry spicy minced ${m.includes('mutton') ? 'mutton' : 'chicken'} kheema with green peas, garnished with coriander, in a steel bowl with lemon`],
  [/kheema masala/, m => `minced ${m.includes('mutton') ? 'mutton' : 'chicken'} kheema in thick brown masala gravy, garnished with coriander, in a steel bowl`],
  [/bhuna/, m => `${m} coated in thick dark brown bhuna masala, ${bowl}`],
  [/maharaja/, m => `${m} in rich thick gravy garnished with halved boiled eggs, cashews and cream, in a large serving bowl`],
  [/patiyala/, m => `${m} in creamy brown gravy topped with thin omelette strips, ${bowl}`],
  [/khajana/, m => `${m} in rich creamy yellow gravy with cashews, raisins and dry fruits, ${bowl}`],
  [/tutti frutti/, m => `${m} in mild creamy white gravy garnished with colourful candied tutti frutti bits, ${bowl}`],
  [/moglai/, m => `${m} in rich creamy brown Mughlai gravy with shredded egg, ${bowl}`],
  [/sukka/, m => `${m} semi-dry, coated in dark roasted coconut masala, on a plate with onion and lemon`],
  [/fry/, m => `${m} dry-fried with onions, curry leaves and spices, on a plate with a lemon wedge`],
  [/masala/, m => `${m} in thick reddish-brown onion-tomato masala gravy, ${bowl}`],
  [/curry/, m => `${m} in thin spicy red curry with oil floating on top, in a steel bowl with coriander`],
];

function describe(name: string): { text: string; fallback: boolean } {
  const n = dishKey(name).replace(/-/g, ' ');
  const special = SPECIAL.find(([re]) => re.test(n));
  if (special) return { text: special[1], fallback: false };
  const meatKey = Object.keys(MEAT).find(k => n.includes(k));
  const style = STYLES.find(([re]) => re.test(n));
  if (meatKey && style) return { text: `${name.replace(/\(.*?\)/g, '').trim()}, ${style[1](MEAT[meatKey])}`, fallback: false };
  return { text: `${name.replace(/\(.*?\)/g, '').trim()}, Indian restaurant dish, served on a plate`, fallback: true };
}

// ---------- Main ----------
async function main() {
  if (!PROVIDER) { console.error('❌ Pass --provider "<part of restaurant name>"'); process.exit(1); }
  const prov = await pool.query(`SELECT id, business_name FROM service_providers WHERE business_name ILIKE $1`, [`%${PROVIDER}%`]);
  if (prov.rows.length !== 1) {
    console.error(`❌ "${PROVIDER}" matched ${prov.rows.length} restaurants: ${prov.rows.map((r: any) => r.business_name).join(', ')}`);
    process.exit(1);
  }
  const { id: providerId, business_name } = prov.rows[0];
  const pslug = slugify(business_name);
  const OUT_DIR = path.resolve('generated-images/restaurants', pslug);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const { rows } = await pool.query(
    `SELECT id, name, category, description, image_url, is_veg FROM restaurant_menu_items WHERE provider_id = $1 ORDER BY category NULLS LAST, name`, [providerId]);

  if (CLEAR) {
    const backup = path.join(OUT_DIR, 'old-image-urls.json');
    if (fs.existsSync(backup)) { console.error(`❌ Backup already exists (${backup}); not overwriting.`); process.exit(1); }
    fs.writeFileSync(backup, JSON.stringify(rows.map((r: any) => ({ id: r.id, name: r.name, image_url: r.image_url })), null, 2));
    const res = await pool.query(`UPDATE restaurant_menu_items SET image_url = NULL WHERE provider_id = $1`, [providerId]);
    console.log(`🗑️  ${business_name}: removed images from ${res.rowCount} items (old links saved in ${path.relative(process.cwd(), backup)})`);
    await pool.end();
    return;
  }

  let items = rows.filter((r: any) => ALL || !r.image_url || r.image_url.trim() === '' || (STOCK && r.image_url.startsWith('/images/')));
  if (ONLY) items = items.filter((r: any) => r.name.toLowerCase().includes(ONLY));

  const groups = new Map<string, any[]>();
  for (const it of items) {
    const k = dishKey(it.name);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(it);
  }
  console.log(`🍽️  ${business_name}: ${items.length} items → ${groups.size} different dishes (mode: ${DRY_RUN ? 'DRY RUN' : APPLY ? 'APPLY' : 'PREVIEW'})\n`);

  if (APPLY) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  let generated = 0, applied = 0, skipped = 0, failed = 0, fallbacks = 0;
  for (const [key, group] of Array.from(groups)) {
    // Veg items (whole restaurant with --veg, or items flagged is_veg) use the vegetarian prompt builder,
    // so a "Veg Fried Rice" is never drawn with chicken.
    const vegItem = VEG || group.every((g: any) => g.is_veg);
    const extra = describeExtra(key.replace(/-/g, ' '));
    const extraOk = extra && !(vegItem && /chicken|mutton|fish|prawn|egg|meat/.test(extra));
    let { text, fallback } = extraOk
      ? { text: extra!, fallback: false }
      : vegItem
        ? describeVeg(group[0].name, group[0].category, group[0].description)
        : describe(group[0].name);
    if (/boneless/i.test(group[0].name)) {
      text = text.replace(/bone-in chicken pieces/g, 'boneless chicken pieces')
        .replace(/tender dark mutton \(goat meat\) pieces on the bone/g, 'tender boneless mutton (goat meat) pieces');
    }
    const prompt = `${text}, ${vegItem ? 'pure vegetarian food, ' : ''}${STYLE}`;
    const file = path.join(OUT_DIR, `${key}.jpg`);
    if (fallback) fallbacks++;

    if (DRY_RUN) {
      console.log(`${fallback ? '⚠️ ' : '• '}${group.map((g: any) => g.name).join(' / ')}\n   → ${text}\n`);
      continue;
    }

    if (APPLY) {
      if (!fs.existsSync(file)) { skipped++; continue; }
      try {
        const up = await cloudinary.uploader.upload(file, {
          folder: `shirur-express/restaurants-ai/${pslug}`,
          public_id: key,
          overwrite: true,
          transformation: [{ width: 800, height: 800, crop: 'fill', quality: 'auto', fetch_format: 'auto' }],
        });
        for (const it of group) {
          await pool.query(`UPDATE restaurant_menu_items SET image_url = $1 WHERE id = $2`, [up.secure_url, it.id]);
          applied++;
        }
        console.log(`✅ ${group[0].name} (${group.length})`);
      } catch (e: any) { console.log(`❌ ${group[0].name}: ${e.message}`); failed++; }
      continue;
    }

    if (fs.existsSync(file) && !FORCE) { skipped++; continue; }
    try {
      process.stdout.write(`🎨 ${key} ... `);
      fs.writeFileSync(file, await generateImage(prompt, STEPS));
      generated++; console.log('saved');
    } catch (e: any) {
      if (e instanceof QuotaError) { console.log(`\n⛔ Daily free limit reached. Rerun tomorrow to continue.`); break; }
      console.log(`❌ ${e.message}`); failed++;
      if (/auth failed/.test(e.message)) break;
    }
  }

  const remaining = Array.from(groups.keys()).filter(k => !fs.existsSync(path.join(OUT_DIR, `${k}.jpg`))).length;
  console.log(`\nDone. generated=${generated} applied=${applied} skipped=${skipped} failed=${failed}` +
    (DRY_RUN ? ` generic-prompts=${fallbacks}` : ` dishes-without-preview=${remaining}`));
  await pool.end();
}

main().catch(async e => { console.error(e); await pool.end().catch(() => {}); process.exit(1); });
