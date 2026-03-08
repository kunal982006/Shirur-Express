import { db } from './server/db';
import { serviceProviders } from './shared/schema';
import { ilike, eq } from 'drizzle-orm';

async function updateAbhiruchi() {
    try {
        const providers = await db.select().from(serviceProviders).where(ilike(serviceProviders.businessName, '%abhiruchi%'));

        for (const p of providers) {
            console.log(`Updating ${p.businessName} (ID: ${p.id}) category from '${p.categoryId}' to 'restaurants'`);
            await db.update(serviceProviders)
                .set({ categoryId: 'restaurants' })
                .where(eq(serviceProviders.id, p.id));
            console.log("Update successful!");
        }

    } catch (e) {
        console.error("Failed to update:", e);
    } finally {
        process.exit(0);
    }
}

updateAbhiruchi();
