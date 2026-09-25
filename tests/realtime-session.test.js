import assert from "node:assert/strict";
import { Readable } from "node:stream";
import test from "node:test";

import { readSdpBody } from "../api/realtime-session.js";

const OFFER = "v=0\r\no=- 1 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n";

test("lee una oferta SDP cruda enviada en varios fragmentos", async () => {
  const request = Readable.from([Buffer.from(OFFER.slice(0, 12)), OFFER.slice(12)]);
  assert.equal(await readSdpBody(request), OFFER);
});

test("acepta un cuerpo SDP que ya fue convertido a texto", async () => {
  const request = Readable.from([]);
  request.body = OFFER;
  assert.equal(await readSdpBody(request), OFFER);
});

test("acepta la oferta SDP dentro del JSON enviado por el navegador", async () => {
  const request = Readable.from([]);
  request.body = { sdp: OFFER };
  assert.equal(await readSdpBody(request), OFFER);
});

test("conserva el CRLF final obligatorio de la oferta SDP", async () => {
  const request = Readable.from([]);
  request.body = { sdp: OFFER };
  assert.match(await readSdpBody(request), /\r\n$/);
});

test("rechaza una oferta SDP excesivamente grande", async () => {
  const request = Readable.from([Buffer.alloc(128 * 1024 + 1, "a")]);
  await assert.rejects(readSdpBody(request), (error) => error.statusCode === 413);
});

test("rechaza una oferta SDP excesiva aunque Vercel ya haya procesado el JSON", async () => {
  const request = Readable.from([]);
  request.body = { sdp: `v=0\r\n${"a".repeat(128 * 1024)}` };
  await assert.rejects(readSdpBody(request), (error) => error.statusCode === 413);
});
