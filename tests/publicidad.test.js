import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import handler, { buildCampaign, buildDurationPlan, buildVeoRequest, scenePrompt } from "../api/publicidad.js";
import { extractVideoFailure } from "../api/_gemini-video.js";
import { accessCodeMatches, createAdvertisingSession, verifyAdvertisingSession } from "../api/_publicidad-auth.js";

function responseRecorder() {
  return {
    statusCode: 200,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
    setHeader() {}
  };
}

test("la campaña conserva identidad UTP", () => {
  assert.deepEqual(buildCampaign("inspirador"), {
    headline: "Convierte tu futuro en acción",
    supporting: "Aprende, crea y transforma con la Universidad Tecnológica del Perú.",
    cta: "Conoce más en utp.edu.pe"
  });
});

test("cualquier concepto creativo se reinterpreta como publicidad UTP", () => {
  const prompt = scenePrompt({ brief: "una escena de frutinovelas", tone: "energetico", index: 0, total: 2 });
  assert.match(prompt, /frutinovelas/);
  assert.match(prompt, /Universidad Tecnológica del Perú/);
  assert.match(prompt, /must remain a UTP advertisement/);
  assert.match(prompt, /Avoid generic stock-video staging/);
  assert.match(prompt, /authentic UTP logo/);
});

test("un prompt básico de IA recibe dirección y textos creativos", () => {
  const campaign = buildCampaign("institucional", "expositor de IA y ML");
  assert.equal(campaign.headline, "IDEAS QUE ACTIVAN EL FUTURO");
  assert.match(campaign.supporting, /inteligencia artificial/);
  const prompt = scenePrompt({ brief: "expositor de IA y ML", tone: "institucional", index: 0, total: 1 });
  assert.match(prompt, /one coherent eight-second story/);
  assert.match(prompt, /floating holograms/);
  assert.match(prompt, /convierte la inteligencia artificial/);
  assert.match(prompt, /literal opening frame/);
  assert.match(prompt, /Do not replace the subject/);
});

test("Veo recibe la imagen con el formato de predicción compatible", () => {
  const request = buildVeoRequest({
    image: "aW1hZ2Vu",
    mimeType: "image/jpeg",
    aspectRatio: "9:16",
    seconds: 6,
    prompt: "Campaña UTP"
  });
  assert.deepEqual(request.instances[0].image, {
    bytesBase64Encoded: "aW1hZ2Vu",
    mimeType: "image/jpeg"
  });
  assert.equal("inlineData" in request.instances[0].image, false);
  assert.deepEqual(request.parameters, {
    aspectRatio: "9:16",
    durationSeconds: 6,
    resolution: "720p",
    personGeneration: "allow_adult"
  });
});

test("el video de diez segundos usa una sola toma de Veo", () => {
  assert.deepEqual(buildDurationPlan(10), {
    generationDurations: [8],
    clipDurations: [10]
  });
});

test("los filtros de Veo se muestran como un error comprensible", () => {
  const operation = {
    response: {
      generateVideoResponse: {
        raiMediaFilteredReasons: ["El audio solicitado fue filtrado."]
      }
    }
  };
  assert.equal(extractVideoFailure(operation), "El audio solicitado fue filtrado.");
});

test("la ruta directa de Publicidad reescribe hacia la aplicación", () => {
  const vercel = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  const rewrite = vercel.rewrites.find((entry) => entry.source === "/publicidad");
  assert.deepEqual(rewrite, { source: "/publicidad", destination: "/" });
});

test("Safari puede finalizar o recuperar una toma sin regenerarla", () => {
  const web = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  const client = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(web, /id="finishAdvertisingVideo"/);
  assert.match(web, /id="recoverAdvertisingClip"/);
  assert.match(client, /Toma lista · pulsa Finalizar video/);
});

test("la sesión de Publicidad se firma y rechaza alteraciones", () => {
  const session = createAdvertisingSession("codigo-de-prueba");
  assert.equal(verifyAdvertisingSession(session.token, "codigo-de-prueba"), true);
  assert.equal(verifyAdvertisingSession(`${session.token}x`, "codigo-de-prueba"), false);
  assert.equal(accessCodeMatches("correcto", "correcto"), true);
  assert.equal(accessCodeMatches("incorrecto", "correcto"), false);
});

test("publicidad exige la clave de Gemini configurada en el servidor", async () => {
  const previous = process.env.GEMINI_API_KEY;
  const previousAccess = process.env.PUBLICIDAD_ACCESS_CODE;
  delete process.env.GEMINI_API_KEY;
  process.env.PUBLICIDAD_ACCESS_CODE = "codigo-de-prueba";
  const session = createAdvertisingSession("codigo-de-prueba");
  const req = { method: "POST", headers: { "x-publicidad-token": session.token }, body: {} };
  const res = responseRecorder();
  await handler(req, res);
  assert.equal(res.statusCode, 503);
  assert.match(res.payload.error, /GEMINI_API_KEY/);
  if (previous) process.env.GEMINI_API_KEY = previous;
  if (previousAccess) process.env.PUBLICIDAD_ACCESS_CODE = previousAccess;
  else delete process.env.PUBLICIDAD_ACCESS_CODE;
});

test("publicidad exige una duración final permitida antes de llamar a Veo", async () => {
  const previous = process.env.GEMINI_API_KEY;
  const previousAccess = process.env.PUBLICIDAD_ACCESS_CODE;
  process.env.GEMINI_API_KEY = "test-key";
  process.env.PUBLICIDAD_ACCESS_CODE = "codigo-de-prueba";
  const session = createAdvertisingSession("codigo-de-prueba");
  const req = { method: "POST", headers: { "x-publicidad-token": session.token }, body: { duration: 8 } };
  const res = responseRecorder();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.payload.error, /10, 15, 20 o 30/);
  if (previous) process.env.GEMINI_API_KEY = previous;
  else delete process.env.GEMINI_API_KEY;
  if (previousAccess) process.env.PUBLICIDAD_ACCESS_CODE = previousAccess;
  else delete process.env.PUBLICIDAD_ACCESS_CODE;
});
