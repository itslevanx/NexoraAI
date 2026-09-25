from pathlib import Path
import json


ROOT = Path(__file__).parents[1]


def test_required_files_exist():
    for relative in [
        "app.py",
        "requirements.txt",
        "assets/nexora-icon.png",
        "assets/nexora-logo.svg",
        "automations/nexora-n8n.json",
        "public/index.html",
        "public/logo.svg",
        "public/favicon.svg",
        "public/styles.css",
        "public/app.js",
        "api/realtime-session.js",
        "api/automation.js",
        "api/studio.js",
        "api/speech.js",
        "api/image.js",
        "api/vision.js",
        "api/moderate.js",
        "vercel.json",
    ]:
        assert (ROOT / relative).exists(), relative


def test_n8n_workflow_is_json():
    data = json.loads((ROOT / "automations/nexora-n8n.json").read_text())
    assert data["name"] == "NEXORA AI - Automatizaciones locales inteligentes"
    assert len(data["nodes"]) >= 4
    assert "Guardar bitácora local" in {node["name"] for node in data["nodes"]}
    source = "\n".join(
        node.get("parameters", {}).get("jsCode", "") for node in data["nodes"]
    )
    for action in ["sheet", "email", "whatsapp", "task", "study", "calendar"]:
        assert action in source


def test_documentation_mentions_multimodal_capabilities():
    readme = (ROOT / "README.md").read_text()
    documentation = (ROOT / "docs/DOCUMENTACION_COMPLETA.md").read_text()
    for capability in ["Studio IA", "Visión", "Generación de imágenes", "Texto a voz", "Moderación"]:
        assert capability in readme
        assert capability in documentation
    for local_feature in ["bitácora", "seis acciones", "localhost:5678"]:
        assert local_feature in readme
        assert local_feature in documentation
