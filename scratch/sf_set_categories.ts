import { db } from "../server/db";
import { streetFoodItems } from "../shared/schema";
import { eq } from "drizzle-orm";
const map: Record<string, string> = {
  // Davangiri Loni spanje dosa
  ppkb339cfj7guao65ef44t6r: "Plain Dosa",          // Sadha Loni Dosa
  hqvkpjzjdyserpjoc936fir7: "Plain Dosa",          // Loni cut Dosa
  lfe0kctdbnec2vpgjx7uvkbn: "Masala Dosa",         // Loni Masala Dosa
  yravcau3vhum9fou2sd0klsi: "Masala Dosa",         // Loni Masala Spanje dosa
  iml89pijershnyppxl9umvvb: "Masala Dosa",         // Loni Masala Cut Dosa
  lcwdeqc1zsqvaqs1pwpuuc8y: "Specials & Uttapa",   // Loni special open Dosa
  t0wqjesm72jqgm5vv3n3onmm: "Specials & Uttapa",   // Loni Kanda utappa
  // Tumkur Tattey Idli
  pbaxllybebn120nd5uzslnqt: "Idli & Wada",         // Single tattey idli
  qb39sryrvawq9o0s4p5qsrnf: "Idli & Wada",         // Udid wada
  belf4hlcqgjayec1mhrynzrb: "Idli & Wada",         // Idli wada mix
  czpsw0z96fypz1t6y07efuzs: "Appe & Upit",         // Appe
  dhku2527srey4upz46h6e053: "Appe & Upit",         // Upit
  l5d4ejvyod2ocadtd897ytha: "Sweets",              // Pineapple Shira
};
async function run() {
  let n = 0;
  for (const [id, category] of Object.entries(map)) {
    const r = await db.update(streetFoodItems).set({ category }).where(eq(streetFoodItems.id, id)).returning({ name: streetFoodItems.name });
    if (r[0]) { n++; console.log(`OK ${r[0].name} -> ${category}`); } else console.log(`MISSING ${id}`);
  }
  console.log(`updated ${n}`);
  process.exit(0);
}
run();
