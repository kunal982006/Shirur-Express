
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('client/public/images/menu-items');

const fallbacks = [
    { target: 'fried_rice.jpg', source: 'rice_dish.jpg' },
    { target: 'cold_coffee.jpg', source: 'coffee.jpg' },
    { target: 'manchurian.jpg', source: 'chinese_starter.jpg' }, // Assuming this exists, if not, create dummy
    { target: 'pav_bhaji.jpg', source: 'misal_pav.jpg' } // better than nothing
];

fallbacks.forEach(({ target, source }) => {
    const srcPath = path.join(publicDir, source);
    const destPath = path.join(publicDir, target);

    if (fs.existsSync(srcPath)) {
        if (!fs.existsSync(destPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`Created ${target} from ${source}`);
        } else {
            console.log(`${target} already exists (maybe partially downloaded?), skipping overwriting for safety unless size is 0`);
            const stats = fs.statSync(destPath);
            if (stats.size === 0) {
                fs.copyFileSync(srcPath, destPath);
                console.log(`Overwrote empty ${target} with ${source}`);
            }
        }
    } else {
        console.warn(`Source ${source} not found! Cannot create ${target}`);
    }
});
