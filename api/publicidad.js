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

function narrationFor(index, total) {
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
    "Begin from the supplied image and reveal a modern Peruvian university environment with a smooth cinematic dolly movement and natural human motion.",
    "Transform the moment into a collaborative technology and innovation scene with students building, designing and solving a real challenge.",
    "Move through a bright contemporary campus and finish with the subject looking confidently toward a new professional future.",
    "Create an energetic closing montage of learning, technology, teamwork and achievement with a controlled forward camera move."
  ];
  const focus = brief
    ? `Mandatory user creative direction: ${brief}. Reimagine that concept freely as the central story and visual world of this UTP advertisement; do not ignore or replace it.`
    : "Creative direction: technology, creativity, university life and professional growth.";
  return [
    `Create shot ${index + 1} of ${total} for a cinematic advertisement whose unmistakable purpose is to promote Universidad Tecnológica del Perú (UTP). The result must remain a UTP advertisement regardless of the user's creative direction.`,
    sceneDirections[index % sceneDirections.length],
    focus,
    `Visual direction: ${toneDirection}; cinematic lighting; realistic photography; premium commercial color grade; smooth stabilized camera; coherent anatomy; preserve the identity and essential appearance of the main subject in the supplied image.`,
    `Audio: modern cinematic music, subtle campus ambience, and a clear adult Peruvian Spanish narrator who says exactly: "${narrationFor(index, total)}"`,
    "Do not render captions, letters, logos or watermarks. Do not invent rankings, statistics, prices, accreditations or guarantees. The exact UTP brand and call to action will be added during editing."
  ].join(" ");
}

function buildCampaign(tone) {
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
    campaign: buildCampaign(tone)
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
