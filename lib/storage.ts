// Only accept image URLs that point at our own Supabase Storage bucket
export function isOwnStorageUrl(url: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(base) && url.startsWith(`${base}/storage/v1/object/public/site-assets/`);
}
