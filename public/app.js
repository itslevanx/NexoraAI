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
  recorderStream: null,
  advertisingCamera: null,
  advertisingImage: null,
  advertisingImageUrl: "",
  advertisingVideoUrl: "",
  advertisingClipUrls: [],
  advertisingCampaign: null,
  advertisingClipDurations: [],
  advertisingAccessToken: sessionStorage.getItem("nexoraPublicidadToken") || "",
  advertisingAudioContext: null
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

function showView(name, updateUrl = false) {
  const button = $(`[data-view="${name}"]`) || $('[data-view="voice"]');
  $$('[data-view]').forEach((item) => item.classList.toggle("active", item === button));
  $$('.view').forEach((view) => view.classList.remove("active"));
  $(`#${button.dataset.view}View`).classList.add("active");
  if (updateUrl) history.pushState({}, "", button.dataset.view === "advertising" ? "/publicidad" : `/#${button.dataset.view}`);
}

$$('[data-view]').forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.view, true));
});

window.addEventListener("popstate", () => showView(location.hash.slice(1)));
const initialView = location.pathname === "/publicidad"
  ? "advertising"
  : location.hash === "#inicio" ? "voice" : location.hash.slice(1);
if (initialView) showView(initialView);

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
    const response = await fetch("/api/realtime-session", {
      method: "POST",
      headers: apiHeaders({ "Content-Type": "application/json" }),
      // Safari puede exponer una localDescription transitoria mientras reúne
      // candidatos ICE. La oferta original coincide con el flujo oficial.
      body: JSON.stringify({ sdp: offer.sdp })
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

const ADVERTISING_FALLBACK = {
  headline: "Convierte tu futuro en acción",
  supporting: "Aprende, crea y transforma con la Universidad Tecnológica del Perú.",
  cta: "Conoce más en utp.edu.pe"
};

function advertisingHeaders(extra = {}) {
  const headers = { ...extra };
  if (state.advertisingAccessToken) headers["x-publicidad-token"] = state.advertisingAccessToken;
  return headers;
}

function lockAdvertising(message = "Ingresa el código autorizado para continuar.") {
  state.advertisingAccessToken = "";
  sessionStorage.removeItem("nexoraPublicidadToken");
  $("#advertisingContent").hidden = true;
  $("#advertisingLock").hidden = false;
  $("#advertisingLockStatus").textContent = message;
  stopAdvertisingCamera();
}

function unlockAdvertising(token) {
  state.advertisingAccessToken = token;
  sessionStorage.setItem("nexoraPublicidadToken", token);
  $("#advertisingLock").hidden = true;
  $("#advertisingContent").hidden = false;
  $("#advertisingAccessCode").value = "";
}

async function requestAdvertisingAccess(code = "") {
  const response = await fetch("/api/publicidad-acceso", {
    method: "POST",
    headers: advertisingHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(code ? { code } : {})
  });
  if (!response.ok) throw new Error(await apiError(response));
  const result = await response.json();
  if (!result.token) throw new Error("El servidor no devolvió una sesión válida.");
  unlockAdvertising(result.token);
}

$("#advertisingLock").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  button.textContent = "Verificando…";
  try {
    await requestAdvertisingAccess($("#advertisingAccessCode").value);
    toast("Publicidad desbloqueada para esta sesión.");
  } catch (error) {
    lockAdvertising(error.message);
    $("#advertisingAccessCode").focus();
  } finally {
    button.disabled = false;
    button.textContent = "Desbloquear Publicidad";
  }
});

if (state.advertisingAccessToken) {
  requestAdvertisingAccess().catch(() => lockAdvertising("La sesión venció. Ingresa nuevamente el código."));
}

function stopAdvertisingCamera() {
  state.advertisingCamera?.getTracks().forEach((track) => track.stop());
  state.advertisingCamera = null;
  const camera = $("#advertisingCamera");
  camera.srcObject = null;
  camera.hidden = true;
  $("#cameraActions").hidden = true;
  if (state.advertisingImage) {
    $("#advertisingPhoto").hidden = false;
  } else {
    $("#advertisingStage").classList.add("empty");
    $("#advertisingEmpty").hidden = false;
  }
}

