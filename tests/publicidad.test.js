import assert from "node:assert/strict";
import test from "node:test";

import handler, { parseCampaign } from "../api/publicidad.js";

function responseRecorder() {
  return {
    statusCode: 200,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
    setHeader() {}
  };
}

test("parseCampaign limpia bloques JSON y limita los campos", () => {
  const campaign = parseCampaign('```json\n{"headline":"Estudia en UTP","supporting":"Tecnología y creatividad para construir tu futuro.","cta":"Conoce más en utp.edu.pe"}\n```');
  assert.deepEqual(campaign, {
    headline: "Estudia en UTP",
    supporting: "Tecnología y creatividad para construir tu futuro.",
    cta: "Conoce más en utp.edu.pe"
  });
});

test("publicidad rechaza solicitudes sin clave", async () => {
  const previous = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  const req = { method: "POST", headers: {}, body: {} };
  const res = responseRecorder();
  await handler(req, res);
  assert.equal(res.statusCode, 401);
  assert.match(res.payload.error, /API Key/);
  if (previous) process.env.OPENAI_API_KEY = previous;
});

test("publicidad valida la longitud del enfoque antes de llamar a OpenAI", async () => {
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "sk-test";
  const req = { method: "POST", headers: {}, body: { brief: "x".repeat(601) } };
  const res = responseRecorder();
  await handler(req, res);
  assert.equal(res.statusCode, 413);
  assert.match(res.payload.error, /600/);
  if (previous) process.env.OPENAI_API_KEY = previous;
  else delete process.env.OPENAI_API_KEY;
});
