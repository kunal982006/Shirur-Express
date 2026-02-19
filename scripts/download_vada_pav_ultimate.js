
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Wikimedia Commons is reliable and allows hotlinking/download. 
// Vada Pav image: https://upload.wikimedia.org/wikipedia/commons/4/4e/Vada_Pav-Indian_street_food.JPG

const images = [
    { name: 'vada_pav', url: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Vada_Pav-Indian_street_food.JPG' },
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
    console.log(`Downloading Vada Pav Ultimate Fix to ${targetDir}...`);
    for (const img of images) {
        await downloadImage(img.url, `${img.name}.jpg`);
    }
    console.log("Done.");
}

main();
