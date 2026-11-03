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
  if (process.env.AUTOMATION_SERVICE_URL && process.env.N8N_AUTOMATION_BASE_URL) {
    return handleLocalAutomation(req, res);
  }
  const configuredWebhook = resolveWebhook(req);
  if (!configuredWebhook) {
    return res.status(401).json({ error: "Configura N8N_WEBHOOK_URL en Vercel o pega el webhook en Configuración." });
  }

  try {
    const webhook = validateWebhook(configuredWebhook);
    const payload = parseJsonBody(req);
    if (!["sheet", "email", "whatsapp", "task", "study", "calendar"].includes(payload.action)) {
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

async function handleLocalAutomation(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const origin = req.headers.origin;
  if (origin) {
    try {
      const url = new URL(origin);
      if (url.host !== req.headers.host || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
        return res.status(403).json({ error: "Usa las automatizaciones desde NEXORA local." });
      }
    } catch { return res.status(403).json({ error: "Origen inválido." }); }
  }
  try {
    const payload = parseJsonBody(req);
    const workflows = new Set(["agenda", "study", "reports"]);
    const controls = new Set(["status", "settings"]);
    const workflow = payload.workflow;
    if (!workflows.has(workflow) && !controls.has(workflow)) return res.status(400).json({ error: "Automatización no válida." });
    const base = controls.has(workflow) ? process.env.AUTOMATION_SERVICE_URL : process.env.N8N_AUTOMATION_BASE_URL;
    const path = controls.has(workflow) ? `/${workflow}` : `/webhook/nexora-${workflow}`;
    const response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-nexora-automation-key": process.env.AUTOMATION_SHARED_SECRET },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25000)
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error || data.message || "n8n no pudo ejecutar la automatización. Revisa los datos y el historial local." });
    if (data?.ok === false && data.error) return res.status(400).json(data);
    if (!data || data.ok !== true) return res.status(502).json({ error: "n8n no entregó un resultado válido. Verifica que los workflows estén publicados." });
    return res.status(200).json(data);
  } catch { return res.status(502).json({ error: "No se pudo contactar con n8n local. Inicia las automatizaciones y vuelve a intentar." }); }
}
