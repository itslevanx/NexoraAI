import { extractResponseText, parseJsonBody, readOpenAIError, rejectMethod, resolveApiKey } from "./_shared.js";

const MODES = {
  summarize: "Resume el contenido, identifica la idea central y enumera los puntos clave.",
  rewrite: "Corrige ortografía, gramática y claridad. Conserva el significado y entrega una versión mejorada.",
  translate: "Traduce fielmente el contenido al idioma solicitado y conserva su estructura.",
  study: "Crea una guía de estudio con conceptos, explicaciones, ejemplos, preguntas de repaso y una conclusión.",
  quiz: "Genera un examen con preguntas variadas, opciones cuando corresponda y una clave de respuestas separada.",
  brainstorm: "Propón ideas originales, viables y variadas; organiza ventajas, riesgos y siguientes pasos.",
  email: "Redacta un correo profesional con asunto sugerido, saludo, mensaje claro y cierre.",
  presentation: "Crea un guion de exposición con apertura, desarrollo por secciones, demostración y cierre.",
  code: "Analiza el código, explica su función, detecta errores o riesgos y propone una versión mejorada cuando sea útil.",
  extract: "Extrae la información relevante y devuélvela en una estructura clara con campos y valores.",
  analyze: "Analiza argumentos, supuestos, evidencias, fortalezas, debilidades y conclusiones."
};

export default async function handler(req, res) {
  if (rejectMethod(req, res)) return;
  const apiKey = resolveApiKey(req);
  if (!apiKey) return res.status(401).json({ error: "Falta la OpenAI API Key." });

  try {
    const { mode, instruction = "", content = "", model = "gpt-5-mini" } = parseJsonBody(req);
    if (!MODES[mode]) return res.status(400).json({ error: "Herramienta no válida." });
    if (!content.trim()) return res.status(400).json({ error: "Escribe contenido para procesar." });
    if (content.length > 30000) return res.status(413).json({ error: "El contenido no puede superar 30 000 caracteres." });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        instructions: `Eres NEXORA, una suite académica de IA. ${MODES[mode]} Responde en español salvo que el usuario solicite otro idioma. Sé preciso y usa formato legible.`,
        input: `${instruction ? `Instrucción adicional: ${instruction}\n\n` : ""}${content}`
      })
    });
    if (!response.ok) return res.status(response.status).json({ error: await readOpenAIError(response) });
    const text = extractResponseText(await response.json());
    return res.status(200).json({ text: text || "No se recibió texto del modelo." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
