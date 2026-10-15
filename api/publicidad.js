import { parseJsonBody, rejectMethod } from "./_shared.js";
import {
  GEMINI_BASE_URL,
  VEO_MODEL,
  createDownloadToken,
  extractVideoFailure,
  extractVideoUri,
  isValidOperationName,
  readGeminiError,
  resolveGeminiApiKey
} from "./_gemini-video.js";
import { hasAdvertisingAccess, resolveAdvertisingAccessCode } from "./_publicidad-auth.js";
import galleryHandler from "./_publicidad-galeria.js";

const TONES = new Set(["inspirador", "tecnologico", "energetico", "institucional"]);
const DURATIONS = new Map([
  [10, [8]],
  [15, [8, 8]],
  [20, [8, 8, 4]],
  [30, [8, 8, 8, 6]]
]);
const MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const CAMPAIGNS = {
  inspirador: {
    headline: "Convierte tu futuro en acción",
    supporting: "Aprende, crea y transforma con la Universidad Tecnológica del Perú."
  },
  tecnologico: {
    headline: "Diseña el futuro con tecnología",
    supporting: "Convierte tus ideas en proyectos que pueden transformar el mundo."
  },
  energetico: {
    headline: "El momento de avanzar es ahora",
    supporting: "Descubre nuevos retos y construye el camino hacia tu futuro profesional."
  },
  institucional: {
    headline: "Formación para transformar tu futuro",
    supporting: "Conocimiento, tecnología y creatividad para avanzar con propósito."
  }
};

function cleanText(value, limit) {
  return String(value || "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, limit);
}

function parseImage(data, mimeType) {
  if (!MIME_TYPES.has(mimeType)) throw new Error("Usa una imagen JPG, PNG o WEBP.");
  const normalized = String(data || "").replace(/^data:[^;]+;base64,/, "");
  if (!normalized || !/^[A-Za-z0-9+/=]+$/.test(normalized)) throw new Error("La imagen no es válida.");
  const bytes = Buffer.byteLength(normalized, "base64");
  if (!bytes || bytes > MAX_IMAGE_BYTES) throw new Error("La imagen optimizada debe pesar menos de 3 MB.");
  return normalized;
}

function narrationFor(index, total, brief) {
  const normalized = brief.toLowerCase();
  if (total === 1 && /\b(ia|ai|inteligencia artificial|machine learning|ml)\b/.test(normalized)) {
    return "En la UTP, convierte la inteligencia artificial en proyectos para el mundo real.";
  }
  if (total === 1) return "En la UTP, convierte tus ideas en acción y transforma tu futuro.";
  if (index === total - 1) return "Descubre tu próximo paso en utp punto edu punto pe.";
  return [
    "Tu futuro empieza con una decisión.",
    "En la Universidad Tecnológica del Perú, transforma tus ideas en acción.",
    "Aprende, crea y prepárate para los retos del mundo real."
  ][index % 3];
}

function scenePrompt({ brief, tone, index, total }) {
  const toneDirection = {
    inspirador: "hopeful, aspirational, emotionally uplifting",
    tecnologico: "futuristic, precise, innovative, premium technology",
    energetico: "dynamic, youthful, high-energy, confident",
    institucional: "credible, elegant, warm, premium institutional"
  }[tone];
  const sceneDirections = [
    "Use the supplied image itself as the literal opening frame and immutable visual anchor. Hold its recognizable composition briefly, then animate the same people, objects and location into one coherent eight-second story. Reveal the existing subject actively demonstrating the requested concept and finish on a confident human reaction or a clear result. Use motivated camera movement and intentional cuts, not a random montage.",
    "Show believable collaboration around the requested concept: specific actions, clear eyelines, natural gestures and one visual focal point. Move from a medium shot to a purposeful detail and finish on the people, not on an interface.",
    "Continue the same visual story inside a contemporary Peruvian university environment. Show practical learning, authentic teamwork and a tangible result with spatial continuity.",
    "Deliver an emotional payoff through real people, a finished project and forward momentum. End with clean negative space suitable for a professional UTP brand signature in post-production."
  ];
  const focus = brief
    ? `Mandatory user creative direction: ${brief}. Reimagine that concept freely as the central story and visual world of this UTP advertisement; do not ignore or replace it.`
    : "Creative direction: turn a simple idea into a specific story about practical learning, creativity, university life and professional growth.";
  return [
    `Act as an award-winning commercial director. Create shot ${index + 1} of ${total} for a premium cinematic advertisement whose unmistakable purpose is to promote Universidad Tecnológica del Perú (UTP). The result must remain a UTP advertisement regardless of the user's creative direction.`,
    sceneDirections[index % sceneDirections.length],
    focus,
    `Image fidelity is mandatory: preserve every visible person's face, age, skin tone, body, clothing and role; preserve the main objects, product, sign or location that defines the supplied image. Do not replace the subject, invent a different presenter, or discard the photographed context. If no person is visible, animate the actual photographed object or place and do not add a new hero person. Visual direction: ${toneDirection}; contemporary Peruvian setting; cinematic but natural lighting; realistic photography; premium commercial color grade; smooth stabilized camera; coherent anatomy. Use UTP's red, black and white palette naturally in lighting or environment without turning the scene into a graphic banner.`,
    "Art direction: make every prop and screen believable and legible as a single designed system. Avoid generic stock-video staging, floating holograms, duplicated screens, random futuristic HUD elements, distorted hands, visual clutter and abrupt transformations unless the user explicitly requests them.",
    `Audio: original modern cinematic music that builds to a satisfying finish, subtle realistic ambience, and a warm confident adult Peruvian Spanish narrator who says exactly: "${narrationFor(index, total, brief)}"`,
    "Do not render captions, invented words or watermarks. Do not invent rankings, statistics, prices, accreditations or guarantees. Leave clean composition space because the authentic UTP logo and exact call to action will be added during professional post-production."
  ].join(" ");
}

function buildCampaign(tone, brief = "") {
  const normalized = cleanText(brief, 600).toLowerCase();
  if (/\b(ia|ai|inteligencia artificial|machine learning|ml)\b/.test(normalized)) {
    return {
      headline: "IDEAS QUE ACTIVAN EL FUTURO",
      supporting: "Convierte inteligencia artificial y machine learning en proyectos para el mundo real.",
      cta: "Conoce más en utp.edu.pe"
    };
  }
  if (/fruti|novela|historia|cine|creativ/.test(normalized)) {
    return {
      headline: "CREATIVIDAD QUE ROMPE EL MOLDE",
      supporting: "En la UTP, una idea diferente puede convertirse en una historia con propósito.",
      cta: "Conoce más en utp.edu.pe"
    };
  }
  if (/deport|fútbol|futbol|atlet|compet/.test(normalized)) {
    return {
      headline: "TALENTO QUE SE ENTRENA",
      supporting: "Disciplina, tecnología y trabajo en equipo para avanzar con propósito.",
      cta: "Conoce más en utp.edu.pe"
    };
  }
  const base = CAMPAIGNS[tone];
  return {
    headline: base.headline,
    supporting: base.supporting,
    cta: "Conoce más en utp.edu.pe"
  };
}

function buildDurationPlan(duration) {
  const generationDurations = DURATIONS.get(duration);
  if (!generationDurations) throw new Error("Elige una duración de 10, 15, 20 o 30 segundos.");
  return {
    generationDurations,
    clipDurations: duration === 10 ? [10] : generationDurations
  };
}

function buildVeoRequest({ image, mimeType, aspectRatio, seconds, prompt }) {
  return {
    instances: [{
      prompt,
      image: {
        bytesBase64Encoded: image,
        mimeType
      }
    }],
    parameters: {
      aspectRatio,
      durationSeconds: seconds,
      resolution: "720p",
      personGeneration: "allow_adult"
    }
  };
}

async function startClip({ apiKey, image, mimeType, aspectRatio, seconds, prompt }) {
  const response = await fetch(`${GEMINI_BASE_URL}/models/${VEO_MODEL}:predictLongRunning`, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(buildVeoRequest({ image, mimeType, aspectRatio, seconds, prompt }))
  });
  if (!response.ok) throw new Error(await readGeminiError(response));
  const operation = await response.json();
  if (!isValidOperationName(operation.name)) throw new Error("Google no devolvió una operación de video válida.");
  return operation.name;
}

