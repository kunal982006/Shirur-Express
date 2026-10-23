import fs from "fs";
import { updatedBullsMenu } from "./bulls_updated_menu_data";

const db = JSON.parse(fs.readFileSync("scratch/bulls_current_db_utf8.json", "utf8"));
const currentNames = new Set(db.map((d: any) => d.name));
const newNames = new Set(updatedBullsMenu.map(m => m.name));

const extraInDb = [...currentNames].filter(n => !newNames.has(n));
console.log("Items currently in DB but not directly matching new menu card names (" + extraInDb.length + "):");
console.log(extraInDb);
