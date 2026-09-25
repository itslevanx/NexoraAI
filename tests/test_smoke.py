from pathlib import Path
import json


ROOT = Path(__file__).parents[1]


def test_required_files_exist():
    for relative in [
        "app.py",
        "requirements.txt",
        "assets/nexora-icon.png",
        "automations/nexora-n8n.json",
        "public/index.html",
        "public/styles.css",
        "public/app.js",
        "api/realtime-session.js",
        "api/automation.js",
        "vercel.json",
    ]:
        assert (ROOT / relative).exists(), relative


def test_n8n_workflow_is_json():
    data = json.loads((ROOT / "automations/nexora-n8n.json").read_text())
    assert data["name"] == "NEXORA AI - Centro de automatizaciones"
    assert len(data["nodes"]) >= 4
