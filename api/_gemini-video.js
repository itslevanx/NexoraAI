import { createHmac, timingSafeEqual } from "node:crypto";

export const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
export const VEO_MODEL = "veo-3.1-fast-generate-preview";

export function resolveGeminiApiKey() {
  return (process.env.GEMINI_API_KEY || "").trim();
}

export async function readGeminiError(response) {
  const text = await response.text();
  try {
    const payload = JSON.parse(text);
    return payload?.error?.message || payload?.message || text;
  } catch {
    return text || `Google Gemini respondió con HTTP ${response.status}.`;
  }
}

export function isValidOperationName(value) {
  return typeof value === "string"
    && value.length <= 500
    && !value.includes("..")
    && /^(?:models\/[^/]+\/)?operations\/[A-Za-z0-9._/-]+$/.test(value);
}

export function extractVideoUri(operation) {
  return operation?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri
    || operation?.response?.generatedVideos?.[0]?.video?.uri
    || "";
}

export function extractVideoFailure(operation) {
  const direct = operation?.error?.message;
  if (direct) return direct;
  const reasons = operation?.response?.generateVideoResponse?.raiMediaFilteredReasons
    || operation?.response?.raiMediaFilteredReasons
    || operation?.metadata?.raiMediaFilteredReasons
    || [];
  if (Array.isArray(reasons) && reasons.length) return reasons.filter(Boolean).join(" ");
  return "Google Veo terminó la toma sin entregar un archivo de video. El contenido pudo ser filtrado por sus controles de seguridad o audio.";
}

function encode(value) {
  return Buffer.from(value).toString("base64url");
}

function sign(payload, secret) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createDownloadToken(uri, secret) {
  const payload = encode(JSON.stringify({ uri, exp: Date.now() + 60 * 60 * 1000 }));
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyDownloadToken(token, secret) {
  if (typeof token !== "string" || token.length > 5000) return "";
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return "";
  const expected = sign(payload, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return "";
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!decoded.uri || decoded.exp < Date.now()) return "";
    const url = new URL(decoded.uri);
    if (url.protocol !== "https:" || url.hostname !== "generativelanguage.googleapis.com") return "";
    return url.toString();
  } catch {
    return "";
  }
}
