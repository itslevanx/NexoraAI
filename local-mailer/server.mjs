import http from "node:http";
import net from "node:net";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateMail({ to, subject, text }) {
  const recipient = String(to || "").trim();
  const cleanSubject = String(subject || "Mensaje de NEXORA AI").trim();
  const body = String(text || "").trim();
  if (!EMAIL_PATTERN.test(recipient)) throw new Error("El destinatario no es un correo válido.");
  if (!body) throw new Error("El correo no puede estar vacío.");
  if (cleanSubject.length > 200 || body.length > 20_000) throw new Error("El correo supera el tamaño permitido.");
  if (/\r|\n/.test(cleanSubject) || /\r|\n/.test(recipient)) throw new Error("Encabezado de correo no válido.");
  return { to: recipient, subject: cleanSubject, text: body };
}

function mimeHeader(value) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

export function buildMessage(input, messageId = crypto.randomUUID()) {
  const mail = validateMail(input);
  const escapedBody = mail.text.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
  return [
    "From: NEXORA AI <noreply@nexora.local>",
    `To: ${mail.to}`,
    `Subject: ${mimeHeader(mail.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${messageId}@nexora.local>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    escapedBody,
  ].join("\r\n");
}

function readReply(socket) {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const onData = (chunk) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split("\r\n").filter(Boolean);
      const finalLine = lines.findLast((line) => /^\d{3} /.test(line));
      if (!finalLine) return;
      cleanup();
      resolve({ code: Number(finalLine.slice(0, 3)), text: buffer.trim() });
    };
    const onError = (error) => { cleanup(); reject(error); };
    const onClose = () => { cleanup(); reject(new Error("El servidor SMTP cerró la conexión.")); };
    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
      socket.off("close", onClose);
    };
    socket.on("data", onData);
    socket.once("error", onError);
    socket.once("close", onClose);
  });
}

async function smtpCommand(socket, command, expected) {
  socket.write(`${command}\r\n`);
  const reply = await readReply(socket);
  if (!expected.includes(reply.code)) throw new Error(`SMTP ${reply.code}: ${reply.text}`);
  return reply;
}

export async function sendSmtp(input, options = {}) {
  const mail = validateMail(input);
  const host = options.host || process.env.SMTP_HOST || "mailpit";
  const port = Number(options.port || process.env.SMTP_PORT || 1025);
  const messageId = crypto.randomUUID();
  const socket = net.createConnection({ host, port });
  socket.setTimeout(10_000, () => socket.destroy(new Error("Tiempo de espera SMTP agotado.")));
  try {
    const greeting = await readReply(socket);
    if (greeting.code !== 220) throw new Error(`SMTP ${greeting.code}: ${greeting.text}`);
    await smtpCommand(socket, "EHLO nexora.local", [250]);
    await smtpCommand(socket, "MAIL FROM:<noreply@nexora.local>", [250]);
    await smtpCommand(socket, `RCPT TO:<${mail.to}>`, [250, 251]);
    await smtpCommand(socket, "DATA", [354]);
    socket.write(`${buildMessage(mail, messageId)}\r\n.\r\n`);
    const accepted = await readReply(socket);
    if (accepted.code !== 250) throw new Error(`SMTP ${accepted.code}: ${accepted.text}`);
    await smtpCommand(socket, "QUIT", [221]);
    return { messageId, accepted: true, to: mail.to };
  } finally {
    socket.end();
  }
}

function json(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

export function createServer(send = sendSmtp) {
  return http.createServer((req, res) => {
    if (req.method === "GET" && req.url === "/health") return json(res, 200, { ok: true });
    if (req.method !== "POST" || req.url !== "/send") return json(res, 404, { error: "Ruta no encontrada." });
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 64_000) req.destroy(new Error("Solicitud demasiado grande."));
    });
    req.on("end", async () => {
      try {
        const result = await send(JSON.parse(raw || "{}"));
        json(res, 200, {
          ok: true,
          delivery: "mailpit-local",
          mailboxUrl: process.env.MAILBOX_URL || "http://localhost:8025",
          ...result,
        });
      } catch (error) {
        json(res, 400, { ok: false, error: error.message });
      }
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3001);
  createServer().listen(port, "0.0.0.0", () => console.log(`NEXORA local mailer listening on ${port}`));
}
