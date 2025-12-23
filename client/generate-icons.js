// PWA Icon Generator Script (ESM)
// Run: node generate-icons.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic import for sharp
let sharp;
try {
    sharp = (await import('sharp')).default;
} catch (e) {
    console.log('Sharp not found. Installing...');
    console.log('Please run: npm install sharp');
    console.log('Then run this script again.');
    process.exit(1);
}

const SOURCE_IMAGE = path.join(__dirname, 'public', 'shirur-express-logo.png');
const ICONS_DIR = path.join(__dirname, 'public', 'icons');

// Icon sizes to generate
const ICON_SIZES = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const MASKABLE_SIZES = [192, 512];

async function generateIcons() {
    console.log('🎨 Generating PWA Icons for Shirur Express...\n');

    // Ensure icons directory exists
    if (!fs.existsSync(ICONS_DIR)) {
        fs.mkdirSync(ICONS_DIR, { recursive: true });
    }

    // Check if source image exists
    if (!fs.existsSync(SOURCE_IMAGE)) {
        console.error('❌ Source image not found:', SOURCE_IMAGE);
        console.log('Please ensure shirur-express-logo.png exists in the public folder.');
        process.exit(1);
    }

    try {
        // Generate standard icons
        console.log('📦 Generating standard icons...');
        for (const size of ICON_SIZES) {
            const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
            await sharp(SOURCE_IMAGE)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 26, g: 26, b: 46, alpha: 1 } // #1a1a2e
                })
                .png()
                .toFile(outputPath);
            console.log(`  ✓ icon-${size}x${size}.png`);
        }

        // Generate maskable icons (with padding for safe zone)
        console.log('\n🎭 Generating maskable icons...');
        for (const size of MASKABLE_SIZES) {
            const outputPath = path.join(ICONS_DIR, `maskable-icon-${size}x${size}.png`);
            const innerSize = Math.round(size * 0.8); // 80% of the size for safe zone

            await sharp(SOURCE_IMAGE)
                .resize(innerSize, innerSize, {
                    fit: 'contain',
                    background: { r: 26, g: 26, b: 46, alpha: 1 }
                })
                .extend({
                    top: Math.round((size - innerSize) / 2),
                    bottom: Math.round((size - innerSize) / 2),
                    left: Math.round((size - innerSize) / 2),
                    right: Math.round((size - innerSize) / 2),
                    background: { r: 26, g: 26, b: 46, alpha: 1 }
                })
                .png()
                .toFile(outputPath);
            console.log(`  ✓ maskable-icon-${size}x${size}.png`);
        }

        // Copy 32x32 as favicon
        const faviconSource = path.join(ICONS_DIR, 'icon-32x32.png');
        const faviconDest = path.join(__dirname, 'public', 'favicon.ico');
        if (fs.existsSync(faviconSource)) {
            fs.copyFileSync(faviconSource, faviconDest);
            console.log('\n📌 Created favicon.ico from icon-32x32.png');
        }

        console.log('\n✅ All icons generated successfully!');
        console.log('\n📍 Icons saved to:', ICONS_DIR);
        console.log('\n🧪 Test your PWA at: https://www.pwabuilder.com/');

    } catch (error) {
        console.error('❌ Error generating icons:', error.message);
        process.exit(1);
    }
}

generateIcons();