async function setAdvertisingPhoto(file) {
  if (!file) return;
  if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) {
    throw new Error("Usa una imagen JPG, PNG o WEBP.");
  }
  if (file.size > 10 * 1024 * 1024) throw new Error("La imagen debe pesar menos de 10 MB.");
  stopAdvertisingCamera();
  if (state.advertisingImageUrl) URL.revokeObjectURL(state.advertisingImageUrl);
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  await image.decode();
  state.advertisingImage = image;
  state.advertisingImageUrl = url;
  const preview = $("#advertisingPhoto");
  preview.src = url;
  preview.hidden = false;
  $("#advertisingEmpty").hidden = true;
  $("#advertisingStage").classList.remove("empty");
  $("#createAdvertisingVideo").disabled = false;
  $("#advertisingStatus").textContent = "Imagen lista para crear";
}

$("#advertisingFile").addEventListener("change", async () => {
  try {
    await setAdvertisingPhoto($("#advertisingFile").files[0]);
  } catch (error) { toast(error.message); }
});

$("#startCamera").addEventListener("click", async () => {
  try {
    stopAdvertisingCamera();
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    state.advertisingCamera = stream;
    const camera = $("#advertisingCamera");
    camera.srcObject = stream;
    camera.hidden = false;
    $("#advertisingPhoto").hidden = true;
    $("#advertisingEmpty").hidden = true;
    $("#advertisingStage").classList.remove("empty");
    $("#cameraActions").hidden = false;
    await camera.play();
    $("#advertisingStatus").textContent = "Cámara lista";
  } catch (error) {
    stopAdvertisingCamera();
    toast(error.name === "NotAllowedError" ? "Autoriza la cámara para tomar una foto." : "No fue posible abrir la cámara.");
  }
});

$("#capturePhoto").addEventListener("click", async () => {
  const camera = $("#advertisingCamera");
  if (!camera.videoWidth) return toast("Espera a que la cámara muestre la imagen.");
  const canvas = document.createElement("canvas");
  canvas.width = camera.videoWidth;
  canvas.height = camera.videoHeight;
  canvas.getContext("2d").drawImage(camera, 0, 0);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", .92));
  try {
    await setAdvertisingPhoto(new File([blob], "foto-utp.jpg", { type: "image/jpeg" }));
    toast("Foto capturada.");
  } catch (error) { toast(error.message); }
});

$("#closeCamera").addEventListener("click", stopAdvertisingCamera);

function updateAdvertisingFormat() {
  const landscape = $("#advertisingFormat").value === "landscape";
  $(".render-shell").classList.toggle("landscape", landscape);
  $("#advertisingCanvas").width = landscape ? 1280 : 720;
  $("#advertisingCanvas").height = landscape ? 720 : 1280;
}

$("#advertisingFormat").addEventListener("change", updateAdvertisingFormat);

const ADVERTISING_COSTS = {
  10: { generated: 8, cost: .8 },
  15: { generated: 16, cost: 1.6 },
  20: { generated: 20, cost: 2 },
  30: { generated: 30, cost: 3 }
};

function updateAdvertisingCost() {
  const duration = Number($("#advertisingDuration").value);
  const estimate = ADVERTISING_COSTS[duration];
  $("#advertisingBadge").textContent = `${duration} s`;
  $("#advertisingCost").textContent = `Costo estimado de Veo: US$${estimate.cost.toFixed(2)} · se generan ${estimate.generated} s y se entrega un video de ${duration} s`;
}

$("#advertisingDuration").addEventListener("change", updateAdvertisingCost);

async function prepareAdvertisingImage() {
  const source = state.advertisingImage;
  const maxSide = 1280;
  const scale = Math.min(1, maxSide / Math.max(source.naturalWidth, source.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(source.naturalHeight * scale));
  const context = canvas.getContext("2d", { alpha: false });
  context.fillStyle = "#000";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", .84));
  if (!blob) throw new Error("No fue posible preparar la foto para Google Veo.");
  const image = await fileToBase64(blob);
  return { image, mimeType: "image/jpeg" };
}

async function startAdvertisingGeneration() {
  const prepared = await prepareAdvertisingImage();
  const response = await fetch("/api/publicidad", {
    method: "POST",
    headers: advertisingHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      ...prepared,
      brief: $("#advertisingBrief").value.trim(),
      tone: $("#advertisingTone").value,
      duration: Number($("#advertisingDuration").value),
      format: $("#advertisingFormat").value
    })
  });
  if (response.status === 401) lockAdvertising("La sesión venció. Ingresa nuevamente el código.");
  if (!response.ok) throw new Error(await apiError(response));
  return response.json();
}

