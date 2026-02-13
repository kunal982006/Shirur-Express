// server/import-gmart-products.ts
// Script to import GMart grocery products from CSV
// SAFE: All operations are wrapped in try-catch to prevent server crashes

import { parse } from 'csv-parse/sync';
import { db } from './db';
import { groceryProducts, serviceProviders, serviceCategories } from '@shared/schema';
import { eq } from 'drizzle-orm';

// New CSV format: Name, UOM, MRP, Selling Price, Quantity, Total MRP, Total SP, Image Url, Category
interface CSVProduct {
    Name: string;
    UOM: string;
    MRP: string;
    'Selling Price': string;
    Quantity: string;
    'Total MRP': string;
    'Total SP': string;
    'Image Url': string;
    Category: string;
}

// ============================================================
// COMPREHENSIVE KEYWORD-BASED CATEGORY CORRECTION
// The CSV has MANY products in wrong categories.
// This function overrides CSV category using product name keywords.
// ============================================================

function correctCategory(name: string, csvCategory: string): string {
    const n = name.toLowerCase().trim();

    // ──────────────────────────────────────────────
    // 1. BEVERAGES — Tea, Coffee, Drinks, Juices
    // ──────────────────────────────────────────────
    if (
        /\b(tea|chai)\b/.test(n) && /\b(tata|wagh bakri|red label|brooke bond|lipton|taaza|society|premix|agni|gold|premium)\b/.test(n) ||
        /\b(tata agni|tata tea|tata gold|red label|wagh bakri|brooke bond|3 roses|taj mahal tea|society tea)\b/.test(n) ||
        /\b(coffee|nescafe|bru |sunrise)\b/.test(n) ||
        /\b(bournvita|horlicks|boost|complan|milo)\b/.test(n) ||
        /\b(tang|rasna|rooh afza|sharbat|squash)\b/.test(n) ||
        /\b(pepsi|coca cola|coke|sprite|fanta|limca|thumbs up|maaza|frooti|slice|appy|real juice|tropicana|paper boat)\b/.test(n) ||
        /\b(laxmi soda)\b/.test(n) ||
        /\b(cold drink|soft drink|energy drink|soda)\b/.test(n)
    ) {
        return 'Beverages';
    }

    // ──────────────────────────────────────────────
    // 2. HOUSEHOLD & CLEANING — Detergent, Cleaners, Mops, Brushes, Toilet, Phenyl
    // ──────────────────────────────────────────────
    if (
        /\b(toilet\s*brush|scrub\s*pad|scrubber|juna|loofah)\b/.test(n) ||
        /\b(phenyl|phynyl|lizol|domex|harpic|sanifresh|sani fresh|odonil|odo mos)\b/.test(n) ||
        /\b(surf excel|surf |rin |tide |ariel|nirma|fena|wheel|ezee|vanish)\b/.test(n) ||
        /\b(detergent|washing powder|fabric\s*(softener|conditioner)|comfort\s*(pink|green|blue))\b/.test(n) ||
        /\b(vim |exo |pril )\b/.test(n) ||
        /\b(dish\s*wash|dishwash|bartan)\b/.test(n) ||
        /\b(glass\s*cleaner|floor\s*cleaner|bathroom\s*cleaner|kitchen\s*cleaner|toilet\s*cleaner|all\s*purpose\s*cleaner)\b/.test(n) ||
        /\b(colin |trishul sparkle|mr\.?\s*muscle)\b/.test(n) ||
        /\b(gala\s+(angle|leader|double|diamond|clip|easy|dust|handel|mini|t\s*mop|twist))\b/.test(n) ||
        /\b(wiper|mop\b|broom|jhadoo|jhadu)\b/.test(n) ||
        /\b(spotzero)\b/.test(n) && /\b(cleaner|toilet|bathroom|floor|wiper|mop)\b/.test(n) === false && /\b(milton)\b/.test(n) ||
        /\b(safe\s*wash|safewash)\b/.test(n) ||
        /\b(rangoli\s*white)\b/.test(n) ||
        /\b(naphthalene|moth\s*ball|cockroach|hit |all out|good knight|mortein|baygon)\b/.test(n) ||
        /\b(air\s*freshener|room\s*freshener|oura )\b/.test(n) ||
        /\b(garbage\s*bag|dustbin|trash\s*bag)\b/.test(n) ||
        /\b(steel\s*wool|scotch\s*brite)\b/.test(n) ||
        /\b(use and throw paper)\b/.test(n)
    ) {
        return 'Household & Cleaning';
    }

    // Special: spotzero products are household cleaning
    if (/\bspotzero\b/.test(n)) {
        return 'Household & Cleaning';
    }

    // Gala products (mops, wipers, scrubbers) — all household
    if (/\bgala\b/.test(n) && /\b(wiper|mop|scrub|clip|loop|broom|brush|dust)\b/.test(n)) {
        return 'Household & Cleaning';
    }

    // ──────────────────────────────────────────────
    // 3. PERSONAL CARE & HEALTH — Shampoo, Soap, Hair, Skin, Hygiene, Medicine
    // ──────────────────────────────────────────────
    if (
        /\b(shampoo|conditioner|hair\s*(serum|oil|colour|color|cream|gel|wash|cleanser|care|fall))\b/.test(n) ||
        /\b(head\s*&\s*shoulders|head&shoulders|h&s)\b/.test(n) ||
        /\b(pantene|pantine|dove |tresemme|clinic\s*plus|sunsilk|indulekha|streax)\b/.test(n) ||
        /\b(dabur\s*(amla|vatika|anmol))\b/.test(n) ||
        /\b(parachute\s*(jasmine|coconut|advansed))\b/.test(n) && !/\b(cooking|edible)\b/.test(n) ||
        /\b(navratna|navratan|bajaj\s*(almond|coconut)|kesh\s*king|keshkanti|mamaearth|hair\s*&\s*care|hair&care)\b/.test(n) ||
        /\b(shanti\s*(vit|badam|oil))\b/.test(n) ||
        /\b(oxy\s*veda|super\s*vasmol)\b/.test(n) ||
        /\b(soap|handwash|hand\s*wash|sanitizer|dettol|lifebuoy|lux |cinthol|godrej\s*no\.?\s*1)\b/.test(n) ||
        /\b(body\s*(wash|lotion|spray)|face\s*(wash|cream)|moistur|sunscreen|vaseline)\b/.test(n) ||
        /\b(deodorant|deo |perfume|body\s*spray)\b/.test(n) ||
        /\b(park\s*avenue|old\s*spice|fogg |wildstone|denver |axe |nivea|set\s*wet|engage)\b/.test(n) ||
        /\b(toothpaste|toothbrush|colgate|pepsodent|closeup|oral\s*b|sensodyne|mouthwash|listerine)\b/.test(n) ||
        /\b(razor|blade|gillette|shaving|shave|after\s*shave|foam\s*(regular|lime|menthol))\b/.test(n) ||
        /\b(sanitary|pad |stayfree|whisper|tampon)\b/.test(n) ||
        /\b(lotion|cream|powder|talc|ponds|fair\s*&\s*lovely|garnier\s*color|prem\s*dulhan\s*hair\s*henna)\b/.test(n) && !/\b(masala|mirchi|haldi|halad|mirch|spice|food\s*colour)\b/.test(n) ||
        /\b(godrej\s*(selfie|black\s*cream|nupur))\b/.test(n) ||
        /\b(patanjali\s*(kesh|lodised|iodised))\b/.test(n) && /\b(salt)\b/.test(n) === false ||
        /\b(patanjali\s*kesh)\b/.test(n) ||
        /\b(lohana\s*(spray|luxury\s*agarbatti))\b/.test(n) && /\b(spray)\b/.test(n) ||
        /\b(streax\s*(gel|creme|blue|hair))\b/.test(n)
    ) {
        return 'Personal Care & Health';
    }

    // Old Spice is a deodorant brand, NOT spice
    if (/\bold\s*spice\b/.test(n)) {
        return 'Personal Care & Health';
    }

    // Garnier color is hair color, not food
    if (/\bgarnier\s*color\b/.test(n)) {
        return 'Personal Care & Health';
    }

    // Prem dulhan henna is personal care
    if (/\bprem\s*dulhan\b/.test(n)) {
        return 'Personal Care & Health';
    }

    // ──────────────────────────────────────────────
    // 4. DAIRY & FRESH — Milk, Paneer, Ghee, Curd, Butter, Cheese
    // ──────────────────────────────────────────────
    if (
        /\b(paneer|curd|dahi|yogurt|yoghurt|cheese|butter(?!\s*scotch)(?!\s*chicken))\b/.test(n) && !/\b(masala|rtc|mix)\b/.test(n) ||
        /\b(chitale\s*(paneer|tup|ghee|full\s*cream|shrikhand))\b/.test(n) ||
        /\b(amul\s*(butter|cheese|paneer|milk|ghee|curd|lassi|cream))\b/.test(n) ||
        /\b(gowardhan\s*(ghee|cow\s*ghee|paneer|milk|curd))\b/.test(n) ||
        /\b(prajot\s*cow\s*ghee)\b/.test(n) ||
        /\b(yashodhan\s*cow\s*ghee)\b/.test(n) ||
        /\b(dabar\s*(cow)?\s*ghee)\b/.test(n) ||
        /\b(lala\s*ji\s*desi\s*ghee)\b/.test(n) ||
        /\b(cow\s*ghee|desi\s*ghee|pure\s*ghee)\b/.test(n) ||
        /\b(fresh\s*(milk|cream))\b/.test(n) ||
        /\b(milk\s*(packet|pouch|full|toned|skim))\b/.test(n)
    ) {
        return 'Dairy & Fresh';
    }

    // ──────────────────────────────────────────────
    // 5. SPICES & MASALAS — All spice powders, whole spices, masala mixes, RTC masalas
    // ──────────────────────────────────────────────
    if (
        /\b(masala|mirchi\s*powder|halad\s*powder|haldi|dhane\s*powder|coriander\s*powder|garam\s*masala)\b/.test(n) ||
        /\b(jeera\s*powder|chaat\s*masala|kitchen\s*king|kichen\s*king|sambar\s*masala|pavbhaji|pav\s*bhaji)\b/.test(n) ||
        /\b(biryani\s*masala|chhole\s*masala|meat\s*masala|mutton\s*masala|chicken\s*masala|fish\s*curry)\b/.test(n) ||
        /\b(paneer\s*masala|sabji\s*masala|sabzi\s*masala|sandwich\s*masala)\b/.test(n) ||
        /\b(suhana\s+(ambari|super|sahi|shahi|kasoori|misal|paneer|chiken|chicken|sabji|biryani|mutton|fish|butter|palak|mutter|kaju|shev|pani|akkha|kitchen|pavbhaji|chhole|meat|kichen|egg|veg))\b/.test(n) ||
        /\b(suhana\s+spice\s*mix)\b/.test(n) ||
        /\b(catch\s+(chana|garam|dal|sabzi|rajama|chiken|chicken|briyani|chatpata|kichen|kitchen))\b/.test(n) ||
        /\b(ambari\s+(kanda|sunday|halad|mirchi|dhane|goda|bydagi|coriander|dhana))\b/.test(n) ||
        /\b(everest\s*(tasteeto|tikhalal|kitchen|masala|garam))\b/.test(n) ||
        /\b(ravimagic|ravi\s*magic)\b/.test(n) && /\b(masala|powder|tadka|coriander|halad|mirchi)\b/.test(n) ||
        /\b(kbm\s*butter\s*chicken)\b/.test(n) ||
        /\b(rbc\s*chicken\s*gravy)\b/.test(n) ||
        /\b(ram\s*bandhu|ram\s*bandu)\b/.test(n) && /\b(masala|rtc|paneer|palak)\b/.test(n) ||
        /\b(tiger\s*brand)\b/.test(n) && /\b(masala|rtc|briyani|pulav|tikka|dabeli|misal|kari)\b/.test(n) ||
        /\b(cookwell|cook\s*well)\b/.test(n) && /\b(masala|herbs|padta)\b/.test(n) ||
        /\b(khandeshi\s*khada\s*masala)\b/.test(n) ||
        /\b(super\s*garam\s*masala)\b/.test(n) ||
        /\b(rtc\b|ready\s*to\s*cook)\b/.test(n) && /\b(masala|mix|gravy)\b/.test(n) ||
        /\b(kashmiri\s*mitha)\b/.test(n) ||
        /\b(samadhan\s*chivada\s*masala)\b/.test(n) ||
        /\b(ravimagic\s*(chakali|sunday\s*special))\b/.test(n)
    ) {
        return 'Spices & Masalas';
    }

    // Whole spices — jeera, methi, hing, etc. — but only if not already matched above
    if (
        /\b(jeera|cumin|hing\b|asafoetida|methi\b|fenugreek)\b/.test(n) && !/\b(powder)\b/.test(n) ||
        /\b(naag\s*chap\s*hing)\b/.test(n) ||
        /\b(suhana\s*veg\s*kolhapur)\b/.test(n) ||
        /\b(suhana\s*kaju\s*curry)\b/.test(n) ||
        /\b(suhana\s*fish\s*fry)\b/.test(n) ||
        /\b(suhana\s*chicken\s*tandoori)\b/.test(n) ||
        /\b(suhana\s*butter\s*chicken)\b/.test(n) ||
        /\b(suhana\s*mushroom\s*masala)\b/.test(n) ||
        /\b(suhana\s*chicken\s*tikka)\b/.test(n) ||
        /\b(suhana\s*chicken\s*gravy)\b/.test(n) ||
        /\b(suhana\s*mutton\s*gravy)\b/.test(n) ||
        /\b(suhana\s*paneer\s*butter)\b/.test(n) ||
        /\b(suhana\s*mutter\s*paneer)\b/.test(n) ||
        /\b(suhana\s*shahi\s*paneer)\b/.test(n) ||
        /\b(suhana\s*palak\s*paneer)\b/.test(n) ||
        /\b(suhana\s*paneer\s*makhanwala)\b/.test(n) ||
        /\b(crystal\s*salt|topline\s*crystal)\b/.test(n) ||
        /\b(kala\s*namak)\b/.test(n) ||
        /\b(nasale|chatni|chutney)\b/.test(n) && !/\b(dhoop|dhup|agarbatti)\b/.test(n)
    ) {
        return 'Spices & Masalas';
    }

    // ──────────────────────────────────────────────
    // 6. STAPLES & COOKING ESSENTIALS — Atta, Dal, Rice, Oil, Sugar, Salt, Poha, Rava, Besan
    // ──────────────────────────────────────────────
    if (
        /\b(atta|wheat|gahu|aashirvaad|samarat?\s*(mp|chakki)|fortune\s*chakki)\b/.test(n) ||
        /\b(dal\b|daal\b|toor|moong|udid|masur|chana\s*dal|matki)\b/.test(n) && !/\b(masala|tadka|makhani|rtc)\b/.test(n) ||
        /\b(poha|pohaa)\b/.test(n) ||
        /\b(rava\b|rawa\b|sooji|suji|semolina)\b/.test(n) ||
        /\b(besan|beson|maida)\b/.test(n) ||
        /\b(rice\b|basmati|kolam|chawal)\b/.test(n) ||
        /\b(sugar\b|sakhar)\b/.test(n) && !/\b(khadi\s*sakhar)\b/.test(n) ||
        /\b(super\s*sugar\s*powder)\b/.test(n) ||
        /\b(fortune\s*sugar)\b/.test(n) ||
        /\b(tata\s*solt|tata\s*salt|patanjali\s*(lodised|iodised)\s*salt)\b/.test(n) ||
        /\b(salt\s*1kg|sendha\s*salt|rock\s*salt)\b/.test(n) ||
        /\b(soyabean\s*oil|soya\s*oil|sunflower\s*oil|mustard\s*oil|groundnut\s*oil|palm\s*oil|rice\s*bran|vanaspati|dalda)\b/.test(n) ||
        /\b(fortune\s*(sun\s*lite|soya|sunflower|rice\s*bran|groundnut|mustard|wheat))\b/.test(n) ||
        /\b(saffola\s*(gold|active|total))\b/.test(n) ||
        /\b(gemini\s*(soya|sunflower))\b/.test(n) ||
        /\b(khushbu\s*(soyabean|mustard|soya))\b/.test(n) ||
        /\b(independence\s*(soya|sunflower))\b/.test(n) ||
        /\b(swaraj\s*gold\s*soyabean)\b/.test(n) ||
        /\b(nimrani\s*soyabin)\b/.test(n) ||
        /\b(tiger\s*soya|tiger\s+soyabin)\b/.test(n) ||
        /\b(sunny\s*soya|sunny\s*sun\s*lite)\b/.test(n) ||
        /\b(samrat\s*(sunflower|soya|besan|sooji|rava|maida))\b/.test(n) ||
        /\b(radhuni\s*palm\s*oil)\b/.test(n) ||
        /\b(ruchi\s*vanaspati)\b/.test(n) ||
        /\b(sabudana|sago)\b/.test(n) ||
        /\b(rajgira)\b/.test(n) ||
        /\b(murmura)\b/.test(n) ||
        /\b(dhanadal|dhana\s*dal)\b/.test(n) ||
        /\b(dalchini)\b/.test(n) ||
        /\b(multi\s*grain\s*chakli)\b/.test(n) ||
        /\b(upwas\s*pith)\b/.test(n) ||
        /\b(food\s*colou?r|pushpak)\b/.test(n) ||
        /\b(soyabean\s*wadi|soya\s*wadi)\b/.test(n) ||
        /\b(fortune\s*beson|fortune\s*besan)\b/.test(n)
    ) {
        return 'Staples & Cooking Essentials';
    }

    // ──────────────────────────────────────────────
    // 7. SNACKS & PACKAGED FOODS — Biscuits, Chips, Namkeen, Noodles, Pickles, Instant
    // ──────────────────────────────────────────────
    if (
        /\b(biscuit|cookie|rusk|toast|cake\s*rusk)\b/.test(n) ||
        /\b(parle|britannia|sunfeast|oreo|bourbon|hide\s*&\s*seek|good\s*day|marie|monaco|50[\s-]*50|tiger\s*biscuit|krack\s*jack|milk\s*bikis|treat)\b/.test(n) && !/\b(masala|rtc|brand)\b/.test(n) ||
        /\b(chips|wafer|kurkure|lays|pringles|bingo|uncle\s*chips|balaji)\b/.test(n) ||
        /\b(namkeen|bhujia|haldiram|mixture|chivda|farsan|sev\b|gathiya)\b/.test(n) ||
        /\b(noodle|maggi|yippee|top\s*ramen|cup\s*noodle|pasta|macaroni)\b/.test(n) ||
        /\b(pickle|achar|loncha)\b/.test(n) ||
        /\b(mango\s*pickle|pravin\s*mango|gajgauri\s*mango|ram\s*bandu\s*mango|mother\s*receipe\s*mango|suhana\s*pravin)\b/.test(n) ||
        /\b(jam |jelly|marmalade|sauce|ketchup|mayonnaise|mayo)\b/.test(n) ||
        /\b(instant|ready\s*to\s*eat|rte\b)\b/.test(n) ||
        /\b(chocolate|cadbury|dairy\s*milk|kitkat|munch|five\s*star|gems|perk)\b/.test(n) ||
        /\b(banana\s*chips)\b/.test(n) ||
        /\b(papad|pappad|appalam)\b/.test(n) ||
        /\b(puja\s*badam)\b/.test(n) ||
        /\b(shanti\s*badam\s*oil)\b/.test(n) && false || // shanti badam oil is personal care, not snack
        /\b(bajaj\s*almond\s*drops)\b/.test(n) && false // bajaj almond is personal care
    ) {
        return 'Snacks & Packaged Foods';
    }

    // ──────────────────────────────────────────────
    // 8. PUJA NEEDS & GENERAL — Agarbatti, Dhoop, Camphor, Puja items, Stationery, General
    // ──────────────────────────────────────────────
    if (
        /\b(agarbatti|incense|dhoop|dhup|sambrani|loban|guggal|gugal|kapoor|camphor)\b/.test(n) ||
        /\b(lohana\s*(dhup|luxury))\b/.test(n) ||
        /\b(aroma\s*(pink|blue|yellow|orange|green)\s*dhup)\b/.test(n) ||
        /\b(mogara\s*dhup|chandan\s*dhup|kasturi\s*dhup|rose\s*dhup|pounds\s*dhup)\b/.test(n) ||
        /\b(managaldeep|mangaldeep|hem\s*festival)\b/.test(n) ||
        /\b(casper\s*natural\s*agarbatti|alaukik)\b/.test(n) ||
        /\b(puja|pooja|aarti|diya|wicks|vaat|nilanji)\b/.test(n) ||
        /\b(kumkum|sindoor|gulal|abir|akshat|havan)\b/.test(n) ||
        /\b(naral\b|supari\b)\b/.test(n) ||
        /\b(til\s*(gavran|prakash|black))\b/.test(n) && !/\b(oil)\b/.test(n) ||
        /\b(vilaychi|elaichi)\b/.test(n) && !/\b(masala|vikram)\b/.test(n) ||
        /\b(khas\s*khas|khaskhas)\b/.test(n) && /\b(bora\s*5\s*star)\b/.test(n) === false ||
        /\b(bora\s*5\s*star\s*khas\s*khas)\b/.test(n) ||
        /\b(kali\s*miri|kalimiri)\b/.test(n) && !/\b(powder)\b/.test(n) ||
        /\b(lavang|clove)\b/.test(n) && !/\b(powder|oil)\b/.test(n) ||
        /\b(jaayfal|jayfal|nutmeg)\b/.test(n) ||
        /\b(lalful|dagadful|starful)\b/.test(n) ||
        /\b(tejpan|bay\s*leaf)\b/.test(n) ||
        /\b(suntha|dry\s*ginger)\b/.test(n) ||
        /\b(ova\b|ajwain)\b/.test(n) && !/\b(powder)\b/.test(n) ||
        /\b(sauff|saunf|fennel)\b/.test(n) ||
        /\b(shajeere|shahajeere|shahjeera)\b/.test(n) ||
        /\b(sabja\s*bee|basil\s*seed)\b/.test(n) ||
        /\b(chia\s*seed)\b/.test(n) ||
        /\b(dink\b|gond\b)\b/.test(n) ||
        /\b(kurdai|khobra\s*kis|khobra\s*(250|500)?\s*gram)\b/.test(n) ||
        /\b(limbusatva|limbusatab|citric\s*acid)\b/.test(n) ||
        /\b(khadi\s*sakhar)\b/.test(n) ||
        /\b(magaj\b)\b/.test(n) ||
        /\b(byadagi\s*mirachi)\b/.test(n) && !/\b(powder)\b/.test(n) ||
        /\b(ajino\s*moto)\b/.test(n) ||
        /\b(futana|kale\s*wal)\b/.test(n) ||
        /\b(double\s*diamond)\b/.test(n) ||
        /\b(raj\s*shree)\b/.test(n) ||
        /\b(karala\b)\b/.test(n) && !/\b(chatni|chutney)\b/.test(n) ||
        /\b(kacchi\s*dabeli)\b/.test(n) ||
        /\b(cookwell\s*(butterscotch|pineapple|strawberry|vaniila|vanilla)\s*(essence|flavour))\b/.test(n) ||
        /\b(flying\s*birds)\b/.test(n) && /\b(essence|flavour)\b/.test(n) ||
        /\b(mahari\s*barik)\b/.test(n)
    ) {
        return 'Puja Needs & General';
    }

    // Stationery items — keep in Puja Needs & General (general store items)
    if (
        /\b(camel\s*(creative|art|drawing|oil\s*pastel|sago))\b/.test(n) ||
        /\b(apsara\s*(designer|funata|modeling))\b/.test(n) ||
        /\b(camlin|camline)\b/.test(n) && /\b(colour|pencil|eraser|marker|crayon)\b/.test(n)
    ) {
        return 'Puja Needs & General';
    }

    // ──────────────────────────────────────────────
    // ADDITIONAL SPECIFIC FIXES (catch-all for known mismatches)
    // ──────────────────────────────────────────────

    // Cooking oils wrongly in Personal Care, Beverages, or Puja Needs
    if (/\b(oil)\b/.test(n) && /\b(soya|sunflower|mustard|groundnut|palm|rice\s*bran|cooking|edible|vanaspati|dalda)\b/.test(n)) {
        return 'Staples & Cooking Essentials';
    }

    // Hair/body oils — personal care (parachute coconut, bajaj coconut, etc.)
    if (/\b(coconut\s*oil|almond\s*(drops|oil)|jasmine\s*(oil|190|90))\b/.test(n) && /\b(parachute|bajaj|dabur|navratna|navratan)\b/.test(n)) {
        return 'Personal Care & Health';
    }

    // GM 250gm — this appears to be a general item, keep in its CSV category
    // Rishabh gold — tea product
    if (/\brishabh\s*gold\b/.test(n)) {
        return 'Beverages';
    }

    // Vikram Elaichi — this is a spice (cardamom)
    if (/\bvikram\s*elaichi\b/.test(n)) {
        return 'Spices & Masalas';
    }

    // Suhana sheer khurma — dessert mix, keep in Snacks & Packaged Foods
    if (/\bsheer\s*khurma\b/.test(n)) {
        return 'Snacks & Packaged Foods';
    }

    // Tata jaggery — staples
    if (/\b(jaggery|gul|gud)\b/.test(n)) {
        return 'Staples & Cooking Essentials';
    }

    // Salt products that might slip through
    if (/\b(salt|solt|namak)\b/.test(n) && !/\b(kala\s*namak)\b/.test(n)) {
        return 'Staples & Cooking Essentials';
    }

    // Wheat (gahu) — staples
    if (/\b(gahu|wheat)\b/.test(n)) {
        return 'Staples & Cooking Essentials';
    }

    // Soyabean oil products
    if (/\b(soyabin|soyabean|soybean)\b/.test(n) && !/\b(wadi)\b/.test(n)) {
        return 'Staples & Cooking Essentials';
    }

    // ──────────────────────────────────────────────
    // FALLBACK: Clean up the CSV category name and return
    // ──────────────────────────────────────────────
    return cleanCategoryName(csvCategory);
}

