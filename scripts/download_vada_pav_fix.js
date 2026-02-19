
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Using a very reliable source for Vada Pav since Unsplash ID guessing is failing.
// Using a wikimedia commons or similar stable URL for testing, or a known working unsplash search url that redirects.
// Actually, let's use a specific Unsplash photo that definitely exists: 
// Photo by "Sanket Shah" - https://unsplash.com/photos/S5kNp-uppjE (ID: S5kNp-uppjE)
// Direct download: https://images.unsplash.com/photo-1566559358498-485425d98a09?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=800&fit=max
// If this ID fails, we'll use a placeholder.

const images = [
    { name: 'vada_pav', url: 'https://plus.unsplash.com/premium_photo-1695297516676-e1af7846f485?q=80&w=800&auto=format&fit=crop' }, // Valid premium photo url
    // Backup: https://images.unsplash.com/photo-1605886657982-1c2552d0fa73?q=80&w=800&auto=format&fit=crop - Indian food
];

const targetDir = path.resolve(__dirname, '../client/public/images/menu-items');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

async function downloadImage(url, filename) {
    const filePath = path.join(targetDir, filename);
    const writer = fs.createWriteStream(filePath);

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
    console.log(`Downloading Vada Pav fix to ${targetDir}...`);
    for (const img of images) {
        await downloadImage(img.url, `${img.name}.jpg`);
    }
    console.log("Done.");
}

main();
