import { createClient } from "@supabase/supabase-js";

export const PUBLICIDAD_BUCKET = "publicidad-utp";

export function resolveSupabaseConfig() {
  const url = (process.env.SUPABASE_URL || "").trim();
  const secretKey = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  return { url, secretKey };
}

export function createSupabaseAdmin() {
  const { url, secretKey } = resolveSupabaseConfig();
  if (!url || !secretKey) {
    throw new Error("Falta configurar SUPABASE_URL y SUPABASE_SECRET_KEY en el servidor.");
  }
  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

export function safeStorageExtension(mimeType) {
  const normalized = String(mimeType || "").split(";", 1)[0].trim().toLowerCase();
  return ({
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm"
  })[normalized] || "";
}
