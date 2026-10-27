# Smart Split

**"A clearer path to your next chapter."**

Smart Split is an AI-powered divorce and separation support platform. It provides legal education, document organization, financial planning, parenting coordination, emotional wellbeing resources, and an AI assistant powered by Ollama + Mistral — all in one secure, private workspace.

---

## ⚠️ Important Disclaimer

Smart Split is an **educational and organizational tool only**. It does **not** provide legal, financial, or psychological advice. Always consult a qualified legal professional for decisions affecting your rights.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS with custom design system |
| State | Zustand (with localStorage persistence) |
| Routing | React Router v6 |
| Charts | Recharts |
| Backend | FastAPI (Python 3.11+) |
| Database | SQLite (via SQLAlchemy async) |
| AI Runtime | Ollama (local, private) |
| AI Model | Mistral (configurable) |

---

## Quick Start

### 1. Prerequisites

- **Node.js** 18+ (`node --version`)
- **Python** 3.11+ (`python --version`)
- **Ollama** installed and running

### 2. Install Ollama

Visit https://ollama.com and follow the installation instructions for your OS.

After installing, start Ollama:
```bash
ollama serve
```

Pull the Mistral model:
```bash
ollama pull mistral
```

Verify the model is available:
```bash
ollama list
```

### 3. Set Up the Frontend

```bash
cd smart-split
npm install
npm run dev
```

The frontend will be available at: **http://localhost:5173**

### 4. Set Up the Backend

```bash
cd smart-split/backend

# Create a virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create your .env file
copy .env.example .env
# Edit .env with your values (SECRET_KEY is important)

# Start the backend
uvicorn main:app --reload --port 8000
```

The backend API will be available at: **http://localhost:8000**  
API docs: **http://localhost:8000/docs**

### 5. Demo Mode (No Backend Required)

If you don't want to run the backend, use **Demo Mode** on the login screen. This uses:
- Sample data pre-loaded in the browser
- Predefined AI responses (not live AI)
- Local browser storage for persistence

Click **"Try Demo Account"** on the login page.

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and set:

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | (required) | JWT signing key. Generate with `python -c "import secrets; print(secrets.token_hex(32))"` |
| `DATABASE_URL` | `sqlite+aiosqlite:///./smart_split.db` | SQLAlchemy database URL |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API endpoint |
| `OLLAMA_MODEL` | `mistral` | Model name. Any Ollama-compatible model works |
| `AI_REQUEST_TIMEOUT` | `120` | Seconds to wait for AI responses |
| `AI_MAX_CONTEXT_MESSAGES` | `12` | Maximum messages sent as context |
| `FRONTEND_URL` | `http://localhost:5173` | CORS allowed origin |
| `MAX_UPLOAD_SIZE_MB` | `25` | Maximum file upload size |
| `UPLOAD_DIR` | `./uploads` | Local directory for uploaded files |

---

## Project Structure

```
smart-split/
├── src/
│   ├── app/            # Zustand stores
│   ├── components/
│   │   └── ui/         # Button, Card, Input, Modal, Badge, Skeleton, Logo
│   ├── layouts/        # AppLayout (sidebar + top bar)
│   ├── pages/          # LandingPage, LoginPage, RegisterPage, Onboarding
│   ├── features/
│   │   ├── dashboard/
│   │   ├── ai-assistant/
│   │   ├── legal-guide/
│   │   ├── documents/
│   │   ├── finance/
│   │   ├── parenting/
│   │   ├── planner/
│   │   ├── wellbeing/
│   │   ├── communication/
│   │   ├── safety/
│   │   ├── resources/
│   │   ├── calendar/
│   │   ├── settings/
│   │   └── life-after/
│   ├── hooks/
│   ├── services/       # API client layer
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # helpers, sampleData
│   └── styles/         # globals.css (Tailwind)
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── api/        # auth, ai, tasks, finance, documents, calendar
│       ├── core/       # config, security
│       ├── models/     # SQLAlchemy models + database setup
│       └── services/   # ai_service (Ollama integration)
└── README.md
```

---

## Features Implemented

