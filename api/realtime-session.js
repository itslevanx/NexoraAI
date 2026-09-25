import { readOpenAIError, rejectMethod, resolveApiKey } from "./_shared.js";

export const config = {
  // El navegador envía la oferta dentro de JSON porque Vercel no transforma
  // application/sdp de forma consistente en todas sus funciones Node.js.
  api: { bodyParser: { sizeLimit: "256kb" } },
};

const MAX_SDP_BYTES = 128 * 1024;

export async function readSdpBody(req) {
  let sdp;
  if (typeof req.body === "string") sdp = req.body;
  else if (Buffer.isBuffer(req.body)) sdp = req.body.toString("utf8");
  else if (typeof req.body?.sdp === "string") sdp = req.body.sdp;
  else {
    const chunks = [];
    let total = 0;
    for await (const chunk of req) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += bytes.length;
      if (total > MAX_SDP_BYTES) {
        const error = new Error("La oferta WebRTC supera el tamaño permitido.");
        error.statusCode = 413;
        throw error;
      }
      chunks.push(bytes);
    }
    sdp = Buffer.concat(chunks).toString("utf8");
  }

  if (Buffer.byteLength(sdp, "utf8") > MAX_SDP_BYTES) {
    const error = new Error("La oferta WebRTC supera el tamaño permitido.");
    error.statusCode = 413;
    throw error;
  }
  return sdp.trim();
}

export default async function handler(req, res) {
  if (rejectMethod(req, res)) return;

  const apiKey = resolveApiKey(req);
  if (!apiKey) {
    return res.status(401).json({ error: "Configura OPENAI_API_KEY en Vercel o pega una clave temporal." });
  }

  let sdp;
  try {
    sdp = await readSdpBody(req);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ error: error.message });
  }
  if (!/^v=0(?:\r?\n|$)/.test(sdp)) {
    return res.status(400).json({ error: "La oferta WebRTC no es válida." });
  }

  const form = new FormData();
  form.set("sdp", sdp);
  form.set(
    "session",
    JSON.stringify({
      type: "realtime",
      model: "gpt-realtime-2.1",
      instructions:
        "Eres NEXORA, un asistente de voz académico en español. Habla de forma natural, breve y clara. Haz una pregunta a la vez. Si no sabes algo, dilo. No afirmes que ejecutaste acciones externas sin confirmación.",
      audio: {
        input: {
          transcription: { model: "gpt-4o-mini-transcribe" },
          turn_detection: { type: "server_vad" }
        },
        output: { voice: "marin" }
      }
    })
  );

  try {
    const response = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form
    });

    if (!response.ok) {
      const message = await readOpenAIError(response);
      return res.status(response.status).json({ error: message });
    }

    res.setHeader("Content-Type", "application/sdp");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(await response.text());
  } catch (error) {
    return res.status(502).json({ error: `No se pudo iniciar la sesión de voz: ${error.message}` });
  }
}
