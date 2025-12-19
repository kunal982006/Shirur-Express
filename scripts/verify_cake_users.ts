
import { db } from "../server/db";
import { users, serviceProviders, serviceCategories } from "@shared/schema";
import { eq } from "drizzle-orm";
import fs from "fs";

async function verify() {
    const [cakeCategory] = await db
        .select()
        .from(serviceCategories)
        .where(eq(serviceCategories.slug, "cake-shop"));

    if (!cakeCategory) {
        fs.writeFileSync("verify_output.txt", "Category not found");
        process.exit(0);
    }

    const providers = await db
        .select({
            username: users.username,
        })
        .from(serviceProviders)
        .innerJoin(users, eq(serviceProviders.userId, users.id))
        .where(eq(serviceProviders.categoryId, cakeCategory.id));

    const result = JSON.stringify(providers, null, 2);
    fs.writeFileSync("verify_output.txt", result);
    process.exit(0);
}

verify().catch(err => {
    fs.writeFileSync("verify_output.txt", "Error: " + err.message);
    process.exit(1);
});
