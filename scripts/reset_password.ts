
import "dotenv/config";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function resetPassword() {
    console.log("=== Resetting Password for Chicken Affair ===\n");

    const userId = "iktzf8nfn5lybzxl27bkxypk";
    const targetUsername = "chicken affair";
    const newPassword = "cafechicken@affair567";

    // 1. Find User
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
    });

    if (!user) {
        console.error("Critical: User not found!");
        process.exit(1);
    }

    console.log(`Found User: ${user.username} (ID: ${user.id})`);

    // 2. Hash New Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Update User (Ensure username is 'chicken affair' and password is set)
    await db.update(users)
        .set({
            username: targetUsername,
            password: hashedPassword
        })
        .where(eq(users.id, userId));

    console.log("✅ Credentials Updated Successfully.");
    console.log("------------------------------------------------");
    console.log("Please copy and paste these exact credentials:");
    console.log(`Username: ${targetUsername}`);
    console.log(`Password: ${newPassword}`);
    console.log("------------------------------------------------");

    process.exit(0);
}

resetPassword();
