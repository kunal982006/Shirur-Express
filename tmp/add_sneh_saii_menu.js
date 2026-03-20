
import pkg from 'pg';
const { Client } = pkg;
import { createId } from "@paralleldrive/cuid2";

const databaseUrl = "postgresql://neondb_owner:npg_kuxGK30bPtfv@ep-little-rice-a1lrthg1-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// IDs found for Sneh and Saii
const providerIds = ["r078e4l5r66rry01pi8d1v", "vvahx703oxsd24t0iyvbvj"];

const menu = [
    // Hair Treatment (Section: Hair, subCategory: Treatment)
    { name: "Keratin Treatment", section: "Hair", subCategory: "Treatment", price: "4000" },
    
    // Missing prices for (Rebonding, Smoothing, Botox, Nanoplastia, Kerasmooth, Aqua)
    
    // Facial & Skin Treatments (Section: Skincare, subCategory: Facials)
    { name: "Face Cleanup", section: "Skincare", subCategory: "Facial & Skin", price: "350" },
    { name: "Face D-Tan", section: "Skincare", subCategory: "Facial & Skin", price: "200" },
    { name: "Fruit Facial (Regular)", section: "Skincare", subCategory: "Facial & Skin", price: "500" },
    { name: "Acne/Skin Treatment", section: "Skincare", subCategory: "Facial & Skin", price: "1500" },
    { name: "Pigmentation Treatment", section: "Skincare", subCategory: "Facial & Skin", price: "1500" },
    { name: "Anti-Aging Facial", section: "Skincare", subCategory: "Facial & Skin", price: "2000" },
    { name: "Glow Facial Kit", section: "Skincare", subCategory: "Facial & Skin", price: "2500" },
    { name: "Glass Glow / BB Glow", section: "Skincare", subCategory: "Facial & Skin", price: "2500" },
    { name: "Fire & Ice Facial", section: "Skincare", subCategory: "Facial & Skin", price: "1500" },
    { name: "HydraFacial", section: "Skincare", subCategory: "Facial & Skin", price: "1500" },
    { name: "Medi-Facial", section: "Skincare", subCategory: "Facial & Skin", price: "1000" },
    { name: "Diamond Facial", section: "Skincare", subCategory: "Facial & Skin", price: "800" },
    { name: "Bridal Facial", section: "Skincare", subCategory: "Facial & Skin", price: "1500" },
    { name: "O3+ Facial", section: "Skincare", subCategory: "Facial & Skin", price: "1500" },
    { name: "Whitening Facial", section: "Skincare", subCategory: "Facial & Skin", price: "800" },
    { name: "Pearl Facial", section: "Skincare", subCategory: "Facial & Skin", price: "600" },
    { name: "Gold Facial", section: "Skincare", subCategory: "Facial & Skin", price: "500" },
    { name: "Papaya Facial", section: "Skincare", subCategory: "Facial & Skin", price: "400" },
    { name: "Potli Facial", section: "Skincare", subCategory: "Facial & Skin", price: "2000" },

    // Hair Cut Menu (Section: Hair, subCategory: Hair Cut)
    { name: "Feather Cut", section: "Hair", subCategory: "Hair Cut", price: "300" },
    { name: "Step Cut", section: "Hair", subCategory: "Hair Cut", price: "350" },
    { name: "V-Cut", section: "Hair", subCategory: "Hair Cut", price: "150" },
    { name: "Bob Cut", section: "Hair", subCategory: "Hair Cut", price: "100" },
    { name: "Wolf Cut", section: "Hair", subCategory: "Hair Cut", price: "100" },
    { name: "Straight Layer Cut", section: "Hair", subCategory: "Hair Cut", price: "300" },
    { name: "Round Hair Cut", section: "Hair", subCategory: "Hair Cut", price: "100" },
    { name: "U-Shape Hair Cut", section: "Hair", subCategory: "Hair Cut", price: "100" },
    { name: "Layer Hair Cut", section: "Hair", subCategory: "Hair Cut", price: "250" },
    { name: "Blunt Cut", section: "Hair", subCategory: "Hair Cut", price: "100" },
    { name: "Mushroom Cut", section: "Hair", subCategory: "Hair Cut", price: "100" },
    { name: "Advance Hair Cut", section: "Hair", subCategory: "Hair Cut", price: "350" },

    // Waxing Services (Section: Waxing, subCategory: Services)
    { name: "Forehead Wax", section: "Waxing", subCategory: "Services", price: "80" },
    { name: "Lower Lip Wax", section: "Waxing", subCategory: "Services", price: "50" },
    { name: "Upper Lip Wax", section: "Waxing", subCategory: "Services", price: "50" },
    { name: "Underarms Waxing", section: "Waxing", subCategory: "Services", price: "150" },
    { name: "Full Legs / Half Legs Waxing", section: "Waxing", subCategory: "Services", price: "450" },
    { name: "Full Arms / Half Arms Waxing", section: "Waxing", subCategory: "Services", price: "300" },
    { name: "Full Body Waxing", section: "Waxing", subCategory: "Services", price: "2000" },
    { name: "Face Wax", section: "Waxing", subCategory: "Services", price: "400" },
];

async function run() {
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    
    try {
        for (const providerId of providerIds) {
            console.log(`Processing provider: ${providerId}`);
            for (const item of menu) {
                const id = createId();
                await client.query(
                    `INSERT INTO service_offerings (id, provider_id, name, section, sub_category, price, is_active) 
                     VALUES ($1, $2, $3, $4, $5, $6, true)`,
                    [id, providerId, item.name, item.section, item.subCategory, item.price]
                );
            }
        }
        console.log("Successfully added menu items for both providers.");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

run();