async function startGeneration(body, apiKey) {
  const duration = Number(body.duration);
  const { generationDurations, clipDurations } = buildDurationPlan(duration);
  const tone = TONES.has(body.tone) ? body.tone : "inspirador";
  const brief = cleanText(body.brief, 600);
  const mimeType = String(body.mimeType || "");
  const image = parseImage(body.image, mimeType);
  const aspectRatio = body.format === "landscape" ? "16:9" : "9:16";
  const operations = await Promise.all(generationDurations.map((seconds, index) => startClip({
    apiKey,
    image,
    mimeType,
    aspectRatio,
    seconds,
    prompt: scenePrompt({ brief, tone, index, total: generationDurations.length })
  })));
  const generatedSeconds = generationDurations.reduce((sum, value) => sum + value, 0);
  return {
    operations,
    clipDurations,
    duration,
    generatedSeconds,
    estimatedCostUsd: Number((generatedSeconds * .10).toFixed(2)),
    model: VEO_MODEL,
    campaign: buildCampaign(tone, brief)
  };
}

async function getStatus(body, apiKey) {
  const operations = Array.isArray(body.operations) ? body.operations : [];
  if (!operations.length || operations.length > 4 || operations.some((name) => !isValidOperationName(name))) {
    throw new Error("La lista de operaciones no es válida.");
  }
  const results = await Promise.all(operations.map(async (name) => {
    const response = await fetch(`${GEMINI_BASE_URL}/${name}`, { headers: { "x-goog-api-key": apiKey } });
    if (!response.ok) throw new Error(await readGeminiError(response));
    const operation = await response.json();
    const uri = operation.done ? extractVideoUri(operation) : "";
    return {
      name,
      done: Boolean(operation.done),
      error: operation.done && !uri ? extractVideoFailure(operation) : operation?.error?.message || "",
      downloadToken: uri ? createDownloadToken(uri, apiKey) : ""
    };
  }));
  return { done: results.every((result) => result.done), results };
}

export default async function handler(req, res) {
  if (req.query?.gallery === "1") return galleryHandler(req, res);
  if (rejectMethod(req, res)) return;
  const accessCode = resolveAdvertisingAccessCode();
  if (!accessCode) return res.status(503).json({ error: "El acceso a Publicidad todavía no está configurado." });
  if (!hasAdvertisingAccess(req, accessCode)) return res.status(401).json({ error: "Debes desbloquear Publicidad para continuar." });
  const apiKey = resolveGeminiApiKey();
  if (!apiKey) return res.status(503).json({ error: "Falta configurar GEMINI_API_KEY en Vercel." });
  try {
    const body = parseJsonBody(req);
    const result = body.action === "status"
      ? await getStatus(body, apiKey)
      : await startGeneration(body, apiKey);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || "No fue posible procesar la publicidad con Gemini." });
  }
}

export { buildCampaign, buildDurationPlan, buildVeoRequest, scenePrompt };
