// check_abhiruchi.ts
import('dotenv').then(dotenv => dotenv.config());
import('./server/db').then(async ({ db }) => {
    import('./shared/schema').then(async ({ serviceProviders, restaurantMenuItems }) => {
        const { ilike, eq } = await import('drizzle-orm');
        console.log("Querying DB...");
        try {
            const providers = await db.select().from(serviceProviders).where(ilike(serviceProviders.businessName, '%abhiruchi%'));
            console.log("Providers found:", providers.length);
            for (const p of providers) {
                console.log(`- ID: ${p.id}, Name: ${p.businessName}, CategoryID: ${p.categoryId}`);
            }
        } catch (e) {
            console.error("Error:", e);
        }
        process.exit(0);
    });
});
