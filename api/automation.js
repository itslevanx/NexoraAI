import { parseJsonBody, rejectMethod } from "./_shared.js";

function resolveWebhook(req) {
  const header = req.headers["x-n8n-webhook"];
  const temporaryWebhook = Array.isArray(header) ? header[0] : header;
  return (process.env.N8N_WEBHOOK_URL || temporaryWebhook || "").trim();
}

function validateWebhook(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error("La URL del webhook no es válida."); }
  if (url.username || url.password) throw new Error("No incluyas credenciales dentro de la URL.");
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("En producción el webhook de n8n debe utilizar HTTPS.");
  }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("El webhook debe usar HTTP o HTTPS.");
  return url.toString();
}

export default async function handler(req, res) {
  if (rejectMethod(req, res)) return;
  const configuredWebhook = resolveWebhook(req);
  if (!configuredWebhook) {
    return res.status(401).json({ error: "Configura N8N_WEBHOOK_URL en Vercel o pega el webhook en Configuración." });
  }

  try {
    const webhook = validateWebhook(configuredWebhook);
    const payload = parseJsonBody(req);
    if (!["sheet", "email", "whatsapp"].includes(payload.action)) {
      return res.status(400).json({ error: "La acción solicitada no es compatible." });
    }
    if (!String(payload.content || "").trim()) {
      return res.status(400).json({ error: "El contenido no puede estar vacío." });
    }

    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000)
    });
    const text = await response.text();
    let result;
    try { result = JSON.parse(text); } catch { result = { ok: response.ok, message: text || "n8n no devolvió contenido." }; }
    if (!response.ok) return res.status(response.status).json({ error: result.message || `n8n respondió con HTTP ${response.status}.` });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(502).json({ error: `No se pudo ejecutar la automatización: ${error.message}` });
  }
}
