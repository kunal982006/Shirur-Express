import 'dotenv/config';
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function run() {
    const originalUsername = "shankar rokade ";
    const fixedUsername = "shankar rokade";
    const newPassword = "bakers@A1";
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await db.update(users)
        .set({ 
            username: fixedUsername,
            password: hashedPassword 
        })
        .where(eq(users.username, originalUsername))
        .returning();
        
    if (result.length > 0) {
        console.log(`Successfully updated ${originalUsername} -> ${fixedUsername}`);
        console.log(`Password reset to: ${newPassword}`);
    } else {
        console.log(`Failed to find user with username "${originalUsername}"`);
        
        // try to fallback to the fixed username in case it was already fixed
        const result2 = await db.update(users)
            .set({ password: hashedPassword })
            .where(eq(users.username, fixedUsername))
            .returning();
            
        if (result2.length > 0) {
            console.log(`Already fixed username but updated password to: ${newPassword}`);
        } else {
             console.log(`Failed completely to find either username.`);
        }
    }
}

run().then(() => process.exit(0)).catch(console.error);
