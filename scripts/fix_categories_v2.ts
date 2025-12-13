
import { db } from "../server/db";
import { groceryProducts } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const mappings: Record<string, string> = {
    // Air Freshener
    "AIR FRESHNAR": "AIR FRESHENER",
    "AIR FRESHNER": "AIR FRESHENER",
    "ROOM FRESHNER": "AIR FRESHENER",
    "ODONIL": "AIR FRESHENER",

    // Baby
    "BABY CARE": "BABY CARE",
    "BABY PRODUCTS": "BABY CARE",
    "BABY SOAP": "BABY CARE",
    "BABY OIL": "BABY CARE",

    // Bath
    "BATH SOAP": "SOAPS",
    "BATHING SOAP": "SOAPS",
    "SOAP": "SOAPS",
    "MEDIMIX": "SOAPS",
    "HAND WASH": "HAND WASH",

    // Breakfast
    "BREKFAST": "BREAKFAST CEREALS",
    "BREAKFAST C": "BREAKFAST CEREALS",
    "BREAKFAST": "BREAKFAST CEREALS",
    "CORN FLAKES": "BREAKFAST CEREALS",
    "OATS": "BREAKFAST CEREALS",

    // Chocolates
    "CAD. CHOCOLATE": "CHOCOLATES",
    "CADBURY": "CHOCOLATES",
    "CANDY": "CHOCOLATES", // Maybe? Or Confectionery. Let's group for now.
    "CHOCOLATE POWDER": "CHOCOLATES",
    "GEMS": "CHOCOLATES",
    "NUTELLA": "CHOCOLATES",
    "KINDER JOY": "CHOCOLATES",

    // Cleaning
    "CLEANING EQUIPMENTS": "CLEANING",
    "CLENING EQUIPMENTS": "CLEANING",
    "CLENNING EQUIPMENTS": "CLEANING",
    "CLENING POWDER": "CLEANING",
    "CLENNING": "CLEANING",
    "CLINING GEL": "CLEANING",
    "CLEANING MATERIAL": "CLEANING",
    "DETERGEN": "DETERGENT",
    "DETERGENT": "DETERGENT",
    "DISHWASH": "DISHWASH",
    "DISHWASH BAR": "DISHWASH",
    "PHENYL": "CLEANING",
    "FLOOR CLEANER": "CLEANING",

    // Cosmetics
    "COSMATIC": "COSMETICS",
    "COSMATICS": "COSMETICS",
    "COSMETIC": "COSMETICS",
    "MAKEUP": "COSMETICS",
    "FACE POWDER": "COSMETICS",
    "FACE CARE": "SKIN CARE", // Merge face into skin care
    "FACE SCRUB": "SKIN CARE",
    "FACE WASH": "SKIN CARE",
    "BODY LOTION": "SKIN CARE",
    "BODY SPRAY": "DEODORANTS",
    "DEO": "DEODORANTS",
    "PERFUME": "PERFUMES", // Keep separate or merge? Let's keep distinct but correct spelling.

    // Dairy
    "DAIRY PRODUCT": "DAIRY",
    "COW MILK": "DAIRY",
    "FLAVOURED MILK": "DAIRY",
    "CHEESE": "DAIRY",
    "PANEER": "DAIRY",
    "BUTTER": "DAIRY",
    "GHEE": "GHEE", // Keep Ghee separate usually in India

    // Diapers
    "DIAPER": "DIAPERS",
    "DIPER": "DIAPERS",

    // Dry Fruits
    "DRY FRUIT": "DRY FRUITS",
    "DRYFRUIT": "DRY FRUITS",
    "DRYFRUITS": "DRY FRUITS",
    "KAJU": "DRY FRUITS",
    "BADAM": "DRY FRUITS",
    "PISTA": "DRY FRUITS",
    "MANUKA": "DRY FRUITS",
    "KALI MANUKA": "DRY FRUITS",
    "KHOBRA": "DRY FRUITS",
    "DATES": "DRY FRUITS",
    "ANJEER": "DRY FRUITS",
    "CHAROLI": "DRY FRUITS",

    // Food/Staples
    "GROSAARY": "STAPLES",
    "GROSSARY": "STAPLES",
    "GRAINS": "STAPLES",
    "ATTA": "FLOURS",
    "MAIDA": "FLOURS",
    "RAWA": "FLOURS",
    "BESAN": "FLOURS",
    "SOOJI RAWA": "FLOURS",
    "RICE": "RICE",
    "WHEAT": "WHEAT",
    "DAL": "PULSES",
    "PULSES": "PULSES",
    "TOOR DAL": "PULSES",
    "MOONG DAL": "PULSES",
    "URAD DAL": "PULSES",
    "CHANA DAL": "PULSES",
    "MASUR DAL": "PULSES",
    "UDAD DAL": "PULSES",
    "MATKI": "PULSES",
    "CHAVLI": "PULSES",
    "WATANA": "PULSES",
    "HULAGA": "PULSES",
    "HARBARA": "PULSES",
    "MOONG": "PULSES",
    "MASUR": "PULSES",
    "RAJGEERA": "PULSES", // Actually a grain/seed but okay
    "JAVAS": "PULSES",

    // Hair
    "HAIR WASH": "HAIR CARE",
    "SHAMPOO": "HAIR CARE",
    "HAIR OIL": "HAIR CARE",
    "HAIR COLOUR": "HAIR CARE",
    "HAIR-CARE": "HAIR CARE",

    // Ketchup/Sauces
    "KETCHUP": "SAUCES",
    "TOMATO KETHUP": "SAUCES",
    "MAYONNAISE": "SAUCES", // Group under Sauces & Spreads?
    "MAYONNIS": "SAUCES",
    "MAYYONIS": "SAUCES",
    "JAM": "SAUCES", // Or SPREADS
    "FRUIT JAM": "SAUCES",
    "P.BUTTER": "SAUCES",
    "SCHEZWAN CHUTNEY": "SAUCES",

    // Masala/Spices
    "MASALA": "SPICES",
    "MASALE": "SPICES",
    "CHILLI POWDER": "SPICES",
    "HALAD POWDER": "SPICES",
    "JEERA": "SPICES",
    "MOHARI": "SPICES",
    "DHANA": "SPICES",
    "METHI": "SPICES",
    "HING": "SPICES",
    "KASURI METHI": "SPICES",
    "KHASKHAS": "SPICES",
    "LAVANG": "SPICES",
    "MIRE": "SPICES",
    "KALI MIRI": "SPICES",
    "DALCHINI": "SPICES",
    "JAAYFAL": "SPICES",
    "DAGADFUL": "SPICES",
    "TAMALPATRA": "SPICES",
    "VELCHI": "SPICES",
    "VILAYCHI": "SPICES",
    "SAUF": "SPICES",
    "OVA": "SPICES",
    "BADISHOP": "SPICES",

    // Mosquito
    "MOSKITO KILLER": "REPELLENTS",
    "MOSQUITO KILLER": "REPELLENTS",
    "MOSQUITOES KILLER": "REPELLENTS",
    "GOOD NIGHT": "REPELLENTS",
    "ALL OUT": "REPELLENTS",

    // Noodles
    "NOODLE": "NOODLES",
    "MAGGI": "NOODLES",
    "PASTA": "NOODLES",
    "SEVIYAN": "NOODLES", // Vermicelli

    // Papad
    "PAPED": "PAPAD",

    // Pooja
    "POOJA PATH": "POOJA NEEDS",
    "POOJA SAHITYA": "POOJA NEEDS",
    "POOJA-PATH": "POOJA NEEDS",
    "PUJA SAMGRI": "POOJA NEEDS",
    "AGARBATTI": "POOJA NEEDS",
    "KAPUR": "POOJA NEEDS",
    "RANGOLI": "POOJA NEEDS",

    // Processed Food
    "PROCESS FOOD": "PROCESSED FOOD",
    "PEOCESS FOOD": "PROCESSED FOOD",
    "READY TO MIX": "PROCESSED FOOD",
    "REDY TO MIX": "PROCESSED FOOD",
    "INSTANT MIX": "PROCESSED FOOD",
    "GULABJAM": "PROCESSED FOOD", // Mix probably
    "DHOKLA SODA": "PROCESSED FOOD",
    "BAKING POWDER": "PROCESSED FOOD",
    "CUSTARD POWDER": "PROCESSED FOOD",
    "FOOD CLOUR": "PROCESSED FOOD",
    "ESSENCE": "PROCESSED FOOD",
    "YEAST": "PROCESSED FOOD",
    "VINEGAR": "PROCESSED FOOD",
    "SOYA CHUNKS": "PROCESSED FOOD",
    "SOYABIN": "PROCESSED FOOD",

    // Sanitary
    "SANITARY": "SANITARY PADS",
    "SANATARY PADS": "SANITARY PADS",
    "WHISPER": "SANITARY PADS",
    "STAYFREE": "SANITARY PADS",

    // Snacks
    "FARSAN": "SNACKS",
    "CHIPS": "SNACKS",
    "KURKURE": "SNACKS",
    "FRYUMS": "SNACKS",
    "BHAKARWADI": "SNACKS",
    "CHAKLALI": "SNACKS",
    "SHEV": "SNACKS",
    "CHIVADA": "SNACKS",
    "POHA": "SNACKS", // Poha is often breakfast but sold as raw snack item? Or Flattened Rice. Let's keep POHA separate actually? No, user probably put it in Snacks. Let's map raw POHA to POHA. The truncated output saw POHA (21). Better keep POHA or FLATTENED RICE. Let's leave POHA or map to BREAKFAST CEREALS? Poha is a staple. Let's map to POHA for now but fix duplicates if any. 
    "MAKA POHA": "SNACKS",

    // Tea
    "TEA POWDER": "TEA",
    "TEA & COFFEE": "TEA", // Simplify to TEA? Or BEVERAGES? "TEA & COFFEE" is fine.
    // Let's stick to TEA & COFFEE as per previous fix, it's a good category.

    // Sugar
    "SUGAR POWDER": "SUGAR",
    "GUL": "JAGGERY",
    "JAGGERY": "JAGGERY",
    "KHADI SAKHAR": "SUGAR",

    // Misc
    "SALT": "SALT", // is useful
    "LED BULB": "ELECTRICALS",
    "BULB": "ELECTRICALS",
    "BATTERY": "ELECTRICALS",
};

async function fixCategoriesV2() {
    console.log("Starting Round 2 normalization...");

    for (const [bad, good] of Object.entries(mappings)) {
        const result = await db.update(groceryProducts)
            .set({ category: good })
            .where(eq(groceryProducts.category, bad))
            .returning();

        if (result.length > 0) {
            console.log(`Fixed '${bad}' -> '${good}' (${result.length} items)`);
        }
    }
    console.log("Round 2 Done.");
    process.exit(0);
}

fixCategoriesV2().catch(console.error);
