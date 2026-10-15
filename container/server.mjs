import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const PUBLIC = join(ROOT, "public");
const PORT = Number(process.env.PORT || 3000);
const API_ROUTES = new Set([
  "automation", "chat", "image", "moderate", "publicidad-acceso",
  "publicidad-video", "publicidad", "realtime-session", "speech", "studio", "transcribe", "vision"
]);
const TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

function decorateResponse(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => {
    if (!res.headersSent) res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(payload));
    return res;
  };
  res.send = (payload) => { res.end(payload); return res; };
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 12 * 1024 * 1024) throw new Error("La solicitud supera 12 MB.");
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  if (!buffer.length) return {};
  if ((req.headers["content-type"] || "").includes("application/json")) return JSON.parse(buffer.toString("utf8"));
  return buffer;
}

async function serveApi(req, res, route, url) {
  if (!API_ROUTES.has(route)) return res.status(404).json({ error: "Endpoint no encontrado." });
  req.query = Object.fromEntries(url.searchParams.entries());
  req.body = await readBody(req);
  const module = await import(`../api/${route}.js`);
  return module.default(req, res);
}

async function serveStatic(res, pathname) {
  const requested = pathname === "/" || pathname === "/publicidad" ? "index.html" : pathname.replace(/^\//, "");
  const safe = normalize(requested).replace(/^(\.\.(\/|\\|$))+/, "");
  const path = join(PUBLIC, safe);
  if (!path.startsWith(PUBLIC)) return res.status(403).send("Acceso denegado");
  try {
    const body = await readFile(path);
    res.setHeader("Content-Type", TYPES[extname(path)] || "application/octet-stream");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Permissions-Policy", "microphone=(self), camera=(self)");
    return res.status(200).send(body);
  } catch {
    return res.status(404).send("No encontrado");
  }
}

createServer(async (req, res) => {
  decorateResponse(res);
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (url.pathname === "/health") return res.status(200).json({ status: "ok", service: "nexora-ai" });
    if (url.pathname.startsWith("/api/")) return await serveApi(req, res, url.pathname.slice(5), url);
    return await serveStatic(res, url.pathname);
  } catch (error) {
    if (!res.headersSent) return res.status(500).json({ error: error.message || "Error interno." });
    res.end();
  }
}).listen(PORT, "0.0.0.0", () => {
  console.log(`NEXORA AI disponible en http://0.0.0.0:${PORT}`);
});
