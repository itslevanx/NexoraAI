const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const state = {
  apiKey: "",
  n8nWebhook: "",
  chatModel: "gpt-5-mini",
  messages: [{ role: "assistant", content: "Hola. ¿En qué trabajamos hoy?" }],
  peer: null,
  stream: null,
  channel: null,
  audio: null,
  muted: false,
  assistantDraft: "",
  selectedAudio: null,
  recorder: null,
  recorderStream: null
};

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove("show"), 3200);
}

function apiHeaders(extra = {}) {
  const headers = { ...extra };
  if (state.apiKey) headers["x-openai-key"] = state.apiKey;
  return headers;
}

async function apiError(response) {
  const text = await response.text();
  try { return JSON.parse(text).error || text; } catch { return text || `Error HTTP ${response.status}`; }
}

$$('[data-view]').forEach((button) => {
  button.addEventListener("click", () => {
    $$('[data-view]').forEach((item) => item.classList.toggle("active", item === button));
    $$('.view').forEach((view) => view.classList.remove("active"));
    $(`#${button.dataset.view}View`).classList.add("active");
  });
});

$$('[data-studio]').forEach((button) => {
  button.addEventListener("click", () => {
    $$('[data-studio]').forEach((item) => item.classList.toggle("active", item === button));
    $$('.studio-panel').forEach((panel) => panel.classList.remove("active"));
    $(`#${button.dataset.studio}Studio`).classList.add("active");
  });
});

const settingsDialog = $("#settingsDialog");
$("#settingsButton").addEventListener("click", () => settingsDialog.showModal());
settingsDialog.addEventListener("close", () => {
  if (settingsDialog.returnValue !== "default") return;
  const temporaryKey = $("#apiKey").value.trim();
  if (temporaryKey) state.apiKey = temporaryKey;
  state.n8nWebhook = $("#n8nWebhook").value.trim();
  state.chatModel = $("#chatModel").value.trim() || "gpt-5-mini";
  $("#apiKey").value = "";
  toast(state.apiKey ? "Configuración guardada para esta sesión." : "Se usará la configuración segura del servidor.");
});

function setCallState(status, detail, live = false) {
  $("#callStatus").textContent = status;
  $("#callDetail").textContent = detail;
  $("#orb").classList.toggle("live", live);
  $("#startCall").disabled = live;
  $("#muteCall").disabled = !live;
  $("#stopCall").disabled = !live;
}

function addTranscript(role, text, draft = false) {
  const panel = $("#liveTranscript");
  panel.classList.remove("empty");
  if (draft) {
    let row = panel.querySelector("[data-draft='assistant']");
    if (!row) {
      row = document.createElement("p");
      row.dataset.draft = "assistant";
      panel.append(row);
    }
    row.innerHTML = `<b>NEXORA</b>${escapeHtml(text)}`;
  } else {
    const row = document.createElement("p");
    row.innerHTML = `<b>${role === "user" ? "Tú" : "NEXORA"}</b>${escapeHtml(text)}`;
    panel.append(row);
  }
  panel.scrollTop = panel.scrollHeight;
}

function escapeHtml(value) {
  const span = document.createElement("span");
  span.textContent = value;
  return span.innerHTML;
}

function waitForIce(connection) {
  if (connection.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const check = () => {
      if (connection.iceGatheringState === "complete") {
        connection.removeEventListener("icegatheringstatechange", check);
        resolve();
      }
    };
    connection.addEventListener("icegatheringstatechange", check);
  });
}

function handleRealtimeEvent(event) {
  if (event.type === "input_audio_buffer.speech_started") {
    $("#orb").classList.remove("speaking");
    $("#callDetail").textContent = "Te escucho…";
  }
  if (event.type === "input_audio_buffer.speech_stopped") {
    $("#callDetail").textContent = "Procesando tu turno…";
  }
  if (event.type === "conversation.item.input_audio_transcription.completed" && event.transcript) {
    addTranscript("user", event.transcript);
  }
  if (["response.audio_transcript.delta", "response.output_audio_transcript.delta"].includes(event.type)) {
    state.assistantDraft += event.delta || "";
    addTranscript("assistant", state.assistantDraft, true);
    $("#orb").classList.add("speaking");
    $("#callDetail").textContent = "NEXORA está respondiendo…";
  }
  if (event.type === "response.done") {
    const draft = $("#liveTranscript [data-draft='assistant']");
    if (draft) delete draft.dataset.draft;
    state.assistantDraft = "";
    $("#orb").classList.remove("speaking");
    $("#callDetail").textContent = "Puedes seguir hablando.";
  }
  if (event.type === "error") toast(event.error?.message || "La sesión de voz informó un error.");
}

