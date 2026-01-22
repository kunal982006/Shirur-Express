
import { db } from "../server/db";
import { serviceProviders } from "@shared/schema";

async function main() {
    try {
        const providers = await db.query.serviceProviders.findMany({
            columns: {
                id: true,
                businessName: true,
            },
            with: {
                user: {
                    columns: {
                        username: true,
                        phone: true
                    }
                }
            }
        });
        console.log(JSON.stringify(providers, null, 2));
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

main().then(() => process.exit(0));
