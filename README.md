#  Project Memory Engine

![Status](https://img.shields.io/badge/Status-MVP_Active-brightgreen)
![Python](https://img.shields.io/badge/Python-3.8+-blue)
![AI](https://img.shields.io/badge/LLM-Groq_120b-purple)
![License](https://img.shields.io/badge/License-MIT-gray)

> **Transforming unstructured team chatter into actionable, real-time project dashboards using Open-Source AI.**

The **Project Memory Engine** is an intelligent agent that simulates "listening" to informal communication channels (WhatsApp, Emails, Slack) and automatically builds a living, structured log of your projects. Say goodbye to manual documentation and lost context.

---

##  The Problem & Our Solution

**The Chaos:** Critical project context is scattered across voice notes, endless email threads, and informal chats. Project Managers waste hours compiling updates, and developers face bottlenecks due to lost requirements.
**The Engine:** A lightweight, AI-driven funnel that ingests raw communication, understands the semantic intent (distinguishing a bug from a feature request), and outputs a structured, business-ready dashboard in seconds.

##  Epic Features

###  AI & Processing
*   **Context Extraction:** Powered by Groq's API and 120b open-source models for lightning-fast, highly accurate natural language processing.
*   **Smart Categorization:** Automatically maps raw chat to General Summaries, Progress, Blockers, Backlog, and Client FAQs.

###  Business Value
*   **Real-Time ROI Calculator:** Dynamically compares estimated human manual processing time vs. AI execution speed, displaying efficiency gains (+99%) directly on the dashboard.
*   **Dynamic Health Indicators:** The engine analyzes the output matrix to automatically tag projects as `🟢 HEALTHY` or `🔴 AT RISK` based on detected blockers.
*   **Executive PDF Export:** One-click transformation of the dark-mode UI into a clean, printable white-background corporate report.

###  UI / UX
*   **Futuristic Dark Mode:** Built from scratch with Vanilla CSS/JS. Features custom color variables, neon glows, and a fully responsive grid.
*   **Simulated Streaming (Typewriter Effect):** Progressive rendering of AI summaries to provide immediate visual feedback to the user.
*   **Fluid Navigation:** Collapsible sidebar and seamless view-toggling between the Global Home Dashboard and individual Project Views.

---

##  Tech Stack

*   **Frontend:** HTML5, CSS3 (CSS Variables, Flexbox, Grid, Media Print Queries), Vanilla JavaScript (ES6+).
*   **Backend:** Python, Flask, Flask-CORS.
*   **AI Infrastructure:** `openai` SDK integrated with the Groq API ecosystem.

---

## ⚙️ Getting Started (Local Setup)

Follow these steps to deploy the MVP locally.

### 1. Backend Initialization
```bash
cd backend
# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
