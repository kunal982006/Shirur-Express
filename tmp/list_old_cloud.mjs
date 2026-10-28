const { C, K, S } = process.env;
const auth = "Basic " + Buffer.from(`${K}:${S}`).toString("base64");
const get = (p) => fetch(`https://api.cloudinary.com/v1_1/${C}/${p}`, { headers: { Authorization: auth } }).then(r => r.json());
const usage = await get("usage");
console.log("usage:", JSON.stringify(usage).slice(0, 400));
const all = [];
for (const type of ["image", "raw", "video"]) {
  let cursor;
  do {
    const r = await get(`resources/${type}?max_results=500${cursor ? `&next_cursor=${cursor}` : ""}`);
    if (r.error) { console.log(type, "error:", r.error.message); break; }
    all.push(...r.resources); cursor = r.next_cursor;
  } while (cursor);
}
const byMonth = {}, byFolder = {};
for (const r of all) { const m = r.created_at.slice(0, 7); byMonth[m] = (byMonth[m] || 0) + 1; const f = r.public_id.includes("/") ? r.public_id.split("/").slice(0, -1).join("/") : "(root)"; byFolder[f] = (byFolder[f] || 0) + 1; }
console.log("total assets:", all.length);
console.log("by month:", byMonth);
console.log("by folder:", Object.entries(byFolder).sort((a, b) => b[1] - a[1]).slice(0, 25));
await import("fs").then(fs => fs.writeFileSync("tmp/old_cloud_assets.json", JSON.stringify(all.map(r => ({ id: r.public_id, url: r.secure_url, etag: r.etag, bytes: r.bytes, created: r.created_at })))));
