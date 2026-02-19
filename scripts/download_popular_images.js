
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Using a mix of direct and source URLs to see what works best.
// The key is to get valid image data.

const images = [
    { name: 'vada_pav', url: 'https://images.unsplash.com/photo-1668236543090-d4761527d128?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'misal_pav', url: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'samosa', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'pani_puri', url: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'chicken_biryani', url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'butter_chicken', url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'paneer_tikka', url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'chole_bhature', url: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'momos', url: 'https://images.unsplash.com/photo-1619860860774-1e2e1737e342?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'gulab_jamun', url: 'https://images.unsplash.com/photo-1593701461250-d7162f1dd72c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
];

const targetDir = path.resolve(__dirname, '../client/public/images/menu-items');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

async function downloadImage(url, filename) {
    const filePath = path.join(targetDir, filename);

    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer', // Better for binary data
            headers: {
                'User-Agent': 'Mozilla/5.0' // Mock browser
            }
        });

        fs.writeFileSync(filePath, response.data);
        console.log(`Downloaded: ${filename} (${response.data.length} bytes)`);

    } catch (error) {
        console.error(`Failed to download ${filename}: ${error.message}`);
    }
}

async function main() {
    console.log(`Downloading ${images.length} images to ${targetDir}...`);
    for (const img of images) {
        await downloadImage(img.url, `${img.name}.jpg`);
    }
    console.log("Done.");
}

main();