// Normalize/clean category names from CSV
function cleanCategoryName(category: string): string {
    const cat = (category || 'Other').trim();
    const mapping: Record<string, string> = {
        'BABY CARE': 'Baby Care',
        'BAKERY| CAKES & DAIRY': 'Bakery & Dairy',
        'BEAUTY & HYGIENE': 'Beauty & Hygiene',
        'BEVERAGES': 'Beverages',
        'CLEANING & HOUSEHOLD': 'Household & Cleaning',
        'EGGS| MEAT & FISH': 'Eggs, Meat & Fish',
        'FOODGRAINS| OIL & MASALA': 'Foodgrains, Oil & Masala',
        'Manual Product': 'Other',
    };
    return mapping[cat] || cat;
}

// Format product name to title case for consistency
function formatProductName(name: string): string {
    if (!name) return 'Unknown Product';

    // Clean up encoding artifacts (Ã Â¥Â... sequences from garbled Unicode)
    let cleaned = name
        .replace(/Ã\s*Â¥Â[§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅ¦]+/g, '')  // Remove garbled chars
        .replace(/\s{2,}/g, ' ')  // Collapse multiple spaces
        .trim();

    // Title case: capitalize first letter of each word
    cleaned = cleaned
        .split(' ')
        .map(word => {
            if (word.length === 0) return word;
            // Keep units/weights lowercase: gm, kg, ml, l, ltr, litre
            if (/^(gm|gms|kg|kgs|ml|ltr|litre|litres)$/i.test(word)) {
                return word.toLowerCase();
            }
            // Keep small words lowercase unless first word
            if (/^(and|or|of|in|for|the|a|an|with|to|&)$/i.test(word)) {
                return word.toLowerCase();
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');

    // Ensure first character is uppercase
    if (cleaned.length > 0) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    return cleaned;
}

export async function importGmartProducts(csvContent: string): Promise<{
    success: boolean;
    totalInCSV: number;
    imported: number;
    categories: string[];
    categoryCounts?: Record<string, number>;
    providerId?: string;
    providerName?: string;
    error?: string;
}> {
    try {
        console.log('[GMart Import] Starting import...');

        // Parse CSV with error handling
        let records: CSVProduct[];
        try {
            records = parse(csvContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                relax_column_count: true, // Handle malformed CSV rows gracefully
                relax_quotes: true, // Handle bad quotes
            });
        } catch (parseError: any) {
            console.error('[GMart Import] CSV Parse Error:', parseError.message);
            return {
                success: false,
                totalInCSV: 0,
                imported: 0,
                categories: [],
                error: `CSV parsing failed: ${parseError.message}`
            };
        }

        console.log(`[GMart Import] Found ${records.length} products in CSV`);

        // Get GMart provider (grocery category)
        const groceryCategory = await db.query.serviceCategories.findFirst({
            where: eq(serviceCategories.slug, 'grocery'),
        });

        if (!groceryCategory) {
            console.warn('[GMart Import] Grocery category not found.');
            return {
                success: false,
                totalInCSV: records.length,
                imported: 0,
                categories: [],
                error: 'Grocery category not found. Please seed the database first.'
            };
        }

        // Get GMart provider
        const gmartProvider = await db.query.serviceProviders.findFirst({
            where: eq(serviceProviders.categoryId, groceryCategory.id),
        });

        if (!gmartProvider) {
            console.warn('[GMart Import] GMart provider not found.');
            return {
                success: false,
                totalInCSV: records.length,
                imported: 0,
                categories: [],
                error: 'GMart provider not found. Please create a grocery store provider first.'
            };
        }

        const providerId = gmartProvider.id;
        console.log(`[GMart Import] Using provider: ${gmartProvider.businessName} (ID: ${providerId})`);

        // Delete existing products for this provider
        console.log('[GMart Import] Clearing existing products...');
        try {
            await db.delete(groceryProducts).where(eq(groceryProducts.providerId, providerId));
        } catch (deleteError: any) {
            console.error('[GMart Import] Delete Error:', deleteError.message);
            // Continue anyway, products might not exist yet
        }

        // Track category corrections for logging
        let corrections = 0;

        // Filter and transform products
        const productsToInsert = records
            .filter((row) => {
                // Skip empty rows or rows with no name
                if (!row || !row.Name || row.Name.trim() === '') return false;
                // Skip rows with 0 or negative selling price
                const price = parseFloat(row['Selling Price'] || row.MRP || '0');
                if (isNaN(price) || price <= 0) return false;
                // Skip rows with negative quantity (returns/adjustments)
                const qty = parseInt(row.Quantity || '0', 10);
                if (qty < 0) return false;
                return true;
            })
            .map((row) => {
                const mrpValue = parseFloat(row.MRP || '0');
                const mrp = !isNaN(mrpValue) && mrpValue > 0 ? mrpValue.toString() : null;

                const sellingPriceValue = parseFloat(row['Selling Price'] || '0');
                const sellingPrice = !isNaN(sellingPriceValue) && sellingPriceValue > 0
                    ? sellingPriceValue.toString()
                    : (mrp || '0');

                const quantity = parseInt(row.Quantity || '0', 10);
                const stockQty = !isNaN(quantity) && quantity > 0 ? quantity : 0;

                const productName = formatProductName(row.Name);
                const csvCategory = (row.Category || 'Other').trim();
                const correctedCategory = correctCategory(row.Name, csvCategory);

                if (correctedCategory !== csvCategory) {
                    corrections++;
                    // Log first 20 corrections for debugging
                    if (corrections <= 20) {
                        console.log(`[GMart Import] Category fix: "${row.Name}" | ${csvCategory} → ${correctedCategory}`);
                    }
                }

                return {
                    providerId,
                    name: productName.substring(0, 250),
                    description: null,
                    category: correctedCategory,
                    brand: null, // New CSV doesn't have brand column
                    price: sellingPrice,
                    mrp: mrp,
                    weight: row.UOM && row.UOM !== '-' ? row.UOM.trim().substring(0, 100) : null,
                    unit: null,
                    inStock: stockQty > 0,
                    stockQuantity: stockQty,
                    imageUrl: row['Image Url'] ? row['Image Url'].trim().substring(0, 500) : null,
                };
            });

        console.log(`[GMart Import] Inserting ${productsToInsert.length} valid products (${corrections} category corrections)...`);

        if (productsToInsert.length === 0) {
            return {
                success: true,
                totalInCSV: records.length,
                imported: 0,
                categories: [],
                providerId,
                providerName: gmartProvider.businessName,
            };
        }

        // Insert in batches of 50 with error handling per batch
        const batchSize = 50;
        let inserted = 0;
        let failedBatches = 0;

        for (let i = 0; i < productsToInsert.length; i += batchSize) {
            const batch = productsToInsert.slice(i, i + batchSize);
            try {
                await db.insert(groceryProducts).values(batch);
                inserted += batch.length;
                if (i % 500 === 0 || i + batchSize >= productsToInsert.length) {
                    console.log(`[GMart Import] Inserted ${inserted}/${productsToInsert.length} products`);
                }
            } catch (batchError: any) {
                failedBatches++;
                console.error(`[GMart Import] Batch ${Math.floor(i / batchSize) + 1} failed:`, batchError.message);
                // Continue with next batch instead of crashing
            }
        }

        console.log(`[GMart Import] ✅ Import complete! ${inserted} inserted, ${failedBatches} batches failed, ${corrections} categories corrected`);

        // Get unique categories and counts for summary
        const categoryCounts: Record<string, number> = {};
        productsToInsert.forEach((p) => {
            categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
        });
        const categories = Object.keys(categoryCounts).sort();

        return {
            success: true,
            totalInCSV: records.length,
            imported: inserted,
            categories,
            categoryCounts,
            providerId,
            providerName: gmartProvider.businessName,
        };

    } catch (error: any) {
        console.error('[GMart Import] Unexpected error:', error.message);
        return {
            success: false,
            totalInCSV: 0,
            imported: 0,
            categories: [],
            error: error.message || 'Unexpected error during import'
        };
    }
}
