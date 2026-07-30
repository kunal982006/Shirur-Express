import { config } from "dotenv";
config();

import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const user = await db.query.users.findFirst({
    where: eq(users.email, "rajesh@gmail.com")
  });
  console.log("Rajesh User Record:", user);
  process.exit(0);
}
main();