async function startCall() {
  try {
    setCallState("Conectando…", "Solicitando acceso al micrófono.", true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const peer = new RTCPeerConnection();
    const audio = new Audio();
    audio.autoplay = true;
    peer.addEventListener("track", (event) => {
      audio.srcObject = event.streams[0];
      audio.play().catch(() => toast("Toca la pantalla para habilitar el audio."));
    });
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    const channel = peer.createDataChannel("oai-events");
    channel.addEventListener("message", ({ data }) => {
      try { handleRealtimeEvent(JSON.parse(data)); } catch { /* Ignora eventos no JSON. */ }
    });
    channel.addEventListener("open", () => setCallState("Conversación activa", "Puedes comenzar a hablar.", true));
    channel.addEventListener("close", () => stopCall(false));

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    await waitForIce(peer);
    const response = await fetch("/api/realtime-session", {
      method: "POST",
      headers: apiHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ sdp: peer.localDescription.sdp })
    });
    if (!response.ok) throw new Error(await apiError(response));
    await peer.setRemoteDescription({ type: "answer", sdp: await response.text() });

    state.peer = peer;
    state.stream = stream;
    state.channel = channel;
    state.audio = audio;
  } catch (error) {
    stopCall(false);
    toast(error.message || "No fue posible iniciar la conversación.");
  }
}

function stopCall(sendClose = true) {
  if (sendClose && state.channel?.readyState === "open") {
    state.channel.send(JSON.stringify({ type: "session.close" }));
  }
  state.stream?.getTracks().forEach((track) => track.stop());
  state.peer?.close();
  if (state.audio) state.audio.srcObject = null;
  Object.assign(state, { peer: null, stream: null, channel: null, audio: null, muted: false, assistantDraft: "" });
  $("#muteCall").textContent = "Silenciar";
  $("#orb").classList.remove("speaking");
  setCallState("Lista para conversar", "El micrófono se activa únicamente al iniciar.", false);
}

$("#startCall").addEventListener("click", startCall);
$("#stopCall").addEventListener("click", () => stopCall(true));
$("#muteCall").addEventListener("click", () => {
  state.muted = !state.muted;
  state.stream?.getAudioTracks().forEach((track) => { track.enabled = !state.muted; });
  $("#muteCall").textContent = state.muted ? "Activar micrófono" : "Silenciar";
  $("#callDetail").textContent = state.muted ? "Micrófono silenciado." : "Puedes seguir hablando.";
});
$("#clearTranscript").addEventListener("click", () => {
  $("#liveTranscript").className = "transcript empty";
  $("#liveTranscript").textContent = "La conversación aparecerá aquí.";
});

function renderMessage(role, content) {
  const article = document.createElement("article");
  article.className = `message ${role}`;
  const label = document.createElement("span");
  label.textContent = role === "user" ? "TÚ" : "NEXORA";
  const paragraph = document.createElement("p");
  paragraph.textContent = content;
  article.append(label, paragraph);
  $("#chatMessages").append(article);
  article.scrollIntoView({ behavior: "smooth", block: "end" });
}

$("#chatForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = $("#chatInput");
  const content = input.value.trim();
  if (!content) return;
  input.value = "";
  state.messages.push({ role: "user", content });
  renderMessage("user", content);
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: apiHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ messages: state.messages, model: state.chatModel })
    });
    if (!response.ok) throw new Error(await apiError(response));
    const { text } = await response.json();
    state.messages.push({ role: "assistant", content: text });
    renderMessage("assistant", text);
  } catch (error) { toast(error.message); }
});

$("#clearChat").addEventListener("click", () => {
  state.messages = [{ role: "assistant", content: "Hola. ¿En qué trabajamos hoy?" }];
  $("#chatMessages").innerHTML = "";
  renderMessage("assistant", state.messages[0].content);
});

const audioFile = $("#audioFile");
audioFile.addEventListener("change", () => {
  const file = audioFile.files[0];
  if (file) setSelectedAudio(file);
});

function setSelectedAudio(file) {
  if (state.selectedAudio?.previewUrl) URL.revokeObjectURL(state.selectedAudio.previewUrl);
  const previewUrl = URL.createObjectURL(file);
  state.selectedAudio = { file, previewUrl };
  $("#transcribeButton").disabled = false;
  $(".upload span").textContent = file.name;
  $("#audioPreview").src = previewUrl;
  $("#audioPreview").hidden = false;
}

