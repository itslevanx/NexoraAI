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
        :root { --bg:#050505; --panel:#0b0b0b; --line:#262626; --ink:#f5f5f5; --muted:#969696; }
        html, body, [class*="css"] { font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
        .stApp { background:var(--bg); color:var(--ink); }
        [data-testid="stSidebar"] { background:#080808; border-right:1px solid var(--line); }
        [data-testid="stHeader"] { background:transparent; }
        .block-container { max-width:1120px; padding-top:2rem; }
        h1,h2,h3 { letter-spacing:-.045em; font-weight:600!important; }
        .hero { padding:4.5rem 2rem; border-bottom:1px solid var(--line); margin-bottom:1.5rem; text-align:center; }
        .hero-row { display:block; }
        .eyebrow { font-size:.7rem; letter-spacing:.18em; color:var(--muted); font-weight:600; text-transform:uppercase; }
        .hero h1 { margin:.65rem 0 .8rem; font-size:clamp(3rem,7vw,6rem); color:#fff; line-height:.95; }
        .hero p { margin:0 auto; color:var(--muted); font-size:1.02rem; max-width:620px; }
        .status-pill { display:inline-flex; align-items:center; gap:.5rem; margin-top:1.2rem; padding:.4rem .75rem; border-radius:999px;
          background:#0a0a0a; border:1px solid var(--line); color:#cfcfcf; font-size:.78rem; }
        .dot { width:7px;height:7px;border-radius:50%;background:#fff; }
        .feature { padding:1.25rem; min-height:112px; border:1px solid var(--line); border-radius:16px;
          background:var(--panel); transition:border-color .2s ease; }
        .feature:hover { border-color:#555; }
        .feature b { color:white; display:block; margin-bottom:.3rem; }
        .feature span { color:var(--muted); font-size:.9rem; }
        .metric { padding:1rem; border-radius:16px; background:var(--panel); border:1px solid var(--line); text-align:center; }
        .metric strong { display:block;font-size:1.45rem;color:#fff; }
        .metric small { color:var(--muted); }
        .wave { height:46px; display:flex; align-items:center; justify-content:center; gap:5px; margin:.5rem 0 1rem; }
        .wave i { width:3px; border-radius:8px; background:#fff; animation:wave 1.1s ease-in-out infinite; }
        .wave i:nth-child(2){animation-delay:.1s}.wave i:nth-child(3){animation-delay:.2s}.wave i:nth-child(4){animation-delay:.3s}.wave i:nth-child(5){animation-delay:.4s}.wave i:nth-child(6){animation-delay:.5s}.wave i:nth-child(7){animation-delay:.6s}
        .result { border:1px solid var(--line); background:var(--panel); padding:1rem 1.2rem; border-radius:14px; }
        .stButton>button { border-radius:999px; border:1px solid #fff; background:#fff; color:#050505; font-weight:600; }
        .stButton>button:hover { background:#ddd; border-color:#ddd; color:#050505; }
        [data-testid="stChatMessage"] { border:1px solid var(--line); border-radius:16px; background:var(--panel); padding:.45rem .7rem; }
        input, textarea, [data-baseweb="select"] > div { background:#090909!important; border-color:var(--line)!important; }
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
    st.markdown(
        """
        <section class="hero"><div class="hero-row"><div>
          <div class="eyebrow">Asistente académico</div>
          <h1>NEXORA AI</h1>
          <p>Conversación, voz y automatización en una experiencia clara y directa.</p>
          <span class="status-pill"><span class="dot"></span> Listo para conectar</span>
        </div></div></section>
        """,
        unsafe_allow_html=True,
    )


def sidebar() -> tuple[str, str, str, str]:
    with st.sidebar:
        st.markdown("# ◯ NEXORA")
        st.caption("Configuración")
        api_key = st.text_input("OpenAI API Key", type="password", placeholder="sk-proj-…", help="Solo vive en esta sesión; no se guarda.")
        model = st.text_input("Modelo de chat", value=DEFAULT_MODEL, help="Puedes cambiarlo por un modelo disponible en tu cuenta.")
        webhook = st.text_input("Webhook n8n local", value=os.getenv("N8N_WEBHOOK_URL", "http://localhost:5678/webhook/nexora"), placeholder="http://localhost:5678/webhook/nexora")
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
        ("Chat contextual", "Conversaciones útiles con memoria durante la sesión."),
        ("Audio a texto", "Transcripción precisa de clases, entrevistas y notas de voz."),
        ("Flujos n8n", "Dispara correos, registros y mensajes desde un webhook."),
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
    st.info("Demo sugerida: pregunta, transcribe un audio y envía su resumen a n8n.")


def page_chat(api_key: str, model: str) -> None:
    st.title("Chat inteligente")
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
    st.title("Transcriptor inteligente")
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
        elif st.button("Transcribir con IA", type="primary"):
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
    st.title("Automatizaciones con n8n")
    st.caption("Envía una instrucción estructurada al flujo incluido en `automations/nexora-n8n.json`.")
    action_map = {
        "Registrar en la bitácora local": "sheet",
        "Preparar email": "email",
        "Preparar WhatsApp": "whatsapp",
        "Crear plan de tareas": "task",
        "Preparar sesión de estudio": "study",
        "Preparar evento de calendario": "calendar",
    }
    action = st.selectbox("Acción", list(action_map))
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
    if st.button("Ejecutar automatización", type="primary"):
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
    st.markdown("1. NEXORA valida el payload.  2. n8n asigna prioridad y lo guarda en una bitácora JSONL local.  3. El workflow crea un registro, borrador, checklist, plan de estudio o evento listo para revisión.")
    st.info("El flujo funciona sin nube y no envía mensajes por accidente. Los borradores de email, WhatsApp y calendario exigen aprobación humana antes de conectar credenciales reales.")

    st.divider()
    st.subheader("Laboratorios avanzados")
    st.caption("Cuatro workflows independientes para una demostración más completa en la Mac.")
    advanced_map = {
        "Coach de estudio adaptativo": "nexora-study-coach",
        "Laboratorio de reuniones": "nexora-meeting-lab",
        "Guardián de privacidad": "nexora-privacy-guardian",
        "Panel de impacto local": "nexora-impact-dashboard",
    }
    advanced_name = st.selectbox("Workflow avanzado", list(advanced_map), key="advanced_workflow")
    endpoint = webhook.rsplit("/", 1)[0] + "/" + advanced_map[advanced_name] if webhook and "/" in webhook else ""
    if advanced_name == "Panel de impacto local":
        st.caption("Consolida las bitácoras de actividad, estudio, reuniones y privacidad.")
        if st.button("Actualizar panel de impacto", use_container_width=True):
            if not endpoint:
                st.warning("Configura primero el webhook local de n8n.")
            else:
                try:
                    response = requests.get(endpoint, timeout=15)
                    response.raise_for_status()
                    st.json(response.json())
                except requests.RequestException as exc:
                    st.error(f"No se pudo consultar el panel: {exc}")
    else:
        advanced_content = st.text_area(
            "Material del laboratorio",
            value=st.session_state.get("summary") or st.session_state.transcript,
            height=150,
            key="advanced_content",
            placeholder="Pega apuntes, una transcripción o el texto que deseas revisar",
        )
        advanced_payload = {"content": advanced_content, "source": APP_NAME}
        if advanced_name == "Coach de estudio adaptativo":
            advanced_payload.update({"topic": subject, "minutes": 50})
        elif advanced_name == "Laboratorio de reuniones":
            advanced_payload.update({"title": subject, "attendees": recipient, "transcript": advanced_content})
        if st.button("Ejecutar laboratorio avanzado", type="primary", use_container_width=True):
            if not endpoint:
                st.warning("Configura primero el webhook local de n8n.")
            elif not advanced_content.strip():
                st.warning("Agrega material para procesar.")
            else:
                try:
                    response = requests.post(endpoint, json=advanced_payload, timeout=15)
                    response.raise_for_status()
                    st.success(f"{advanced_name} completado.")
                    st.json(response.json())
                except requests.RequestException as exc:
                    st.error(f"No se pudo ejecutar el laboratorio: {exc}")


def page_about() -> None:
    st.title("Acerca del proyecto")
    st.markdown("""
    **NEXORA AI** integra en una sola aplicación los objetivos académicos de chatbot, voz, contenido multimodal, transcripción y automatización.

    - Chat mediante la **Responses API** de OpenAI.
    - Voz a voz en la experiencia Vercel mediante **Realtime API y WebRTC**.
    - Once herramientas de texto, visión, generación de imágenes, voz sintética y moderación en **Studio IA**.
    - Transcripción mediante el modelo **gpt-transcribe**.
    - Interfaz creada con **Streamlit** y diseño responsivo.
    - Seis automatizaciones locales con **n8n**, prioridad, bitácora y aprobación humana.
    - Seguridad básica: clave en memoria o variable de entorno, nunca escrita en el repositorio.

    **Guion de exposición:** problema → voz → Studio IA → audio → resumen → webhook n8n → arquitectura y seguridad.
    """)
    st.code("Usuario → Streamlit / Vercel → OpenAI API\n                           ↘ n8n local → bitácora / tareas / estudio / borradores", language="text")


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
