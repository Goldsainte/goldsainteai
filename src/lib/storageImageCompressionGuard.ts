/**
 * Transparent image compression for ALL Supabase Storage uploads.
 *
 * Mirrors the resend-guard pattern on the backend: import this module once
 * (from main.tsx) and every `supabase.storage.from(bucket).upload(...)` in
 * the app — profile media, Maison collections, application logos, covers,
 * trip images, all ~30 upload sites — gets oversized JPEG/PNG/WebP images
 * resized in the browser before a single byte leaves the device.
 *
 * Non-image bodies (PDFs, documents, audio), small images, and anything
 * unexpected pass through completely untouched. If compression fails for any
 * reason, the original file uploads as-is — this guard can slow nothing down
 * and break nothing.
 */
import { supabase } from "@/integrations/supabase/client";
import { compressImageFile } from "@/lib/imageCompression";

const storage = supabase.storage as any;

if (storage && !storage.__imageCompressionGuard) {
  storage.__imageCompressionGuard = true;

  const originalFrom = storage.from.bind(storage);
  storage.from = (bucket: string) => {
    const api = originalFrom(bucket);
    const originalUpload = api.upload.bind(api);
    api.upload = async (path: string, body: unknown, options?: unknown) => {
      const processed =
        body instanceof File ? await compressImageFile(body) : body;
      return originalUpload(path, processed, options);
    };
    return api;
  };
}
