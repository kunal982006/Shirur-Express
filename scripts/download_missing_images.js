
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const images = [
    { name: 'fried_rice', url: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Schezwan_Fried_Rice.jpg' },
    { name: 'manchurian', url: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Gobi_Manchurian_Dry.jpg' },
    { name: 'cold_coffee', url: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Cold_coffee.jpg' },
    { name: 'pav_bhaji', url: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Pav_Bhaji_in_Mumbai.jpg' }, // Wikimedia for Pav Bhaji too
];

const targetDir = path.resolve(__dirname, '../client/public/images/menu-items');

async function downloadImage(url, filename) {
    const filePath = path.join(targetDir, filename);
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        fs.writeFileSync(filePath, response.data);
        console.log(`Downloaded: ${filename}`);
    } catch (error) {
        console.error(`Failed to download ${filename}: ${error.message}`);
    }
}

async function main() {
    console.log(`Downloading ${images.length} missing images...`);
    for (const img of images) {
        await downloadImage(img.url, `${img.name}.jpg`);
    }
}

main();
