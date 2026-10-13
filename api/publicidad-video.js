import { Readable } from "node:stream";
import { rejectMethod } from "./_shared.js";
import { readGeminiError, resolveGeminiApiKey, verifyDownloadToken } from "./_gemini-video.js";
import { hasAdvertisingAccess, resolveAdvertisingAccessCode } from "./_publicidad-auth.js";

export default async function handler(req, res) {
  if (rejectMethod(req, res, "GET")) return;
  const accessCode = resolveAdvertisingAccessCode();
  if (!accessCode) return res.status(503).json({ error: "El acceso a Publicidad todavía no está configurado." });
  if (!hasAdvertisingAccess(req, accessCode)) return res.status(401).json({ error: "Debes desbloquear Publicidad para continuar." });
  const apiKey = resolveGeminiApiKey();
  if (!apiKey) return res.status(503).json({ error: "Falta configurar GEMINI_API_KEY en Vercel." });
  const token = Array.isArray(req.query?.token) ? req.query.token[0] : req.query?.token;
  const uri = verifyDownloadToken(token, apiKey);
  if (!uri) return res.status(403).json({ error: "El enlace de descarga no es válido o venció." });

  try {
    const response = await fetch(uri, { headers: { "x-goog-api-key": apiKey }, redirect: "follow" });
    if (!response.ok) return res.status(response.status).json({ error: await readGeminiError(response) });
    res.setHeader("Content-Type", response.headers.get("content-type") || "video/mp4");
    res.setHeader("Content-Disposition", "inline; filename=veo-utp.mp4");
    res.setHeader("Cache-Control", "private, max-age=300");
    const length = response.headers.get("content-length");
    if (length) res.setHeader("Content-Length", length);
    if (!response.body) return res.status(502).json({ error: "Google no devolvió el archivo de video." });
    Readable.fromWeb(response.body).pipe(res);
  } catch (error) {
    if (!res.headersSent) return res.status(502).json({ error: error.message || "No fue posible descargar el video." });
    res.end();
  }
}
