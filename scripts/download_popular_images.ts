
import fs from 'fs';
import path from 'path';
import https from 'https';

const images = [
    { name: 'vada_pav', url: 'https://images.unsplash.com/photo-1668236543090-d4761527d128' }, // Vada Pav
    { name: 'misal_pav', url: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027' }, // Misal Pav
    { name: 'samosa', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950' }, // Samosa
    { name: 'pani_puri', url: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7' }, // Pani Puri
    { name: 'chicken_biryani', url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0' }, // Chicken Biryani
    { name: 'butter_chicken', url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398' }, // Butter Chicken
    { name: 'paneer_tikka', url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8' }, // Paneer Tikka
    { name: 'chole_bhature', url: 'https://images.unsplash.com/photo-1626074353765-517a681e40be' }, // Chole Bhature
    { name: 'momos', url: 'https://images.unsplash.com/photo-1619860860774-1e2e1737e342' }, // Momos
    { name: 'gulab_jamun', url: 'https://images.unsplash.com/photo-1593701461250-d7162f1dd72c' }, // Gulab Jamun
];

const targetDir = path.resolve(__dirname, '../client/public/images/menu-items');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

async function downloadImage(url: string, filename: string) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(path.join(targetDir, filename));
        // Add random query param to ensure we get an image file, not the html page if it's a direct unsplash link behavior varies
        // Actually, for unsplash source api it's better. converting to source.unsplash.com pattern or using the direct download link if possible.
        // Let's use the provided photo IDs to construct a source URL which usually redirects to a downloadable image
        // Format: https://source.unsplash.com/[ID]/800x600  <- Deprecated? 
        // Let's try appending /download?force=true to the photo URL or just use the photo URL and hope it redirects? 
        // No, scraping html is bad. 
        // Better strategy: Use the specific "source.unsplash.com" format or valid direct ID based URL: https://images.unsplash.com/photo-[ID]?ixlib=rb-4.0.3&q=80&w=800&auto=format
        // The URLs I have are: https://images.unsplash.com/photo-1668236543090-d4761527d128
        // We can append parameters to resize.

        const directUrl = `${url}?ixlib=rb-4.0.3&q=85&w=800&auto=format&fit=crop`;

        https.get(directUrl, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}, status code: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded: ${filename}`);
                resolve(true);
            });
        }).on('error', (err) => {
            fs.unlink(path.join(targetDir, filename), () => { }); // Delete the file async
            reject(err);
        });
    });
}

async function main() {
    console.log(`Downloading ${images.length} images to ${targetDir}...`);
    for (const img of images) {
        try {
            await downloadImage(img.url, `${img.name}.jpg`);
        } catch (error) {
            console.error(`Error downloading ${img.name}:`, error);
        }
    }
    console.log("Done.");
}

main();
