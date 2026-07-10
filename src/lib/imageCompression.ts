/**
 * Client-side image compression — runs in the person's browser BEFORE upload,
 * so full-size phone photos (often 8–15 MB) never hit storage or bandwidth.
 *
 * Rules, deliberately conservative:
 *  - Only JPEG / PNG / WebP files above MIN_BYTES are touched.
 *  - Longest edge is capped at MAX_DIM px (plenty for full-screen retina).
 *  - Format is PRESERVED: PNG stays PNG (transparency-safe for logos),
 *    JPEG stays JPEG, WebP stays WebP. No extension/content-type surprises.
 *  - If the result isn't smaller, the original wins.
 *  - Any error → the original file is returned untouched. Compression is an
 *    optimization, never a gate; an upload must never fail because of it.
 */

const COMPRESSIBLE = new Set(["image/jpeg", "image/png", "image/webp"]);
const MIN_BYTES = 400 * 1024; // below this, not worth the work
const MAX_DIM = 2048;
const JPEG_WEBP_QUALITY = 0.82;

// Files we've already processed (or produced) this session — lets an explicit
// call and the global storage guard coexist without double-compressing.
const processed = new WeakSet<File>();

export async function compressImageFile(file: File): Promise<File> {
  try {
    if (!(file instanceof File)) return file;
    if (processed.has(file)) return file;
    if (!COMPRESSIBLE.has(file.type)) return file;
    if (file.size < MIN_BYTES) return file;

    // createImageBitmap respects EXIF orientation in modern browsers
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));

    // A PNG at target size already — re-encoding won't help (and PNG has no
    // quality dial), so leave it alone.
    if (scale === 1 && file.type === "image/png") {
      bitmap.close();
      processed.add(file);
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const quality = file.type === "image/png" ? undefined : JPEG_WEBP_QUALITY;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, file.type, quality)
    );

    // Encoder unavailable or result not smaller → keep the original
    if (!blob || blob.size >= file.size) {
      processed.add(file);
      return file;
    }

    const out = new File([blob], file.name, {
      type: file.type,
      lastModified: file.lastModified,
    });
    processed.add(out);
    return out;
  } catch (e) {
    console.warn("Image compression skipped (non-fatal):", e);
    return file;
  }
}
