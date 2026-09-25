import { extractResponseText, parseJsonBody, readOpenAIError, rejectMethod, resolveApiKey } from "./_shared.js";

export default async function handler(req, res) {
  if (rejectMethod(req, res)) return;
  const apiKey = resolveApiKey(req);
  if (!apiKey) return res.status(401).json({ error: "Falta la OpenAI API Key." });

  try {
    const { messages = [], model = "gpt-5-mini" } = parseJsonBody(req);
    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ error: "Envía al menos un mensaje." });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        instructions: "Eres NEXORA, un asistente académico en español. Responde con claridad, precisión y brevedad.",
        input: messages.slice(-14)
      })
    });
    if (!response.ok) return res.status(response.status).json({ error: await readOpenAIError(response) });
    const data = await response.json();
    const text = extractResponseText(data);
    return res.status(200).json({ text: text || "No se recibió texto del modelo." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
