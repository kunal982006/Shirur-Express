
import { db } from "./server/db.js";
import { serviceProviders } from "./shared/schema.js";
import { eq } from "drizzle-orm";

async function run() {
    try {
        const id = 'ae0afs4sp07891gj3f8suj';
        const provider = await db.query.serviceProviders.findFirst({
            where: eq(serviceProviders.id, id),
            with: {
              beautyServices: true,
            }
        });
        console.log(JSON.stringify(provider, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
