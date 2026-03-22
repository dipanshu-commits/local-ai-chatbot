# 🧠 Local AI Chat App

A fully private, offline AI chat application built with React, FastAPI and Ollama. Runs entirely on your machine — no internet, no subscriptions, no data logging.

## ✨ Features
- 💬 Chat with a local LLM (Llama 3.2)
- 🎭 Dynamic AI personas based on your questions
- 🎨 6 basic themes
- ⚙️ Personality controls (creativity, formality, length)
- 💾 Chat history saved locally
- 🖥️ Desktop app via Electron
- 🔒 100% private & offline

## 🛠️ Tech Stack
- **Frontend:** React + Vite
- **Backend:** Python + FastAPI
- **AI Engine:** Ollama (Llama 3.2:3b)
- **Desktop:** Electron

## 🚀 How to Run

### Prerequisites
- [Ollama](https://ollama.com) installed with `llama3.2:3b` model
- Python 3.10+
- Node.js 18+

### Steps
1. Clone the repo
2. Setup backend:
```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload
```
3. Setup frontend:
```bash
   cd frontend
   npm install
   npm run dev
```
4. Setup Electron:
```bash
   cd electron
   npm install
   node_modules\.bin\electron .
```

Or just double click `Start AI Chat.bat`!

## 📸 Built by Dipanshu Sinha