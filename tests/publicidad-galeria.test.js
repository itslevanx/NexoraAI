import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";

import handler, { cleanText } from "../api/_publicidad-galeria.js";
import { createAdvertisingSession } from "../api/_publicidad-auth.js";
import { safeStorageExtension } from "../api/_supabase.js";

function responseRecorder() {
  return {
    statusCode: 200,
    payload: null,
    headers: {},
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
    setHeader(name, value) { this.headers[name] = value; }
  };
}

test("la galería limpia texto y limita rutas a tipos permitidos", () => {
  assert.equal(cleanText("  campaña <UTP>\n tecnológica  ", 30), "campaña UTP tecnológica");
  assert.equal(safeStorageExtension("image/jpeg"), "jpg");
  assert.equal(safeStorageExtension("video/webm"), "webm");
  assert.equal(safeStorageExtension("text/html"), "");
});

test("la galería exige sesión de Publicidad", async () => {
  const previous = process.env.PUBLICIDAD_ACCESS_CODE;
  process.env.PUBLICIDAD_ACCESS_CODE = "codigo-de-prueba";
  const res = responseRecorder();
  await handler({ method: "GET", headers: {} }, res);
  assert.equal(res.statusCode, 401);
  if (previous) process.env.PUBLICIDAD_ACCESS_CODE = previous;
  else delete process.env.PUBLICIDAD_ACCESS_CODE;
});

test("la galería informa si Supabase no está configurado sin llamar APIs de IA", async () => {
  const previousAccess = process.env.PUBLICIDAD_ACCESS_CODE;
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SECRET_KEY;
  process.env.PUBLICIDAD_ACCESS_CODE = "codigo-de-prueba";
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SECRET_KEY;
  const session = createAdvertisingSession("codigo-de-prueba");
  const res = responseRecorder();
  await handler({ method: "GET", headers: { "x-publicidad-token": session.token } }, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.payload.error, /SUPABASE_URL/);
  if (previousAccess) process.env.PUBLICIDAD_ACCESS_CODE = previousAccess;
  else delete process.env.PUBLICIDAD_ACCESS_CODE;
  if (previousUrl) process.env.SUPABASE_URL = previousUrl;
  if (previousKey) process.env.SUPABASE_SECRET_KEY = previousKey;
});

test("la migración crea tabla, RLS y bucket privado", () => {
  const migration = readFileSync(new URL("../supabase/migrations/20261014191947_publicidad_gallery.sql", import.meta.url), "utf8");
  assert.match(migration, /create table if not exists public\.publicidad_items/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all .* anon, authenticated/);
  assert.match(migration, /grant select, insert, update, delete .* service_role/);
  assert.match(migration, /'publicidad-utp'/);
  assert.match(migration, /false,/);
});

test("la interfaz contiene una galería y el despliegue tiene contenedor web", () => {
  const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  const compose = readFileSync(new URL("../docker-compose.yml", import.meta.url), "utf8");
  assert.match(html, /id="advertisingGallery"/);
  assert.match(html, /id="galleryVideos"/);
  assert.match(compose, /nexora:/);
  assert.match(compose, /SUPABASE_SECRET_KEY/);
});

test("el despliegue Hobby conserva un máximo de doce funciones públicas", () => {
  const apiDirectory = new URL("../api/", import.meta.url);
  const publicFunctions = readdirSync(apiDirectory)
    .filter((name) => name.endsWith(".js") && !name.startsWith("_"));
  assert.ok(publicFunctions.length <= 12, `Se encontraron ${publicFunctions.length} funciones públicas.`);
});
