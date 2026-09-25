import { parseJsonBody, readOpenAIError, rejectMethod, resolveApiKey } from "./_shared.js";

export default async function handler(req, res) {
  if (rejectMethod(req, res)) return;
  const apiKey = resolveApiKey(req);
  if (!apiKey) return res.status(401).json({ error: "Falta la OpenAI API Key." });

  try {
    const { text = "" } = parseJsonBody(req);
    if (!text.trim()) return res.status(400).json({ error: "No hay texto para narrar." });
    if (text.length > 2500) return res.status(413).json({ error: "La narración admite hasta 2500 caracteres por solicitud." });
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "marin",
        input: text,
        instructions: "Habla en español con voz natural, clara, profesional y ritmo moderado.",
        response_format: "mp3"
      })
    });
    if (!response.ok) return res.status(response.status).json({ error: await readOpenAIError(response) });
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
