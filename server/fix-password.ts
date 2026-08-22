import 'dotenv/config';
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function run() {
  const hashedPassword = await bcrypt.hash("CakeShop1942", 10);
  await db.update(users).set({ password: hashedPassword }).where(eq(users.username, "premiumbakers"));
  console.log("Password updated successfully!");
  process.exit(0);
}

run();
