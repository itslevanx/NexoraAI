from __future__ import annotations

import base64
import html
import json
import os
import time
from datetime import datetime
from pathlib import Path

import requests
import streamlit as st
from dotenv import load_dotenv
from openai import OpenAI


APP_NAME = "NEXORA AI"
ROOT = Path(__file__).parent
ICON_PATH = ROOT / "assets" / "nexora-icon.png"
load_dotenv(ROOT / ".env")
DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-5-mini")
SYSTEM_PROMPT = """Eres NEXORA, un asistente académico y de productividad en español.
Responde de forma clara, útil y bien estructurada. Si no conoces un dato, dilo.
No inventes fuentes. Cuando el usuario pida una acción externa, explica qué dato
enviarías y pide confirmación antes de indicar que fue realizada."""


st.set_page_config(
    page_title=APP_NAME,
    page_icon=str(ICON_PATH) if ICON_PATH.exists() else "✨",
    layout="wide",
    initial_sidebar_state="expanded",
)


def image_data_uri(path: Path) -> str:
    if not path.exists():
        return ""
    return "data:image/png;base64," + base64.b64encode(path.read_bytes()).decode()


def inject_theme() -> None:
    st.markdown(
        """
        <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
        :root { --cyan:#42e8e0; --violet:#8b5cf6; --ink:#eaf2ff; --muted:#9eb0cc; }
        html, body, [class*="css"] { font-family:'DM Sans',sans-serif; }
        .stApp {
          background:
            radial-gradient(circle at 15% 5%, rgba(66,232,224,.12), transparent 28rem),
            radial-gradient(circle at 90% 20%, rgba(139,92,246,.15), transparent 30rem),
            #070b18;
          color:var(--ink);
        }
        [data-testid="stSidebar"] { background:rgba(8,13,29,.88); border-right:1px solid rgba(255,255,255,.08); }
        [data-testid="stHeader"] { background:transparent; }
        .block-container { max-width:1180px; padding-top:1.5rem; }
        h1,h2,h3 { font-family:'Space Grotesk',sans-serif!important; letter-spacing:-.03em; }
        .hero { position:relative; overflow:hidden; padding:2.2rem 2.4rem; border:1px solid rgba(255,255,255,.12);
          border-radius:28px; background:linear-gradient(135deg,rgba(18,28,59,.94),rgba(13,16,38,.86));
          box-shadow:0 24px 80px rgba(0,0,0,.35); margin-bottom:1.2rem; }
        .hero:after { content:''; position:absolute; width:240px; height:240px; right:-40px; top:-80px;
          border-radius:50%; background:radial-gradient(circle,rgba(66,232,224,.24),transparent 68%); animation:pulse 3s ease-in-out infinite; }
        .hero-row { display:flex; align-items:center; gap:1.2rem; position:relative; z-index:2; }
        .hero img { width:92px; height:92px; object-fit:contain; filter:drop-shadow(0 0 22px rgba(66,232,224,.35)); animation:float 3.5s ease-in-out infinite; }
        .eyebrow { font-size:.74rem; letter-spacing:.18em; color:var(--cyan); font-weight:700; text-transform:uppercase; }
        .hero h1 { margin:.2rem 0 .25rem; font-size:clamp(2rem,5vw,3.8rem); background:linear-gradient(90deg,#fff,#7cebe6 58%,#b69cff);
          -webkit-background-clip:text; color:transparent; }
        .hero p { margin:0; color:var(--muted); font-size:1.03rem; max-width:680px; }
        .status-pill { display:inline-flex; align-items:center; gap:.45rem; padding:.35rem .7rem; border-radius:999px;
          background:rgba(66,232,224,.09); border:1px solid rgba(66,232,224,.22); color:#9ff8f3; font-size:.8rem; }
        .dot { width:8px;height:8px;border-radius:50%;background:#47f5b0;box-shadow:0 0 12px #47f5b0;animation:pulse 1.8s infinite; }
        .feature { padding:1.15rem; min-height:112px; border:1px solid rgba(255,255,255,.09); border-radius:18px;
          background:rgba(255,255,255,.035); transition:.2s ease; }
        .feature:hover { transform:translateY(-3px); border-color:rgba(66,232,224,.3); }
        .feature b { color:white; display:block; margin-bottom:.3rem; }
        .feature span { color:var(--muted); font-size:.9rem; }
        .metric { padding:1rem; border-radius:18px; background:linear-gradient(145deg,rgba(66,232,224,.08),rgba(139,92,246,.08));
          border:1px solid rgba(255,255,255,.08); text-align:center; }
        .metric strong { display:block;font:700 1.55rem 'Space Grotesk';color:#fff; }
        .metric small { color:var(--muted); }
        .wave { height:46px; display:flex; align-items:center; justify-content:center; gap:5px; margin:.5rem 0 1rem; }
        .wave i { width:5px; border-radius:8px; background:linear-gradient(#42e8e0,#8b5cf6); animation:wave 1.1s ease-in-out infinite; }
        .wave i:nth-child(2){animation-delay:.1s}.wave i:nth-child(3){animation-delay:.2s}.wave i:nth-child(4){animation-delay:.3s}.wave i:nth-child(5){animation-delay:.4s}.wave i:nth-child(6){animation-delay:.5s}.wave i:nth-child(7){animation-delay:.6s}
        .result { border-left:3px solid var(--cyan); background:rgba(66,232,224,.06); padding:1rem 1.2rem; border-radius:0 14px 14px 0; }
        .stButton>button { border-radius:12px; border:1px solid rgba(66,232,224,.25); background:linear-gradient(110deg,#176f78,#5b3db8); color:#fff; font-weight:700; }
        .stButton>button:hover { border-color:#68f5ed; box-shadow:0 0 22px rgba(66,232,224,.2); }
        [data-testid="stChatMessage"] { border:1px solid rgba(255,255,255,.07); border-radius:18px; background:rgba(255,255,255,.025); padding:.45rem .7rem; }
        @keyframes float { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-8px) rotate(2deg)} }
        @keyframes pulse { 0%,100%{opacity:.65;transform:scale(.96)} 50%{opacity:1;transform:scale(1.05)} }
        @keyframes wave { 0%,100%{height:10px;opacity:.45}50%{height:42px;opacity:1} }
        </style>
        """,
        unsafe_allow_html=True,
    )


