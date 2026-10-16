import { pool } from "./db";

interface MenuItemRow {
  id: string;
  name: string;
  price: string;
}

async function updatePrices() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const targets = [
      { id: "fhryl5wnj8r135tknocm0vpw", name: "Suman pure veg" },
      { id: "vbommp2r09kny23sxu43tijt", name: "Nikhara veg & non-veg" }
    ];

    for (const target of targets) {
      console.log(`\n========================================`);
      console.log(`Updating prices for: ${target.name} (ID: ${target.id})`);
      console.log(`========================================`);

      const res = await client.query(
        `SELECT id, name, price FROM restaurant_menu_items WHERE provider_id = $1 ORDER BY name ASC`,
        [target.id]
      );

      const items: MenuItemRow[] = res.rows;
      console.log(`Found ${items.length} items to update.`);

      let updatedCount = 0;
      const sampleChanges: { name: string; oldPrice: string; newPrice: string }[] = [];

      for (const item of items) {
        const oldPriceNum = parseFloat(item.price);
        const newPriceNum = Math.round(oldPriceNum * 1.15);
        const newPriceStr = newPriceNum.toFixed(2);

        await client.query(
          `UPDATE restaurant_menu_items SET price = $1 WHERE id = $2`,
          [newPriceStr, item.id]
        );

        updatedCount++;
        if (sampleChanges.length < 5) {
          sampleChanges.push({
            name: item.name,
            oldPrice: item.price,
            newPrice: newPriceStr
          });
        }
      }

      console.log(`Successfully updated ${updatedCount} items.`);
      console.log("Sample changes:");
      sampleChanges.forEach(s => {
        console.log(`  - ${s.name}: ₹${s.oldPrice} -> ₹${s.newPrice} (+15%)`);
      });
    }

    await client.query("COMMIT");
    console.log(`\n✅ Transaction committed successfully! All prices updated by 15%.`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error updating prices, rolled back transaction:", err);
    throw err;
  } finally {
    client.release();
  }
}

updatePrices()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
