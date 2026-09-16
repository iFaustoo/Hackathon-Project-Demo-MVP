"""
llm_service.py
Único punto de contacto con el LLM (Groq, corriendo modelos open-source).
Si en algún momento cambia el proveedor, este es el ÚNICO
archivo que hay que tocar.

La API de Groq es compatible con el SDK de OpenAI: mismo cliente,
mismo formato de mensajes, solo cambia el `base_url`, la `api_key` y
el nombre del modelo. Groq no sirve modelos de Anthropic/Claude: corre
modelos open-source (Llama, Mixtral, Qwen, etc.) a muy alta velocidad,
en un tier gratuito real que no pide tarjeta de crédito.
"""

import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
GROQ_BASE_URL = "https://api.groq.com/openai/v1"

client = OpenAI(
    api_key=GROQ_API_KEY,
    base_url=GROQ_BASE_URL,
)

SYSTEM_PROMPT = """Sos un asistente que analiza comunicaciones informales de equipos de trabajo
(WhatsApp, mails) y genera una bitácora clara y organizada del estado de un proyecto.

Vas a recibir el nombre, la descripción y una lista de mensajes de un proyecto.
Tu tarea es leer todos los mensajes y devolver EXCLUSIVAMENTE un JSON válido
(sin texto adicional, sin markdown, sin ```), con exactamente esta estructura:

{
  "resumen_general": "string: 2-3 oraciones resumiendo el estado actual del proyecto",
  "avances": ["string", "..."],
  "pendientes_backlog": ["string", "..."],
  "preguntas_frecuentes_cliente": ["string", "..."],
  "bloqueos_o_riesgos": ["string", "..."],
  "proximos_pasos": ["string", "..."]
}

Reglas:
- Cada item de las listas debe ser una oración corta y concreta, en español.
- Si no hay información para alguna lista, devolvé una lista vacía [].
- No inventes información que no esté en los mensajes.
- No repitas literalmente los mensajes, sintetizalos.
"""


def _build_user_prompt(project_data: dict) -> str:
    """Arma el prompt con la info del proyecto y sus mensajes."""
    mensajes_texto = "\n".join(
        f"- [{m['date']}] ({m['channel']} | {m['author']} | {m['type']}): {m['content']}"
        for m in project_data.get("messages", [])
    )

    return f"""Proyecto: {project_data.get('project_name')}
Descripción: {project_data.get('description')}
Estado actual (declarado): {project_data.get('status')}
Equipo: {', '.join(project_data.get('team', []))}

Mensajes del proyecto:
{mensajes_texto}

Generá el JSON de la bitácora según las instrucciones del sistema."""


def _extract_json(raw_text: str) -> dict:
    """Limpia posibles fences de markdown y parsea el JSON de la respuesta."""
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    return json.loads(cleaned.strip())


def generar_resumen(project_data: dict) -> dict:
    """
    Recibe el dict completo de un proyecto (tal como viene del JSON mock)
    y devuelve el resumen estructurado generado por el LLM.

    Si algo falla (red, parseo, etc.), devuelve un dict con "error" para
    que el endpoint lo pueda manejar sin explotar.
    """
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": _build_user_prompt(project_data)},
            ],
            max_tokens=2500,
            temperature=0.3,
        )
        raw_text = response.choices[0].message.content
        return _extract_json(raw_text)

    except json.JSONDecodeError as e:
        return {"error": f"El modelo no devolvió un JSON válido: {e}", "raw": raw_text}
    except Exception as e:
        return {"error": f"Error al generar el resumen: {e}"}