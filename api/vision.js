import { extractResponseText, parseJsonBody, readOpenAIError, rejectMethod, resolveApiKey } from "./_shared.js";

const MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export default async function handler(req, res) {
  if (rejectMethod(req, res)) return;
  const apiKey = resolveApiKey(req);
  if (!apiKey) return res.status(401).json({ error: "Falta la OpenAI API Key." });

  try {
    const { data = "", mimeType = "", prompt = "Describe la imagen.", model = "gpt-5-mini" } = parseJsonBody(req);
    if (!data || !MIME_TYPES.has(mimeType)) return res.status(400).json({ error: "Imagen no válida. Usa PNG, JPG o WEBP." });
    if (Buffer.byteLength(data, "base64") > 4 * 1024 * 1024) return res.status(413).json({ error: "La imagen debe pesar menos de 4 MB." });
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        instructions: "Eres NEXORA, un analista visual académico. Describe solo lo sustentado por la imagen y distingue observaciones de inferencias.",
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: prompt || "Describe la imagen." },
            { type: "input_image", image_url: `data:${mimeType};base64,${data}` }
          ]
        }]
      })
    });
    if (!response.ok) return res.status(response.status).json({ error: await readOpenAIError(response) });
    const text = extractResponseText(await response.json());
    return res.status(200).json({ text: text || "No se recibió un análisis del modelo." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
