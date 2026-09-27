import assert from "node:assert/strict";
import test from "node:test";
import { buildMessage, validateMail } from "../local-mailer/server.mjs";

test("valida un correo local correcto", () => {
  assert.deepEqual(validateMail({ to: "docente@ejemplo.com", subject: "Demo", text: "Hola" }), {
    to: "docente@ejemplo.com",
    subject: "Demo",
    text: "Hola",
  });
});

test("rechaza destinatarios y encabezados peligrosos", () => {
  assert.throws(() => validateMail({ to: "sin-arroba", text: "Hola" }), /correo válido/);
  assert.throws(() => validateMail({ to: "a@b.com", subject: "Demo\nBcc: x@y.com", text: "Hola" }), /Encabezado/);
});

test("construye un mensaje SMTP UTF-8 y escapa puntos", () => {
  const message = buildMessage({ to: "docente@ejemplo.com", subject: "Exposición académica", text: ".inicio\nfin" }, "demo-id");
  assert.match(message, /Message-ID: <demo-id@nexora.local>/);
  assert.match(message, /Subject: =\?UTF-8\?B\?/);
  assert.match(message, /\r\n\.\.inicio\r\nfin$/);
});
