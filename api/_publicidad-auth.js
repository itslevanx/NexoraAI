import { createHmac, createHash, timingSafeEqual } from "node:crypto";

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export function resolveAdvertisingAccessCode() {
  return (process.env.PUBLICIDAD_ACCESS_CODE || "").trim();
}

function digest(value) {
  return createHash("sha256").update(String(value)).digest();
}

export function accessCodeMatches(value, expected) {
  if (!value || !expected) return false;
  return timingSafeEqual(digest(value), digest(expected));
}

function sign(payload, secret) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createAdvertisingSession(secret) {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_DURATION_MS })).toString("base64url");
  return { token: `${payload}.${sign(payload, secret)}`, expiresIn: SESSION_DURATION_MS };
}

export function verifyAdvertisingSession(token, secret) {
  if (typeof token !== "string" || !secret || token.length > 1000) return false;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return false;
  const actual = Buffer.from(signature);
  const expected = Buffer.from(sign(payload, secret));
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number.isFinite(decoded.exp) && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

export function hasAdvertisingAccess(req, secret = resolveAdvertisingAccessCode()) {
  const header = req.headers?.["x-publicidad-token"];
  const token = Array.isArray(header) ? header[0] : header;
  return verifyAdvertisingSession(token, secret);
}
