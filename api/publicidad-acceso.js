import { parseJsonBody } from "./_shared.js";
import {
  accessCodeMatches,
  createAdvertisingSession,
  hasAdvertisingAccess,
  resolveAdvertisingAccessCode
} from "./_publicidad-auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido." });
  }
  const secret = resolveAdvertisingAccessCode();
  if (!secret) return res.status(503).json({ error: "El acceso a Publicidad todavía no está configurado." });
  if (hasAdvertisingAccess(req, secret)) return res.status(200).json(createAdvertisingSession(secret));
  try {
    const { code } = parseJsonBody(req);
    if (!accessCodeMatches(String(code || ""), secret)) {
      return res.status(401).json({ error: "Código de acceso incorrecto." });
    }
    return res.status(200).json(createAdvertisingSession(secret));
  } catch {
    return res.status(400).json({ error: "Solicitud de acceso no válida." });
  }
}
