
import "dotenv/config";
import { db } from "../server/db";
import { users, deliveryPartners } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

async function deleteRiders() {
    console.log("Starting deletion of riders...");
    const usernames = ["rider", "rider1", "rider2"];

    const usersToDelete = await db.query.users.findMany({
        where: inArray(users.username, usernames)
    });

    if (usersToDelete.length === 0) {
        console.log("No users found with usernames: " + usernames.join(", "));
        return;
    }

    const userIds = usersToDelete.map(u => u.id);
    console.log("Found users with IDs:", userIds);

    // Delete related delivery partners first
    console.log("Deleting associated delivery partner profiles...");
    try {
        await db.delete(deliveryPartners).where(inArray(deliveryPartners.userId, userIds));
        console.log("Delivery partner profiles deleted.");
    } catch (error) {
        console.warn("Error deleting delivery partners (might not exist or other constraint):", error);
    }

    // Delete users
    console.log("Deleting users...");
    try {
        await db.delete(users).where(inArray(users.id, userIds));
        console.log("Users deleted successfully.");
    } catch (error) {
        console.error("Error deleting users:", error);
    }

    console.log("Deletion complete.");
    process.exit(0);
}

deleteRiders().catch(e => {
    console.error("Error deleting riders:", e);
    process.exit(1);
});
