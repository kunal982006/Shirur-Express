// Copies the built website into the Android app, so the app can open from the
// phone's storage instead of downloading itself on every launch.
//
//   npm run android:bundle        build the website here and copy it in
//   npm run android:bundle:live   copy in exactly what is live on the server
//
// Use the "live" one for Play Store releases, after the website is deployed:
// the app then holds byte-for-byte the files the server serves, so it never has
// to download them. (A build made on this computer can differ slightly from the
// server's build; the app still works, it just fetches the server's files once.)
//
// The files land in android-app/app/src/main/assets/web (not committed to git).
// If that folder is missing the app still works, loading everything from the
// server as it used to.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ORIGIN = "https://shirur-express.onrender.com";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist", "public");
const targetDir = path.join(root, "android-app", "app", "src", "main", "assets", "web");
const MANIFEST = "asset-manifest.json";

// Left out of the APK. The app fetches these from the server when needed, and
// the WebView keeps its own cache of them.
const EXCLUDE = [
  /^images\/menu-items\//, // ~40MB of menu photos
  /^screenshots\//,        // Play Store / PWA install screenshots
  /^splash\//,             // iOS splash images
  /^sw\.js$/,              // the service worker must always come from the server
  /^offline\.html$/,
  /\.map$/,
];

const included = (file) => !EXCLUDE.some((pattern) => pattern.test(file));

function listFiles(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory()
      ? listFiles(full, base)
      : [path.relative(base, full).split(path.sep).join("/")];
  });
}

function write(file, data) {
  const destination = path.join(targetDir, ...file.split("/"));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, data);
  return data.length;
}

async function fromLocalBuild() {
  if (!fs.existsSync(path.join(distDir, "index.html"))) {
    throw new Error("dist/public/index.html not found. Run `npm run android:bundle` (it builds first).");
  }
  let bytes = 0;
  const files = listFiles(distDir).filter((file) => file !== MANIFEST && included(file));
  for (const file of files) bytes += write(file, fs.readFileSync(path.join(distDir, ...file.split("/"))));
  return { count: files.length, bytes };
}

async function download(file) {
  const response = await fetch(`${ORIGIN}/${file}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function fromLiveSite() {
  let manifest;
  try {
    manifest = JSON.parse((await download(MANIFEST)).toString("utf8"));
  } catch {
    throw new Error(
      `${ORIGIN}/${MANIFEST} is not available yet. Deploy this version of the website first, then run this again.`,
    );
  }
  if (!Array.isArray(manifest.files)) throw new Error(`${MANIFEST} has an unexpected format.`);

  const files = ["index.html", ...manifest.files.filter((file) => file !== "index.html" && included(file))];
  let bytes = 0;
  // A few at a time: quick, without hammering the server.
  for (let i = 0; i < files.length; i += 6) {
    const batch = files.slice(i, i + 6);
    const bodies = await Promise.all(batch.map(download));
    batch.forEach((file, index) => { bytes += write(file, bodies[index]); });
  }
  return { count: files.length, bytes };
}

const live = process.argv.includes("--live");
fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });

try {
  const { count, bytes } = live ? await fromLiveSite() : await fromLocalBuild();
  const source = live ? `the live site (${ORIGIN})` : "the local build (dist/public)";
  console.log(`Copied ${count} files (${(bytes / 1024 / 1024).toFixed(1)} MB) from ${source}`);
  console.log(`into ${path.relative(root, targetDir)}`);
  console.log("Now build the app in Android Studio as usual.");
} catch (error) {
  // Leave no half-copied bundle behind: without the folder the app loads from the server.
  fs.rmSync(targetDir, { recursive: true, force: true });
  console.error(`\nCould not prepare the app bundle: ${error.message}`);
  process.exit(1);
}
