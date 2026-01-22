
import { db } from "../server/db";
import { users } from "@shared/schema";

async function main() {
    try {
        const allUsers = await db.query.users.findMany({
            columns: {
                id: true,
                username: true,
                role: true,
                phone: true,
            }
        });
        console.log(JSON.stringify(allUsers, null, 2));
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

main().then(() => process.exit(0));