def init_state() -> None:
    defaults = {
        "messages": [{"role": "assistant", "content": "¡Hola! Soy NEXORA. Puedo ayudarte a estudiar, redactar, resumir o convertir una idea en un plan."}],
        "transcript": "",
        "api_ok": False,
        "requests_count": 0,
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def get_client(api_key: str) -> OpenAI | None:
    key = api_key.strip() or os.getenv("OPENAI_API_KEY", "").strip()
    if not key:
        return None
    return OpenAI(api_key=key, timeout=60.0, max_retries=2)


def chat(client: OpenAI, model: str, messages: list[dict[str, str]]) -> str:
    response = client.responses.create(
        model=model,
        instructions=SYSTEM_PROMPT,
        input=[{"role": m["role"], "content": m["content"]} for m in messages[-14:]],
    )
    st.session_state.requests_count += 1
    return response.output_text.strip()


def transcribe(client: OpenAI, audio, filename: str) -> str:
    payload = (filename, audio.getvalue(), getattr(audio, "type", "audio/wav"))
    result = client.audio.transcriptions.create(model="gpt-transcribe", file=payload)
    st.session_state.requests_count += 1
    return result.text.strip()


def hero() -> None:
    icon = image_data_uri(ICON_PATH)
    image = f'<img src="{icon}" alt="NEXORA AI">' if icon else ""
    st.markdown(
        f"""
        <section class="hero"><div class="hero-row">{image}<div>
          <div class="eyebrow">Inteligencia que transforma ideas</div>
          <h1>NEXORA AI</h1>
          <p>Tu copiloto académico: conversa, transcribe audios y activa flujos de productividad desde un solo lugar.</p>
          <div style="margin-top:.9rem"><span class="status-pill"><span class="dot"></span> Sistema listo para conectar</span></div>
        </div></div></section>
        """,
        unsafe_allow_html=True,
    )


def sidebar() -> tuple[str, str, str, str]:
    with st.sidebar:
        if ICON_PATH.exists():
            st.image(str(ICON_PATH), width=76)
        st.markdown("### NEXORA AI")
        st.caption("Centro de control")
        api_key = st.text_input("OpenAI API Key", type="password", placeholder="sk-proj-…", help="Solo vive en esta sesión; no se guarda.")
        model = st.text_input("Modelo de chat", value=DEFAULT_MODEL, help="Puedes cambiarlo por un modelo disponible en tu cuenta.")
        webhook = st.text_input("Webhook n8n (opcional)", value=os.getenv("N8N_WEBHOOK_URL", ""), placeholder="http://localhost:5678/webhook/nexora")
        connected = bool(api_key.strip() or os.getenv("OPENAI_API_KEY"))
        if connected:
            st.success("API configurada")
        else:
            st.info("Pega tu API key para comenzar")
        st.divider()
        page = st.radio("Navegación", ["Inicio", "Chat inteligente", "Transcriptor", "Automatizaciones", "Acerca del proyecto"], label_visibility="collapsed")
        st.divider()
        st.caption("🔒 La clave no se escribe en disco ni se envía a n8n.")
    return api_key, model.strip() or DEFAULT_MODEL, webhook.strip(), page


def require_client(api_key: str) -> OpenAI | None:
    client = get_client(api_key)
    if client is None:
        st.warning("Conecta tu OpenAI API Key en la barra lateral para activar esta función.", icon="🔑")
    return client


def page_home(api_key: str) -> None:
    hero()
    cols = st.columns(3)
    cards = [
        ("💬 Chat contextual", "Conversaciones útiles con memoria durante la sesión."),
        ("🎙️ Audio → texto", "Transcripción precisa de clases, entrevistas y notas de voz."),
        ("⚡ Flujos n8n", "Dispara correos, registros y mensajes desde un webhook."),
    ]
    for col, (title, body) in zip(cols, cards):
        with col:
            st.markdown(f'<div class="feature"><b>{title}</b><span>{body}</span></div>', unsafe_allow_html=True)
    st.write("")
    a, b, c = st.columns(3)
    with a:
        st.markdown(f'<div class="metric"><strong>{len(st.session_state.messages)-1}</strong><small>mensajes enviados</small></div>', unsafe_allow_html=True)
    with b:
        st.markdown(f'<div class="metric"><strong>{st.session_state.requests_count}</strong><small>llamadas API</small></div>', unsafe_allow_html=True)
    with c:
        label = "ONLINE" if get_client(api_key) else "ESPERA"
        st.markdown(f'<div class="metric"><strong>{label}</strong><small>estado OpenAI</small></div>', unsafe_allow_html=True)
    st.info("Demo sugerida: haz una pregunta → sube un audio → envía su resumen a n8n. Es un recorrido corto que muestra todo el proyecto.", icon="✨")


def page_chat(api_key: str, model: str) -> None:
    st.title("💬 Chat inteligente")
    st.caption(f"Motor seleccionado: {model}")
    left, right = st.columns([4, 1])
    with right:
        if st.button("Nueva charla", use_container_width=True):
            st.session_state.messages = [{"role": "assistant", "content": "Conversación reiniciada. ¿Qué construimos ahora?"}]
            st.rerun()
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
    prompt = st.chat_input("Escribe tu consulta…")
    if prompt:
        client = require_client(api_key)
        if not client:
            return
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)
        with st.chat_message("assistant"):
            try:
                with st.spinner("NEXORA está pensando…"):
                    answer = chat(client, model, st.session_state.messages)
                st.markdown(answer)
                st.session_state.messages.append({"role": "assistant", "content": answer})
            except Exception as exc:
                st.error(f"No se pudo completar la consulta: {exc}")