const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

async function waitForAdvertisingClips(operations) {
  const deadline = Date.now() + 7 * 60 * 1000;
  while (Date.now() < deadline) {
    const response = await fetch("/api/publicidad", {
      method: "POST",
      headers: advertisingHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ action: "status", operations })
    });
    if (response.status === 401) lockAdvertising("La sesión venció. Ingresa nuevamente el código.");
    if (!response.ok) throw new Error(await apiError(response));
    const status = await response.json();
    const completed = status.results.filter((result) => result.done).length;
    const failed = status.results.find((result) => result.error);
    if (failed) throw new Error(failed.error);
    $("#advertisingProgress span").style.width = `${8 + (completed / operations.length) * 62}%`;
    $("#advertisingStatus").textContent = `Google Veo generando tomas · ${completed}/${operations.length}`;
    if (status.done) {
      const tokens = status.results.map((result) => result.downloadToken);
      if (tokens.some((token) => !token)) throw new Error("Google terminó una toma, pero no entregó el video.");
      return tokens;
    }
    await wait(10000);
  }
  throw new Error("Google Veo superó el tiempo de espera. Los videos generados se conservan temporalmente en Google.");
}

async function downloadAdvertisingClip(token, index) {
  $("#advertisingStatus").textContent = `Descargando toma ${index + 1}…`;
  const response = await fetch(`/api/publicidad-video?token=${encodeURIComponent(token)}`, {
    headers: advertisingHeaders()
  });
  if (response.status === 401) lockAdvertising("La sesión venció. Ingresa nuevamente el código.");
  if (!response.ok) throw new Error(await apiError(response));
  const blob = await response.blob();
  if (!blob.size) throw new Error("Google devolvió una toma vacía.");
  const url = URL.createObjectURL(blob);
  state.advertisingClipUrls.push(url);
  return url;
}

async function loadAdvertisingVideo(url, index) {
  const video = document.createElement("video");
  video.src = url;
  video.preload = "auto";
  video.playsInline = true;
  await new Promise((resolve, reject) => {
    video.addEventListener("loadedmetadata", resolve, { once: true });
    video.addEventListener("error", () => reject(new Error(`No fue posible abrir la toma ${index + 1}.`)), { once: true });
    video.load();
  });
  return video;
}

function prepareAdvertisingMontage(campaign, clipDurations) {
  state.advertisingCampaign = campaign || ADVERTISING_FALLBACK;
  state.advertisingClipDurations = clipDurations;
  const finish = $("#finishAdvertisingVideo");
  finish.textContent = `Finalizar video de ${$("#advertisingDuration").value} s`;
  finish.hidden = false;
  $("#advertisingProgress span").style.width = "78%";
  $("#advertisingStatus").textContent = "Toma lista · pulsa Finalizar video";
  toast("La toma de Veo está lista. Pulsa Finalizar video para que Safari autorice el montaje con audio.");
}

$("#recoverAdvertisingClip").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (!new Set(["video/mp4", "video/webm"]).has(file.type)) return toast("Selecciona una toma MP4 o WEBM.");
  if (file.size > 200 * 1024 * 1024) return toast("La toma debe pesar menos de 200 MB.");
  try {
    state.advertisingClipUrls.forEach((url) => URL.revokeObjectURL(url));
    const url = URL.createObjectURL(file);
    await loadAdvertisingVideo(url, 0);
    state.advertisingClipUrls = [url];
    $("#advertisingProgress").hidden = false;
    prepareAdvertisingMontage(ADVERTISING_FALLBACK, [Number($("#advertisingDuration").value)]);
  } catch (error) {
    toast(error.message);
  }
});

