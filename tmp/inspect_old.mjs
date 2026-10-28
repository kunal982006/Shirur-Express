const { C, K, S } = process.env;
const auth = "Basic " + Buffer.from(`${K}:${S}`).toString("base64");
const get = (p) => fetch(`https://api.cloudinary.com/v1_1/${C}/${p}`, { headers: { Authorization: auth } }).then(r => r.json());
for (const id of ["pqckhn74lzmevqd4zeps", "igjbwndzlq3v1e78ivbw", "shirur-express/rk-menu"]) {
  const r = id.includes("/") ? await get(`resources/image/upload?prefix=${encodeURIComponent(id)}&max_results=3&tags=true&context=true`) : await get(`resources/image/upload/${id}`);
  const x = r.resources ? r.resources : [r];
  for (const y of x) console.log(JSON.stringify({ id: y.public_id, original_filename: y.original_filename, tags: y.tags, context: y.context, created: y.created_at, w: y.width, h: y.height, bytes: y.bytes, etag: y.etag }));
}
