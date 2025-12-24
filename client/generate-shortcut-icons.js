// PWA Shortcut Icons Generator
// Run: node generate-shortcut-icons.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sharp;
try {
    sharp = (await import('sharp')).default;
} catch (e) {
    console.log('Sharp not found. Please run: npm install sharp');
    process.exit(1);
}

const ICONS_DIR = path.join(__dirname, 'public', 'icons');

// Create simple colored shortcut icons
async function createShortcutIcons() {
    console.log('🎨 Creating shortcut icons...\n');

    const shortcuts = [
        { name: 'shortcut-food', emoji: '🍽️', bgColor: '#ef4444' },      // Red for food
        { name: 'shortcut-orders', emoji: '📦', bgColor: '#3b82f6' },    // Blue for orders
        { name: 'shortcut-grocery', emoji: '🛒', bgColor: '#22c55e' }    // Green for grocery
    ];

    for (const shortcut of shortcuts) {
        const svgContent = `
      <svg width="96" height="96" xmlns="http://www.w3.org/2000/svg">
        <rect width="96" height="96" rx="20" fill="${shortcut.bgColor}"/>
        <text x="48" y="60" font-size="48" text-anchor="middle">${shortcut.emoji}</text>
      </svg>
    `;

        const outputPath = path.join(ICONS_DIR, `${shortcut.name}.png`);

        await sharp(Buffer.from(svgContent))
            .resize(96, 96)
            .png()
            .toFile(outputPath);

        console.log(`  ✓ ${shortcut.name}.png`);
    }

    console.log('\n✅ Shortcut icons created!');
}

createShortcutIcons();