async function finishAdvertisingMontage() {
  if (!state.advertisingClipUrls.length || !state.advertisingClipDurations.length) {
    throw new Error("No hay tomas preparadas para montar.");
  }
  const videos = await Promise.all(state.advertisingClipUrls.map(loadAdvertisingVideo));
  $("#advertisingPlaceholder").hidden = true;
  $("#advertisingCanvas").hidden = false;
  const blob = await renderAdvertisingVideo(videos, state.advertisingCampaign, state.advertisingClipDurations);
  if (state.advertisingVideoUrl) URL.revokeObjectURL(state.advertisingVideoUrl);
  state.advertisingVideoUrl = URL.createObjectURL(blob);
  const result = $("#advertisingResult");
  result.src = state.advertisingVideoUrl;
  result.hidden = false;
  $("#advertisingCanvas").hidden = true;
  const download = $("#downloadAdvertising");
  const extension = blob.type.includes("mp4") ? "mp4" : "webm";
  download.href = state.advertisingVideoUrl;
  download.download = `publicidad-utp-${$("#advertisingDuration").value}s.${extension}`;
  download.hidden = false;
  $("#advertisingProgress span").style.width = "100%";
  $("#advertisingStatus").textContent = "Campaña UTP lista para reproducir y descargar";
  toast("Video cinematográfico UTP terminado.");
}

$("#finishAdvertisingVideo").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = "Montando video final…";
  try {
    await finishAdvertisingMontage();
    button.hidden = true;
  } catch (error) {
    $("#advertisingStatus").textContent = "No fue posible finalizar el montaje";
    $("#advertisingPlaceholder").hidden = false;
    $("#advertisingCanvas").hidden = true;
    toast(error.message);
  } finally {
    button.disabled = false;
    if (!button.hidden) button.textContent = `Reintentar montaje de ${$("#advertisingDuration").value} s`;
  }
});

function drawCoverVideo(context, video, width, height) {
  const sourceWidth = video.videoWidth || width;
  const sourceHeight = video.videoHeight || height;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  context.drawImage(video, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    } else line = candidate;
  }
  const consumed = lines.join(" ").split(/\s+/).filter(Boolean).length;
  if (line && lines.length < maxLines) {
    const remaining = words.slice(consumed).join(" ");
    lines.push(remaining || line);
  }
  lines.slice(0, maxLines).forEach((value, index) => context.fillText(value, x, y + index * lineHeight, maxWidth));
  return Math.min(lines.length, maxLines);
}

