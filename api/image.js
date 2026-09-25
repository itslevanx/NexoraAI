import { parseJsonBody, readOpenAIError, rejectMethod, resolveApiKey } from "./_shared.js";

const SIZES = new Set(["1024x1024", "1536x1024", "1024x1536"]);

export default async function handler(req, res) {
  if (rejectMethod(req, res)) return;
  const apiKey = resolveApiKey(req);
  if (!apiKey) return res.status(401).json({ error: "Falta la OpenAI API Key." });

  try {
    const { prompt = "", size = "1024x1024" } = parseJsonBody(req);
    if (!prompt.trim()) return res.status(400).json({ error: "Describe la imagen que deseas crear." });
    if (prompt.length > 4000) return res.status(413).json({ error: "La descripción es demasiado extensa." });
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-image-2.5-flare",
        prompt,
        size: SIZES.has(size) ? size : "1024x1024",
        quality: "low",
        output_format: "jpeg",
        output_compression: 80
      })
    });
    if (!response.ok) return res.status(response.status).json({ error: await readOpenAIError(response) });
    const data = await response.json();
    const encoded = data.data?.[0]?.b64_json;
    if (!encoded) return res.status(502).json({ error: "El modelo no devolvió una imagen." });
    return res.status(200).json({ image: `data:image/jpeg;base64,${encoded}` });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
