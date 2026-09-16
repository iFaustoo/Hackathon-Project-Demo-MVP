"""
app.py

Backend Flask del Project Memory Engine.
Corre por separado del frontend (que se sirve con Live Server).

Endpoints:
  GET /api/projects                  -> lista los 3 proyectos (info básica)
  GET /api/projects/<id>/messages    -> mensajes crudos de un proyecto
  GET /api/projects/<id>/summary     -> resumen generado por el LLM

Correr con: python app.py
"""

import os
import json
from flask import Flask, jsonify
from flask_cors import CORS

from llm_service import generar_resumen

app = Flask(__name__)
CORS(app)  # permite que el frontend (Live Server, otro puerto) llame a esta API

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

PROJECT_FILES = {
    "autos": "proyecto_autos.json",
    "agro": "proyecto_agro.json",
    "software": "proyecto_software.json",
}


def _load_project(project_id: str) -> dict:
    """Carga el JSON de un proyecto desde /data. Lanza FileNotFoundError si no existe."""
    filename = PROJECT_FILES.get(project_id)
    if not filename:
        raise FileNotFoundError(f"Proyecto '{project_id}' no existe")

    path = os.path.join(DATA_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@app.route("/api/projects", methods=["GET"])
def listar_proyectos():
    """Devuelve la info básica de los 3 proyectos (sin los mensajes, para que sea liviano)."""
    proyectos = []
    for project_id in PROJECT_FILES:
        data = _load_project(project_id)
        proyectos.append({
            "project_id": data["project_id"],
            "project_name": data["project_name"],
            "description": data["description"],
            "status": data["status"],
            "team": data["team"],
        })
    return jsonify(proyectos)


@app.route("/api/projects/<project_id>/messages", methods=["GET"])
def mensajes_proyecto(project_id):
    """Devuelve los mensajes crudos (mock) de un proyecto puntual."""
    try:
        data = _load_project(project_id)
    except FileNotFoundError:
        return jsonify({"error": "Proyecto no encontrado"}), 404

    return jsonify(data["messages"])


@app.route("/api/projects/<project_id>/summary", methods=["GET"])
def resumen_proyecto(project_id):
    """Genera (llamando al LLM) y devuelve el resumen estructurado de un proyecto."""
    try:
        data = _load_project(project_id)
    except FileNotFoundError:
        return jsonify({"error": "Proyecto no encontrado"}), 404

    resumen = generar_resumen(data)

    if "error" in resumen:
        return jsonify(resumen), 500

    return jsonify(resumen)


if __name__ == "__main__":
    print("Arrancando Flask en http://localhost:5000 ...")
    app.run(debug=True, port=5000, use_reloader=False)