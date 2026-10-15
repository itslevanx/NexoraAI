import { randomUUID } from "node:crypto";
import { parseJsonBody } from "./_shared.js";
import { hasAdvertisingAccess, resolveAdvertisingAccessCode } from "./_publicidad-auth.js";
import { createSupabaseAdmin, PUBLICIDAD_BUCKET, safeStorageExtension } from "./_supabase.js";

const SOURCES = new Set(["camara", "archivo"]);
const TONES = new Set(["inspirador", "tecnologico", "energetico", "institucional"]);
const FORMATS = new Set(["portrait", "landscape"]);
const DURATIONS = new Set([10, 15, 20, 30]);

function cleanText(value, limit) {
  return String(value || "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, limit);
}

function requireAccess(req, res) {
  const secret = resolveAdvertisingAccessCode();
  if (!secret) {
    res.status(503).json({ error: "El acceso a Publicidad todavía no está configurado." });
    return false;
  }
  if (!hasAdvertisingAccess(req, secret)) {
    res.status(401).json({ error: "Debes desbloquear Publicidad para continuar." });
    return false;
  }
  return true;
}

async function signedMedia(supabase, item) {
  const image = item.image_path
    ? await supabase.storage.from(PUBLICIDAD_BUCKET).createSignedUrl(item.image_path, 3600)
    : { data: null };
  const video = item.video_path
    ? await supabase.storage.from(PUBLICIDAD_BUCKET).createSignedUrl(item.video_path, 3600)
    : { data: null };
  const sourceVideo = item.source_video_path
    ? await supabase.storage.from(PUBLICIDAD_BUCKET).createSignedUrl(item.source_video_path, 3600)
    : { data: null };
  return {
    ...item,
    imageUrl: image.data?.signedUrl || "",
    videoUrl: video.data?.signedUrl || "",
    sourceVideoUrl: sourceVideo.data?.signedUrl || ""
  };
}

async function listGallery(supabase) {
  const { data, error } = await supabase
    .from("publicidad_items")
    .select("id,created_at,updated_at,source,status,image_path,source_video_path,video_path,prompt,tone,duration,format,error_message")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return Promise.all((data || []).map((item) => signedMedia(supabase, item)));
}

async function createCapture(supabase, body) {
  const mimeType = String(body.mimeType || "");
  const extension = safeStorageExtension(mimeType);
  if (!extension || !mimeType.startsWith("image/")) throw new Error("Usa una imagen JPG, PNG o WEBP.");
  const source = SOURCES.has(body.source) ? body.source : "archivo";
  const id = randomUUID();
  const imagePath = `imagenes/${id}.${extension}`;
  const { error: insertError } = await supabase.from("publicidad_items").insert({
    id,
    source,
    status: "subiendo",
    image_path: imagePath
  });
  if (insertError) throw insertError;
  const { data, error } = await supabase.storage.from(PUBLICIDAD_BUCKET).createSignedUploadUrl(imagePath);
  if (error) {
    await supabase.from("publicidad_items").update({ status: "error", error_message: error.message }).eq("id", id);
    throw error;
  }
  return { id, path: imagePath, ...data };
}

async function confirmCapture(supabase, body) {
  const id = String(body.id || "");
  const { data, error } = await supabase
    .from("publicidad_items")
    .update({ status: "capturada", error_message: "" })
    .eq("id", id)
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

async function updateGeneration(supabase, body) {
  const duration = Number(body.duration);
  const values = {
    prompt: cleanText(body.prompt, 600),
    tone: TONES.has(body.tone) ? body.tone : "inspirador",
    duration: DURATIONS.has(duration) ? duration : 10,
    format: FORMATS.has(body.format) ? body.format : "portrait",
    status: body.status === "error" ? "error" : "generando",
    error_message: body.status === "error" ? cleanText(body.error, 500) : ""
  };
  const { data, error } = await supabase
    .from("publicidad_items")
    .update(values)
    .eq("id", String(body.id || ""))
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

async function prepareVideo(supabase, body) {
  const id = String(body.id || "");
  const mimeType = String(body.mimeType || "");
  const extension = safeStorageExtension(mimeType);
  if (!extension || !mimeType.startsWith("video/")) throw new Error("El video final debe ser MP4 o WEBM.");
  const videoPath = `videos/${id}.${extension}`;
  const { data, error } = await supabase.storage.from(PUBLICIDAD_BUCKET).createSignedUploadUrl(videoPath, { upsert: true });
  if (error) throw error;
  return { id, videoPath, ...data };
}

async function prepareSourceVideo(supabase, body) {
  const id = String(body.id || "");
  const mimeType = String(body.mimeType || "");
  const extension = safeStorageExtension(mimeType);
  if (!extension || !mimeType.toLowerCase().startsWith("video/")) throw new Error("La toma de Veo debe ser MP4 o WEBM.");
  const sourceVideoPath = `tomas/${id}.${extension}`;
  const { data, error } = await supabase.storage.from(PUBLICIDAD_BUCKET).createSignedUploadUrl(sourceVideoPath, { upsert: true });
  if (error) throw error;
  return { id, sourceVideoPath, ...data };
}

async function completeSourceVideo(supabase, body) {
  const id = String(body.id || "");
  const sourceVideoPath = String(body.sourceVideoPath || "");
  if (!sourceVideoPath.startsWith(`tomas/${id}.`)) throw new Error("La ruta de la toma no es válida.");
  const { data, error } = await supabase
    .from("publicidad_items")
    .update({ source_video_path: sourceVideoPath, error_message: "" })
    .eq("id", id)
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

async function completeVideo(supabase, body) {
  const id = String(body.id || "");
  const videoPath = String(body.videoPath || "");
  if (!videoPath.startsWith(`videos/${id}.`)) throw new Error("La ruta del video no es válida.");
  const { data, error } = await supabase
    .from("publicidad_items")
    .update({ video_path: videoPath, status: "completada", error_message: "" })
    .eq("id", id)
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!new Set(["GET", "POST"]).has(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Usa GET o POST." });
  }
  if (!requireAccess(req, res)) return;
  try {
    const supabase = createSupabaseAdmin();
    if (req.method === "GET") return res.status(200).json({ items: await listGallery(supabase) });
    const body = parseJsonBody(req);
    const actions = {
      "crear-captura": createCapture,
      "confirmar-captura": confirmCapture,
      "actualizar-generacion": updateGeneration,
      "preparar-toma": prepareSourceVideo,
      "completar-toma": completeSourceVideo,
      "preparar-video": prepareVideo,
      "completar-video": completeVideo
    };
    const action = actions[body.action];
    if (!action) return res.status(400).json({ error: "Acción de galería no válida." });
    return res.status(200).json(await action(supabase, body));
  } catch (error) {
    return res.status(400).json({ error: error.message || "No fue posible actualizar la galería." });
  }
}

export { cleanText };
