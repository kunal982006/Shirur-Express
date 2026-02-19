
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generic high-quality images for broad categories
const images = [
    // Existing popularity ones (keep ensuring they exist)
    { name: 'chicken_curry', url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'mutton_curry', url: 'https://images.unsplash.com/photo-1585937421612-70a008356f36?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }, // Rogan josh style
    { name: 'paneer_dish', url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }, // Palak paneer/Generic
    { name: 'veg_curry', url: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }, // Mix veg
    { name: 'pizza', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'sandwich', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'fries', url: 'https://images.unsplash.com/photo-1573080496987-aeb77b809875?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'milkshake', url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'coffee', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'noodles', url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'chinese_starter', url: 'https://images.unsplash.com/photo-1626804475297-411dbcc6f6c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }, // Manchurian/Chilli
    { name: 'thali', url: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }, // Using chole bhature style or search for thali 
    // Actual Thali: https://images.unsplash.com/photo-1630409351241-e90e7f5e4785 (Thali)
    { name: 'indian_thali', url: 'https://images.unsplash.com/photo-1630409351241-e90e7f5e4785?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'paratha', url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'egg_curry', url: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'rice_dish', url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }, // Fried rice / Pulav
    { name: 'pasta', url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'soup', url: 'https://images.unsplash.com/photo-1547592166-23acbe346499?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'salad', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'dessert', url: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }, // Cake/Pastry
];

const targetDir = path.resolve(__dirname, '../client/public/images/menu-items');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

async function downloadImage(url, filename) {
    const filePath = path.join(targetDir, filename);
    // Skip if already exists? No, overwrite to ensure quality.

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
        console.log(`Downloaded: ${filename} (${response.data.length} bytes)`);

    } catch (error) {
        console.error(`Failed to download ${filename}: ${error.message}`);
    }
}

async function main() {
    console.log(`Downloading ${images.length} category images to ${targetDir}...`);
    for (const img of images) {
        await downloadImage(img.url, `${img.name}.jpg`);
    }
    console.log("Done.");
}

main();
