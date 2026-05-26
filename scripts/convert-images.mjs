/**
 * Converts all JPEG/PNG assets to WebP at 80% quality.
 * Resizes hero images to max 1920px wide (no upscaling).
 * Run once: node scripts/convert-images.mjs
 */
import sharp from "sharp";
import { readdir, stat } from "fs/promises";
import { join, extname, basename } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, "../src/assets");
const MAX_WIDTH = 1920;
const QUALITY = 80;

async function getFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFiles(full)));
    } else if ([".jpg", ".jpeg", ".png"].includes(extname(entry.name).toLowerCase())) {
      files.push(full);
    }
  }
  return files;
}

const files = await getFiles(ASSETS_DIR);
let totalBefore = 0;
let totalAfter = 0;

for (const file of files) {
  const outFile = file.replace(/\.(jpg|jpeg|png)$/i, ".webp");
  const before = (await stat(file)).size;
  totalBefore += before;

  await sharp(file)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(outFile);

  const after = (await stat(outFile)).size;
  totalAfter += after;

  const saved = Math.round((1 - after / before) * 100);
  console.log(`${basename(file)} → ${basename(outFile)}  ${(before/1024/1024).toFixed(1)}MB → ${(after/1024/1024).toFixed(1)}MB  (-${saved}%)`);
}

console.log(`\nTotal: ${(totalBefore/1024/1024).toFixed(1)} MB → ${(totalAfter/1024/1024).toFixed(1)} MB  (-${Math.round((1 - totalAfter/totalBefore)*100)}%)`);