function drawAdvertisingFrame(context, video, copy, progress, format, clipProgress) {
  const { width, height } = context.canvas;
  const short = Math.min(width, height);
  const margin = short * .075;
  context.clearRect(0, 0, width, height);
  context.save();
  drawCoverVideo(context, video, width, height);
  const shade = context.createLinearGradient(0, 0, 0, height);
  shade.addColorStop(0, "rgba(0,0,0,.18)");
  shade.addColorStop(.48, "rgba(0,0,0,.08)");
  shade.addColorStop(1, "rgba(0,0,0,.92)");
  context.fillStyle = shade;
  context.fillRect(0, 0, width, height);
  context.fillStyle = "rgba(224,0,52,.88)";
  context.fillRect(0, 0, Math.max(10, short * .018), height);

  context.textBaseline = "top";
  context.fillStyle = "#fff";
  context.font = `700 ${short * .034}px Inter, Arial, sans-serif`;
  context.letterSpacing = `${short * .003}px`;
  context.fillText("UTP", margin, margin);
  context.font = `500 ${short * .021}px Inter, Arial, sans-serif`;
  context.fillStyle = "rgba(255,255,255,.82)";
  context.fillText("UNIVERSIDAD TECNOLÓGICA DEL PERÚ", margin + short * .092, margin + short * .009);

  const firstPhase = progress < .42;
  const finalPhase = progress >= .72;
  const phaseStart = firstPhase ? 0 : finalPhase ? .72 : .42;
  const local = Math.min(1, Math.max(0, (progress - phaseStart) / (firstPhase ? .42 : finalPhase ? .28 : .30)));
  const opacity = Math.min(1, local * 5, (1 - local) * 7 + (finalPhase ? 1 : 0));
  const lift = (1 - Math.min(1, local * 3)) * short * .035;
  context.globalAlpha = Math.max(.06, opacity);
  const textY = height - (format === "portrait" ? short * .57 : short * .38) + lift;
  if (firstPhase) {
    context.fillStyle = "#fff";
    context.font = `700 ${short * (format === "portrait" ? .085 : .072)}px Inter, Arial, sans-serif`;
    drawWrappedText(context, copy.headline, margin, textY, width - margin * 2, short * .102, 3);
  } else if (!finalPhase) {
    context.fillStyle = "#fff";
    context.font = `650 ${short * (format === "portrait" ? .067 : .058)}px Inter, Arial, sans-serif`;
    drawWrappedText(context, copy.supporting, margin, textY, width - margin * 2, short * .082, 4);
  } else {
    context.fillStyle = "#fff";
    context.font = `700 ${short * (format === "portrait" ? .075 : .064)}px Inter, Arial, sans-serif`;
    context.fillText("TU FUTURO EMPIEZA HOY", margin, textY, width - margin * 2);
    context.fillStyle = "#e00034";
    context.fillRect(margin, textY + short * .115, short * .56, short * .0025 + 2);
    context.fillStyle = "#fff";
    context.font = `600 ${short * .036}px Inter, Arial, sans-serif`;
    context.fillText(copy.cta, margin, textY + short * .15, width - margin * 2);
  }
  context.globalAlpha = 1;
  context.fillStyle = "rgba(255,255,255,.82)";
  context.font = `500 ${short * .021}px Inter, Arial, sans-serif`;
  context.fillText("Publicidad creada con NEXORA AI", margin, height - margin * .75);
  context.fillStyle = "rgba(255,255,255,.24)";
  context.fillRect(margin, height - margin * .22, width - margin * 2, 3);
  context.fillStyle = "#e00034";
  context.fillRect(margin, height - margin * .22, (width - margin * 2) * progress, 3);
  const transition = Math.min(1, clipProgress * 7, (1 - clipProgress) * 7);
  context.fillStyle = `rgba(0,0,0,${Math.max(0, 1 - transition)})`;
  context.fillRect(0, 0, width, height);
  context.restore();
}

