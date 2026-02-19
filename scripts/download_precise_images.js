
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Specific images to fix the "Paneer Pizza -> Paneer Curry" issue
const images = [
    // PIZZAS
    { name: 'paneer_pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'chicken_pizza', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }, // Use generic pizza or find specific
    { name: 'veg_pizza', url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },

    // DRINKS / DESSERTS
    { name: 'mango_mastani', url: 'https://images.unsplash.com/photo-1628186745112-706d91361c3c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }, // Mango shake/drink
    { name: 'chocolate_shake', url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'cold_coffee', url: 'https://images.unsplash.com/photo-1517701604599-bb29b5c7dd90?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'fruit_juice', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },

    // CHINESE
    { name: 'fried_rice', url: 'https://images.unsplash.com/photo-1603133872878-684f10842619?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'manchurian', url: 'https://images.unsplash.com/photo-1626804475297-411dbcc6f6c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }, // Re-using chinese starter or finding distinct
    { name: 'hakka_noodles', url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },

    // SNACKS
    { name: 'pav_bhaji', url: 'https://images.unsplash.com/photo-1606491956689-2ea28c674675?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'bhel_puri', url: 'https://images.unsplash.com/photo-1617424269411-bd38cd772863?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }, // Chat representative
];

const targetDir = path.resolve(__dirname, '../client/public/images/menu-items');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

async function downloadImage(url, filename) {
    const filePath = path.join(targetDir, filename);

    // We overwrite to ensure we have the correct image
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        fs.writeFileSync(filePath, response.data);
        console.log(`Downloaded: ${filename}`);

    } catch (error) {
        console.error(`Failed to download ${filename}: ${error.message}`);
    }
}

async function main() {
    console.log(`Downloading ${images.length} specific images...`);
    for (const img of images) {
        await downloadImage(img.url, `${img.name}.jpg`);
    }
    console.log("Download complete.");
}

main();
