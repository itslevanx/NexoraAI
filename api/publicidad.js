import { extractResponseText, parseJsonBody, readOpenAIError, rejectMethod, resolveApiKey } from "./_shared.js";

const TONES = new Set(["inspirador", "tecnologico", "energetico", "institucional"]);
const DURATIONS = new Set([10, 15, 20, 30]);
const FALLBACK = {
  headline: "Convierte tu futuro en acción",
  supporting: "Aprende, crea y transforma con la Universidad Tecnológica del Perú.",
  cta: "Conoce más en utp.edu.pe"
};

function parseCampaign(text) {
  const normalized = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const match = normalized.match(/\{[\s\S]*\}/);
  if (!match) return FALLBACK;
  try {
    const data = JSON.parse(match[0]);
    return {
      headline: String(data.headline || FALLBACK.headline).slice(0, 54),
      supporting: String(data.supporting || FALLBACK.supporting).slice(0, 120),
      cta: String(data.cta || FALLBACK.cta).slice(0, 48)
    };
  } catch {
    return FALLBACK;
  }
}

export default async function handler(req, res) {
  if (rejectMethod(req, res)) return;
  const apiKey = resolveApiKey(req);
  if (!apiKey) return res.status(401).json({ error: "Falta la OpenAI API Key." });

  try {
    const { brief = "", tone = "inspirador", duration = 15, model = "gpt-5-mini" } = parseJsonBody(req);
    if (brief.length > 600) return res.status(413).json({ error: "El enfoque no puede superar 600 caracteres." });
    const safeTone = TONES.has(tone) ? tone : "inspirador";
    const safeDuration = DURATIONS.has(Number(duration)) ? Number(duration) : 15;
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        instructions: [
          "Eres un redactor publicitario responsable para una demostración académica de NEXORA AI.",
          "Crea un microguion en español para promocionar la Universidad Tecnológica del Perú, UTP.",
          "No inventes rankings, cifras, acreditaciones, precios, fechas, empleabilidad garantizada ni beneficios no incluidos por el usuario.",
          "Evita afirmar que NEXORA representa oficialmente a la universidad.",
          "Devuelve solamente JSON válido con headline, supporting y cta.",
          "headline: máximo 54 caracteres; supporting: máximo 120; cta: máximo 48 e incluye utp.edu.pe."
        ].join(" "),
        input: `Duración: ${safeDuration} segundos. Tono: ${safeTone}. Enfoque opcional: ${brief.trim() || "formación tecnológica, creatividad y futuro profesional"}.`
      })
    });
    if (!response.ok) return res.status(response.status).json({ error: await readOpenAIError(response) });
    return res.status(200).json(parseCampaign(extractResponseText(await response.json())));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export { parseCampaign };