$("#recordButton").addEventListener("click", async () => {
  const button = $("#recordButton");
  const panel = $(".record-panel");
  if (state.recorder?.state === "recording") {
    state.recorder.stop();
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];
    recorder.addEventListener("dataavailable", (event) => { if (event.data.size) chunks.push(event.data); });
    recorder.addEventListener("stop", () => {
      const mimeType = recorder.mimeType || "audio/webm";
      const extension = mimeType.includes("mp4") ? "m4a" : "webm";
      setSelectedAudio(new File([new Blob(chunks, { type: mimeType })], `grabacion.${extension}`, { type: mimeType }));
      stream.getTracks().forEach((track) => track.stop());
      Object.assign(state, { recorder: null, recorderStream: null });
      panel.classList.remove("recording");
      button.textContent = "Iniciar grabación";
      $("#recordStatus").textContent = "Grabación lista para transcribir";
    });
    state.recorder = recorder;
    state.recorderStream = stream;
    recorder.start();
    panel.classList.add("recording");
    button.textContent = "Detener grabación";
    $("#recordStatus").textContent = "Grabando…";
  } catch (error) {
    toast(error.message || "No fue posible acceder al micrófono.");
  }
});

$("#transcribeButton").addEventListener("click", async () => {
  const file = state.selectedAudio?.file;
  if (!file) return;
  if (file.size > 4 * 1024 * 1024) return toast("El archivo debe pesar menos de 4 MB.");
  const button = $("#transcribeButton");
  button.disabled = true;
  button.textContent = "Transcribiendo…";
  try {
    const data = await fileToBase64(file);
    const response = await fetch("/api/transcribe", {
      method: "POST",
      headers: apiHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ data, filename: file.name, mimeType: file.type || "audio/webm" })
    });
    if (!response.ok) throw new Error(await apiError(response));
    $("#transcriptionResult").value = (await response.json()).text;
    setTranscriptActions(true);
  } catch (error) { toast(error.message); }
  finally { button.disabled = false; button.textContent = "Transcribir"; }
});

function setTranscriptActions(enabled) {
  ["#summarizeButton", "#downloadTranscript", "#useInChat"].forEach((selector) => { $(selector).disabled = !enabled; });
}

$("#summarizeButton").addEventListener("click", async () => {
  const transcript = $("#transcriptionResult").value.trim();
  if (!transcript) return;
  const button = $("#summarizeButton");
  button.disabled = true;
  button.textContent = "Resumiendo…";
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: apiHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        model: state.chatModel,
        messages: [{ role: "user", content: `Resume esta transcripción en: idea central, puntos clave, decisiones y pendientes.\n\n${transcript}` }]
      })
    });
    if (!response.ok) throw new Error(await apiError(response));
    $("#summaryResult").value = (await response.json()).text;
  } catch (error) { toast(error.message); }
  finally { button.disabled = false; button.textContent = "Crear resumen"; }
});

$("#downloadTranscript").addEventListener("click", () => {
  downloadText($("#transcriptionResult").value, "transcripcion-nexora.txt");
});

function downloadText(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

$("#useInChat").addEventListener("click", () => {
  const text = $("#transcriptionResult").value.trim();
  if (!text) return;
  $("#chatInput").value = `Trabaja con esta transcripción:\n\n${text}`;
  document.querySelector('[data-view="chat"]').click();
  $("#chatInput").focus();
});

function setStudioActions(enabled) {
  ["#studioToSpeech", "#studioDownload", "#studioToChat"].forEach((selector) => { $(selector).disabled = !enabled; });
}

$("#studioForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  button.textContent = "Procesando…";
  try {
    const response = await fetch("/api/studio", {
      method: "POST",
      headers: apiHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        mode: $("#studioMode").value,
        instruction: $("#studioInstruction").value.trim(),
        content: $("#studioInput").value.trim(),
        model: state.chatModel
      })
    });
    if (!response.ok) throw new Error(await apiError(response));
    $("#studioResult").value = (await response.json()).text;
    setStudioActions(true);
  } catch (error) { toast(error.message); }
  finally { button.disabled = false; button.textContent = "Procesar con IA"; }
});

$("#studioToSpeech").addEventListener("click", async () => {
  const text = $("#studioResult").value.trim();
  if (!text) return;
  const button = $("#studioToSpeech");
  button.disabled = true;
  button.textContent = "Creando voz…";
  try {
    const response = await fetch("/api/speech", {
      method: "POST",
      headers: apiHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ text })
    });
    if (!response.ok) throw new Error(await apiError(response));
    const audio = $("#speechPreview");
    if (audio.src) URL.revokeObjectURL(audio.src);
    audio.src = URL.createObjectURL(await response.blob());
    audio.hidden = false;
    await audio.play();
  } catch (error) { toast(error.message); }
  finally { button.disabled = false; button.textContent = "Escuchar con voz IA"; }
});