def page_transcriber(api_key: str, model: str) -> None:
    st.title("🎙️ Transcriptor inteligente")
    st.caption("Convierte voz en texto y, si deseas, transfórmalo en apuntes accionables.")
    st.markdown('<div class="wave">' + '<i></i>' * 7 + '</div>', unsafe_allow_html=True)
    mode = st.radio("Fuente", ["Grabar ahora", "Subir archivo"], horizontal=True)
    audio = st.audio_input("Graba una nota de voz") if mode == "Grabar ahora" else st.file_uploader(
        "Sube MP3, MP4, M4A, WAV o WEBM (máx. 25 MB)", type=["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"]
    )
    if audio:
        st.audio(audio)
        if getattr(audio, "size", len(audio.getvalue())) > 25 * 1024 * 1024:
            st.error("El archivo supera 25 MB. Comprímelo o divídelo antes de continuar.")
        elif st.button("✨ Transcribir con IA", type="primary"):
            client = require_client(api_key)
            if client:
                try:
                    with st.spinner("Escuchando y transcribiendo…"):
                        st.session_state.transcript = transcribe(client, audio, getattr(audio, "name", "grabacion.wav"))
                    st.success("Transcripción completada")
                except Exception as exc:
                    st.error(f"No se pudo transcribir: {exc}")
    if st.session_state.transcript:
        st.text_area("Transcripción editable", value=st.session_state.transcript, height=220, key="transcript_editor")
        c1, c2, c3 = st.columns(3)
        with c1:
            st.download_button("Descargar .txt", st.session_state.transcript, "transcripcion-nexora.txt", "text/plain", use_container_width=True)
        with c2:
            if st.button("Crear resumen", use_container_width=True):
                client = require_client(api_key)
                if client:
                    try:
                        with st.spinner("Creando apuntes…"):
                            summary = chat(client, model, [{"role": "user", "content": "Resume esta transcripción en: idea central, puntos clave, decisiones y pendientes.\n\n" + st.session_state.transcript}])
                        st.session_state.summary = summary
                    except Exception as exc:
                        st.error(str(exc))
        with c3:
            if st.button("Usar en el chat", use_container_width=True):
                st.session_state.messages.append({"role": "user", "content": "Ayúdame a trabajar con esta transcripción:\n\n" + st.session_state.transcript})
                st.success("Añadida al chat")
        if st.session_state.get("summary"):
            st.markdown("### Resumen inteligente")
            st.markdown(st.session_state.summary)