function supportedAdvertisingMimeType() {
  const candidates = [
    "video/mp4;codecs=h264,aac",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm"
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

async function renderAdvertisingVideo(videos, copy, clipDurations) {
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
    throw new Error("Este navegador no permite exportar video desde el lienzo. Usa una versión reciente de Safari, Chrome o Edge.");
  }
  const canvas = $("#advertisingCanvas");
  const context = canvas.getContext("2d", { alpha: false });
  const duration = Number($("#advertisingDuration").value);
  const format = $("#advertisingFormat").value;
  const canvasStream = canvas.captureStream(30);
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error("Este navegador no permite montar el audio generado por Veo.");
  const audioContext = state.advertisingAudioContext || new AudioContextClass();
  state.advertisingAudioContext = audioContext;
  await audioContext.resume();
  const destination = audioContext.createMediaStreamDestination();
  videos.forEach((video) => audioContext.createMediaElementSource(video).connect(destination));
  const stream = new MediaStream([...canvasStream.getVideoTracks(), ...destination.stream.getAudioTracks()]);
  const mimeType = supportedAdvertisingMimeType();
  const options = { videoBitsPerSecond: 6_000_000, audioBitsPerSecond: 128_000 };
  if (mimeType) options.mimeType = mimeType;
  const recorder = new MediaRecorder(stream, options);
  const chunks = [];
  recorder.addEventListener("dataavailable", (event) => { if (event.data.size) chunks.push(event.data); });
  const completed = new Promise((resolve, reject) => {
    recorder.addEventListener("stop", () => resolve(new Blob(chunks, { type: recorder.mimeType || mimeType || "video/webm" })));
    recorder.addEventListener("error", () => reject(new Error("Safari no pudo completar la exportación del video.")));
  });
  const progressBar = $("#advertisingProgress span");
  recorder.start(250);
  let elapsed = 0;
  for (let index = 0; index < videos.length && elapsed < duration; index += 1) {
    const video = videos[index];
    const remaining = duration - elapsed;
    const useSeconds = Math.min(clipDurations[index], remaining);
    const sourceSeconds = Math.min(Number(video.duration) || useSeconds, useSeconds);
    const playbackRate = sourceSeconds < useSeconds ? sourceSeconds / useSeconds : 1;
    video.currentTime = 0;
    video.playbackRate = playbackRate;
    await video.play();
    await new Promise((resolve) => {
      const draw = () => {
        const localTime = Math.min(useSeconds, video.currentTime / playbackRate);
        const totalProgress = Math.min(1, (elapsed + localTime) / duration);
        const clipProgress = Math.min(1, localTime / useSeconds);
        drawAdvertisingFrame(context, video, copy, totalProgress, format, clipProgress);
        progressBar.style.width = `${70 + totalProgress * 30}%`;
        $("#advertisingStatus").textContent = `Montando campaña UTP · ${Math.round(totalProgress * 100)}%`;
        if (localTime >= useSeconds || video.ended) resolve();
        else requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
    });
    video.pause();
    video.playbackRate = 1;
    elapsed += useSeconds;
  }
  if (recorder.state === "recording") recorder.stop();
  const blob = await completed;
  stream.getTracks().forEach((track) => track.stop());
  await audioContext.close();
  state.advertisingAudioContext = null;
  return blob;
}

$("#advertisingForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.advertisingImage) return toast("Toma o selecciona una foto.");
  const duration = Number($("#advertisingDuration").value);
  const estimate = ADVERTISING_COSTS[duration];
  if (!window.confirm(`Google Veo generará ${estimate.generated} segundos de material. Costo estimado: US$${estimate.cost.toFixed(2)}. ¿Continuar?`)) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (AudioContextClass && !state.advertisingAudioContext) {
        try {
            state.advertisingAudioContext = new AudioContextClass();
            await state.advertisingAudioContext.resume();
        } catch {
            state.advertisingAudioContext = null;
        }
  }
  const button = event.submitter;
  button.disabled = true;
  button.textContent = "Enviando a Google Veo…";
  $("#advertisingProgress").hidden = false;
  $("#advertisingProgress span").style.width = "2%";
  $("#advertisingStatus").textContent = "Preparando fotografía y campaña UTP";
  $("#advertisingResult").hidden = true;
  $("#advertisingCanvas").hidden = true;
  $("#downloadAdvertising").hidden = true;
  $("#finishAdvertisingVideo").hidden = true;
  try {
    state.advertisingClipUrls.forEach((url) => URL.revokeObjectURL(url));
    state.advertisingClipUrls = [];
    const generation = await startAdvertisingGeneration();
    $("#advertisingProgress span").style.width = "8%";
    button.textContent = "Veo está creando las tomas…";
    const tokens = await waitForAdvertisingClips(generation.operations);
    button.textContent = "Descargando tomas…";
    for (let index = 0; index < tokens.length; index += 1) {
      await downloadAdvertisingClip(tokens[index], index);
      $("#advertisingProgress span").style.width = `${70 + ((index + 1) / tokens.length) * 8}%`;
    }
    prepareAdvertisingMontage(generation.campaign, generation.clipDurations);
  } catch (error) {
    $("#advertisingStatus").textContent = "No fue posible crear el video";
    $("#advertisingPlaceholder").hidden = false;
    $("#advertisingCanvas").hidden = true;
    toast(error.message);
    if (state.advertisingAudioContext && state.advertisingAudioContext.state !== "closed") {
      state.advertisingAudioContext.close();
      state.advertisingAudioContext = null;
    }
  } finally {
    button.disabled = false;
    button.textContent = "Crear con Google Veo";
  }
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

window.addEventListener("beforeunload", () => {
  stopCall(false);
  stopAdvertisingCamera();
  if (state.advertisingImageUrl) URL.revokeObjectURL(state.advertisingImageUrl);
  if (state.advertisingVideoUrl) URL.revokeObjectURL(state.advertisingVideoUrl);
  state.advertisingClipUrls.forEach((url) => URL.revokeObjectURL(url));
  if (state.advertisingAudioContext && state.advertisingAudioContext.state !== "closed") state.advertisingAudioContext.close();
});
