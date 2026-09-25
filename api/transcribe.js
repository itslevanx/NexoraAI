import { parseJsonBody, readOpenAIError, rejectMethod, resolveApiKey } from "./_shared.js";

export const config = {
  api: { bodyParser: { sizeLimit: "5mb" } },
};

export default async function handler(req, res) {
  if (rejectMethod(req, res)) return;
  const apiKey = resolveApiKey(req);
  if (!apiKey) return res.status(401).json({ error: "Falta la OpenAI API Key." });

  try {
    const { data, filename = "audio.webm", mimeType = "audio/webm" } = parseJsonBody(req);
    if (!data) return res.status(400).json({ error: "Selecciona un audio." });
    const bytes = Buffer.from(data, "base64");
    if (bytes.length > 4 * 1024 * 1024) {
      return res.status(413).json({ error: "En Vercel el audio debe pesar menos de 4 MB." });
    }

    const form = new FormData();
    form.set("model", "gpt-4o-mini-transcribe");
    form.set("file", new Blob([bytes], { type: mimeType }), filename);
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form
    });
    if (!response.ok) return res.status(response.status).json({ error: await readOpenAIError(response) });
    const payload = await response.json();
    return res.status(200).json({ text: payload.text || "" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
