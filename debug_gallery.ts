import { db } from './server/db';
import { serviceProviders } from './shared/schema';
import { eq } from 'drizzle-orm';

async function debug() {
  try {
    const provider = await db.query.serviceProviders.findFirst({
      where: eq(serviceProviders.businessName, 'Hotel Abhiruchi'),
    });
    
    if (!provider) {
      console.log('Provider "Hotel Abhiruchi" not found.');
    } else {
      console.log('--- PROVIDER DATA ---');
      console.log('ID:', provider.id);
      console.log('Business Name:', provider.businessName);
      console.log('Gallery Images:', JSON.stringify(provider.galleryImages, null, 2));
    }
  } catch (error) {
    console.error('Error during debug:', error);
  } finally {
    process.exit(0);
  }
}

debug();
