import { db } from './server/db';
import { streetFoodItems } from './shared/schema';
import { eq } from 'drizzle-orm';

const images = [
    'https://images.unsplash.com/photo-1555126634-fa0256860010?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // Vada Pav
    'https://images.unsplash.com/photo-1589302168068-964664d93cb0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // Biryani
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // Samosa
    'https://images.unsplash.com/photo-1565557613262-11cf0fe7f29a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // Pav Bhaji
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // Dosa
    'https://images.unsplash.com/photo-1610192305389-7ff4d4514ac0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // Chaat
    'https://images.unsplash.com/photo-1574041162489-35431ff4edbc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // Pani Puri
    'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'  // Momos
];

async function updateImages() {
    try {
        const items = await db.select().from(streetFoodItems);
        if (items.length === 0) {
            console.log('No street food items found');
            process.exit(0);
        }

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const newImage = images[i % images.length];
            await db.update(streetFoodItems)
                .set({ imageUrl: newImage })
                .where(eq(streetFoodItems.id, item.id));
            console.log(`Updated ${item.name} with new image: ${newImage}`);
        }

        console.log('Finished updating images');
        process.exit(0);
    } catch (err) {
        console.error('Failed to update images', err);
        process.exit(1);
    }
}

updateImages();
