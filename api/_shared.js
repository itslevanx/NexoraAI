export function resolveApiKey(req) {
  const header = req.headers["x-openai-key"];
  const temporaryKey = Array.isArray(header) ? header[0] : header;
  return (process.env.OPENAI_API_KEY || temporaryKey || "").trim();
}

export function rejectMethod(req, res, method = "POST") {
  if (req.method !== method) {
    res.setHeader("Allow", method);
    res.status(405).json({ error: `Usa el método ${method}.` });
    return true;
  }
  return false;
}

export function parseJsonBody(req) {
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  return req.body || {};
}

export async function readOpenAIError(response) {
  const text = await response.text();
  try {
    const payload = JSON.parse(text);
    return payload?.error?.message || payload?.message || text;
  } catch {
    return text || `OpenAI respondió con HTTP ${response.status}.`;
  }
}

export function extractResponseText(data) {
  return (data.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === "output_text")
    .map((item) => item.text)
    .join("\n")
    .trim();
}