def page_automations(webhook: str) -> None:
    st.title("⚡ Automatizaciones con n8n")
    st.caption("Envía una instrucción estructurada al flujo incluido en `automations/nexora-n8n.json`.")
    action = st.selectbox("Acción", ["Registrar en Google Sheets", "Enviar email", "Enviar WhatsApp"])
    action_map = {"Registrar en Google Sheets": "sheet", "Enviar email": "email", "Enviar WhatsApp": "whatsapp"}
    col1, col2 = st.columns(2)
    with col1:
        recipient = st.text_input("Destinatario / referencia", placeholder="correo@ejemplo.com o +519…")
        subject = st.text_input("Asunto", value="Mensaje enviado desde NEXORA AI")
    with col2:
        content = st.text_area("Contenido", value=st.session_state.get("summary") or st.session_state.transcript, height=130, placeholder="Contenido que procesará n8n")
    payload = {
        "action": action_map[action],
        "recipient": recipient,
        "subject": subject,
        "content": content,
        "source": APP_NAME,
        "timestamp": datetime.now().isoformat(timespec="seconds"),
    }
    with st.expander("Ver payload JSON"):
        st.code(json.dumps(payload, ensure_ascii=False, indent=2), language="json")
    if st.button("🚀 Ejecutar automatización", type="primary"):
        if not webhook:
            st.warning("Agrega la URL del webhook n8n en la barra lateral.")
        elif not content.strip():
            st.warning("Escribe contenido para la automatización.")
        else:
            try:
                response = requests.post(webhook, json=payload, timeout=15)
                response.raise_for_status()
                st.success("n8n recibió la automatización correctamente.")
                st.json(response.json() if response.content else {"ok": True})
            except requests.RequestException as exc:
                st.error(f"No se pudo contactar el webhook: {exc}")
    st.markdown("#### ¿Cómo funciona?")
    st.markdown("1. NEXORA prepara un payload seguro.  2. n8n identifica la acción.  3. El flujo registra o envía el contenido con tus credenciales de n8n.")
    st.info("La plantilla viene en modo demostración seguro. En n8n conecta tus credenciales y reemplaza cada nodo marcado como DEMO por Gmail, Google Sheets o WhatsApp Cloud/Twilio.", icon="🧩")


def page_about() -> None:
    st.title("🧠 Acerca del proyecto")
    st.markdown("""
    **NEXORA AI** integra en una sola aplicación los objetivos académicos de chatbot, transcripción y automatización.

    - Chat mediante la **Responses API** de OpenAI.
    - Transcripción mediante el modelo **gpt-transcribe**.
    - Interfaz creada con **Streamlit** y diseño responsivo.
    - Integración desacoplada con **n8n** mediante webhook.
    - Seguridad básica: clave en memoria o variable de entorno, nunca escrita en el repositorio.

    **Guion de exposición (3 minutos):** problema → chat → audio → resumen → webhook n8n → arquitectura y seguridad.
    """)
    st.code("Usuario → Streamlit → OpenAI API\n                    ↘ n8n → Email / Sheets / WhatsApp", language="text")


inject_theme()
init_state()
api_key, model, webhook, page = sidebar()
if page == "Inicio":
    page_home(api_key)
elif page == "Chat inteligente":
    page_chat(api_key, model)
elif page == "Transcriptor":
    page_transcriber(api_key, model)
elif page == "Automatizaciones":
    page_automations(webhook)
else:
    page_about()

st.markdown("<div style='text-align:center;color:#667892;padding:2.5rem 0 1rem;font-size:.8rem'>NEXORA AI · Aprende, crea y automatiza</div>", unsafe_allow_html=True)
