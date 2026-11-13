import { createBrowserSupabase } from "./supabase/browser";

const BUCKET = "site-assets";

// Shrinks big phone photos in the browser before uploading
async function shrink(file: File, maxSide: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process that image."))), "image/webp", 0.85),
  );
}

// Runs in the browser as the logged-in admin; Storage rules only allow admins to write
export async function uploadImage(file: File, folder: "products" | "branding"): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file (JPG, PNG or WebP).");
  if (file.size > 20 * 1024 * 1024) throw new Error("That image is too large (max 20 MB).");

  const blob = await shrink(file, folder === "branding" ? 2000 : 1600);
  const path = `${folder}/${crypto.randomUUID()}.webp`;
  const sb = createBrowserSupabase();
  const { error } = await sb.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
  if (error) throw new Error(error.message);
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