$("#studioDownload").addEventListener("click", () => downloadText($("#studioResult").value, "resultado-nexora.txt"));
$("#studioToChat").addEventListener("click", () => {
  $("#chatInput").value = `Continuemos trabajando con este resultado:\n\n${$("#studioResult").value}`;
  document.querySelector('[data-view="chat"]').click();
  $("#chatInput").focus();
});

$("#visionFile").addEventListener("change", () => {
  const file = $("#visionFile").files[0];
  if (!file) return;
  if ($("#visionPreview").src) URL.revokeObjectURL($("#visionPreview").src);
  $("#visionPreview").src = URL.createObjectURL(file);
  $("#visionPreview").hidden = false;
  $("#visionStudio .upload span").textContent = file.name;
});

$("#visionForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = $("#visionFile").files[0];
  if (!file) return toast("Selecciona una imagen.");
  if (file.size > 4 * 1024 * 1024) return toast("La imagen debe pesar menos de 4 MB.");
  const button = event.submitter;
  button.disabled = true;
  button.textContent = "Analizando…";
  try {
    const response = await fetch("/api/vision", {
      method: "POST",
      headers: apiHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        data: await fileToBase64(file),
        mimeType: file.type,
        prompt: $("#visionPrompt").value.trim(),
        model: state.chatModel
      })
    });
    if (!response.ok) throw new Error(await apiError(response));
    $("#visionResult").value = (await response.json()).text;
  } catch (error) { toast(error.message); }
  finally { button.disabled = false; button.textContent = "Analizar imagen"; }
});

$("#imageForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  button.textContent = "Generando…";
  const result = $("#imageResult");
  result.className = "generated-image";
  result.textContent = "NEXORA está creando la imagen…";
  try {
    const response = await fetch("/api/image", {
      method: "POST",
      headers: apiHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ prompt: $("#imagePrompt").value.trim(), size: $("#imageSize").value })
    });
    if (!response.ok) throw new Error(await apiError(response));
    const { image } = await response.json();
    result.innerHTML = "";
    const preview = document.createElement("img");
    preview.src = image;
    preview.alt = "Imagen generada por NEXORA AI";
    const actions = document.createElement("div");
    actions.className = "image-actions";
    const download = document.createElement("a");
    download.className = "secondary link-button";
    download.href = image;
    download.download = "imagen-nexora.jpg";
    download.textContent = "Descargar imagen";
    actions.append(download);
    result.append(preview, actions);
  } catch (error) {
    result.className = "generated-image empty";
    result.textContent = "No se pudo generar la imagen.";
    toast(error.message);
  } finally { button.disabled = false; button.textContent = "Generar imagen"; }
});

$("#moderationForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  button.textContent = "Analizando…";
  try {
    const response = await fetch("/api/moderate", {
      method: "POST",
      headers: apiHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ text: $("#moderationInput").value.trim() })
    });
    if (!response.ok) throw new Error(await apiError(response));
    const result = await response.json();
    $("#moderationResult").textContent = result.flagged
      ? `Requiere revisión.\n\nCategorías detectadas:\n${result.categories.join("\n")}`
      : "Contenido no marcado por el modelo de moderación.";
  } catch (error) { toast(error.message); }
  finally { button.disabled = false; button.textContent = "Analizar seguridad"; }
});

$("#automationForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.submitter;
  const payload = {
    action: $("#automationAction").value,
    recipient: $("#automationRecipient").value.trim(),
    subject: $("#automationSubject").value.trim(),
    content: $("#automationContent").value.trim(),
    source: "NEXORA AI",
    timestamp: new Date().toISOString()
  };
  button.disabled = true;
  button.textContent = "Ejecutando…";
  try {
    const headers = { "Content-Type": "application/json" };
    if (state.n8nWebhook) headers["x-n8n-webhook"] = state.n8nWebhook;
    const response = await fetch("/api/automation", { method: "POST", headers, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(await apiError(response));
    const result = await response.json();
    $("#automationResult").textContent = JSON.stringify(result, null, 2);
    toast("Automatización completada.");
  } catch (error) { toast(error.message); }
  finally { button.disabled = false; button.textContent = "Ejecutar automatización"; }
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

window.addEventListener("beforeunload", () => stopCall(false));