### Phase 1 — Foundation ✅
- React + TypeScript + Vite + Tailwind CSS design system
- Full landing page with navigation, hero, features, privacy, FAQ, footer
- Authentication (register, login, demo mode, forgot password)
- Onboarding wizard (7 steps: name, stage, country, goals, children)
- Responsive app shell with collapsible sidebar (15 navigation items)
- Dashboard with stats, tasks, financial summary, notifications, quick actions

### Phase 2 — Core Features ✅
- **AI Assistant** — Streaming chat with Ollama/Mistral, demo mode, conversation history, suggested prompts, copy/regenerate, feedback
- **Legal Guide** — 5 educational articles, glossary, category filters, search, bookmarks
- **Document Center** — Upload (drag & drop), categories, list/grid view, favorites, delete
- **Financial Planner** — Income/expense/asset/debt tracking, pie charts, bar charts, scenario planner, budget vs. actual
- **Separation Planner** — 8-stage task system, progress tracking, priorities, due dates

### Phase 3 — Features ✅
- **Parenting & Custody Hub** — Child profiles, event calendar, schedule templates
- **Wellbeing Center** — Mood check-in, private journal, breathing exercises, reflection prompts
- **Communication Hub** — Message drafting, AI tone rewriting, draft management
- **Safety & Support** — Crisis resources (UK/US/AU), safety checklist, digital safety, quick exit
- **Life After Divorce** — Goals, address-change checklist, moving planner
- **Resources Library** — Search, categories, bookmarks, recently viewed

### Phase 4 ✅
- **Calendar** — Monthly view, agenda view, event types, reminders
- **Notifications** — Read/unread, mark all read, dismiss
- **Settings** — Profile, jurisdiction, appearance (dark/light theme), notifications, privacy, data export, account deletion
- **Help & Support** — FAQ search, AI limitations, contact form (demo mode)

### Backend ✅
- FastAPI with async SQLAlchemy + SQLite
- JWT authentication (bcrypt password hashing)
- Ollama/Mistral streaming SSE endpoint
- Per-user data isolation on all endpoints
- File upload with type and size validation
- Tasks, Finance, Calendar, Documents, Auth APIs

---

## AI Setup (Ollama + Mistral)

The AI assistant connects to Ollama running locally. Your conversations never leave your machine.

**Status indicator** is shown in the AI Assistant page:
- 🟢 **Connected** — Ollama running, Mistral available
- 🟡 **Demo mode** — Ollama not running, predefined educational responses shown
- 🔴 **Model not installed** — Ollama running but model needs to be pulled

**To enable full AI:**
```bash
# 1. Install Ollama
# Visit: https://ollama.com

# 2. Start Ollama
ollama serve

# 3. Download Mistral
ollama pull mistral

# 4. Start backend
cd backend && uvicorn main:app --reload

# 5. Open Smart Split
# Navigate to /app/ai
```

**Use a smaller model** (less RAM required):
```bash
ollama pull mistral:7b-instruct-q4_K_M
# Then set in .env: OLLAMA_MODEL=mistral:7b-instruct-q4_K_M
```

---

## Running the Production Build

```bash
cd smart-split
npm run build
# Outputs to dist/ — serve with any static host or nginx
```

---

## Security Notes

- JWT tokens expire after 24 hours (configurable)
- Passwords hashed with bcrypt (72-byte limit respected)
- All API endpoints enforce user-level data isolation
- File uploads validated by content-type and size
- CORS restricted to configured frontend URL
- Never commit `.env` to source control
- Change `SECRET_KEY` before any deployment

---

## Known Limitations / Further Work

- **Google OAuth** — UI placeholder exists; requires OAuth credentials to enable
- **Email notifications** — Backend integration with email service needed
- **OCR** — Document text extraction from scanned files not implemented
- **Advanced AI document tools** — Summarize/extract from uploaded documents requires text extraction pipeline
- **PostgreSQL** — Switch `DATABASE_URL` in `.env` for production (e.g. `postgresql+asyncpg://...`)
- **HTTPS** — Configure a reverse proxy (nginx/caddy) with TLS for production deployment
- **Password reset emails** — Requires SMTP or email service configuration
