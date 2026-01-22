
import { db } from "../server/db";
import { serviceCategories } from "@shared/schema";

async function main() {
    const cats = await db.select().from(serviceCategories);
    console.log(JSON.stringify(cats, null, 2));
}

main().then(() => process.exit(0));
