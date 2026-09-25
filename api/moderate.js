import { parseJsonBody, readOpenAIError, rejectMethod, resolveApiKey } from "./_shared.js";

export default async function handler(req, res) {
  if (rejectMethod(req, res)) return;
  const apiKey = resolveApiKey(req);
  if (!apiKey) return res.status(401).json({ error: "Falta la OpenAI API Key." });

  try {
    const { text = "" } = parseJsonBody(req);
    if (!text.trim()) return res.status(400).json({ error: "Escribe contenido para analizar." });
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "omni-moderation-latest", input: text })
    });
    if (!response.ok) return res.status(response.status).json({ error: await readOpenAIError(response) });
    const result = (await response.json()).results?.[0];
    if (!result) return res.status(502).json({ error: "No se recibió el análisis de seguridad." });
    const categories = Object.entries(result.categories || {})
      .filter(([, detected]) => detected)
      .map(([category]) => `• ${category}`);
    return res.status(200).json({ flagged: Boolean(result.flagged), categories });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
