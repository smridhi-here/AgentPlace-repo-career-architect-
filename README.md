# AgentPlace — AI-Powered Campus Placement Suite 🚀

> Transforms a student profile into a placement-ready portfolio using Generative AI, microservices, and real-time mock interviews.

**Live Demo:** https://career-architect-zbs9.vercel.app


image.png


---

## ⚠️ Before Running the Demo

This app uses a free Render instance that sleeps after inactivity.

**Open this URL first and wait 30 seconds:**
👉 https://career-architect-ai-h4ii.onrender.com/health

You should see: `{"status":"ok"}` — then the app is fully live.

> The app also auto-wakes on load, but visiting the health URL first ensures zero wait time during a demo.

**To Demo:**
Register a free account on the live site — the 2-hour trial starts immediately.
To see Pro features, use UTR code `991920` in the payment flow.

---

## 🧠 Features

### 1. 🏢 Company Blueprint Engine
Generates a personalised 30-day roadmap based on target company (TCS, Amazon, Google, etc.). Checks CGPA and backlog eligibility against real company cutoffs. Free tier.

<img width="1913" height="943" alt="image" src="https://github.com/user-attachments/assets/0e42a02a-3457-4096-8c2b-2b577f021c81" />


---

### 2. 🎓 Academic Optimizer
Tracks CGPA trajectory and backlog status. Identifies blockers like pending re-exams. Generates a 12-week hybrid study + DSA timeline. Free tier.

image.png


---

### 3. 📄 ATS Resume & GitHub Analyser
Reads actual PDF text and live GitHub profile data via the GitHub API. Returns an ATS score, keyword gap analysis, strengths, weaknesses, and 3 AI-generated interview questions based on real projects. Free tier.

<img width="1916" height="936" alt="image" src="https://github.com/user-attachments/assets/28afba16-694c-46c5-a647-fd7e1971e389" />


---

### 4. ⏱ OA Round Simulator
Timed coding environment (90-minute countdown) with 8 DSA problems. Supports JavaScript execution, test case running, and AI Big-O complexity analysis. Free tier.

<img width="1919" height="941" alt="image" src="https://github.com/user-attachments/assets/bdb3341a-e2ab-48ae-ae1e-e8bc96daca52" />


---

### 5. 🧠 Aptitude Training Centre
50-question bank across Quant, Logic, and Verbal. Timed 30-second per question. Tracks score history in localStorage. Free tier.

<img width="1912" height="947" alt="image" src="https://github.com/user-attachments/assets/7795f69c-495e-43ce-9a77-1ad48fd6186d" />

<img width="1919" height="929" alt="image" src="https://github.com/user-attachments/assets/16f38621-326a-4c4f-b0e9-f3a7d51ec8cb" />



---

### 6. 🎥 Live AI Mock Interview
Real-time video mock interview with 3 interviewer personas (friendly HR, strict FAANG, behavioural HR). Speech-to-text input, text-to-speech AI responses, 6-question dynamic flow, and a full performance report with scores across communication, technical, and confidence. Pro tier.

<img width="1919" height="959" alt="image" src="https://github.com/user-attachments/assets/39f004e1-1178-49cf-93a8-7ce1971bcffd" />

<img width="1917" height="940" alt="image" src="https://github.com/user-attachments/assets/fbc9df36-ff37-4e4f-bc94-3c1150306e1f" />



---

### 7. 🗺 System Design Whiteboard
Drag-and-drop architecture builder with 10 components (Client, Load Balancer, Cache, Database, etc.). Click two nodes to connect them. Click a connection line to remove it. AI critique gives score, strengths, issues, and suggestions. Pro tier.

<img width="1919" height="947" alt="image" src="https://github.com/user-attachments/assets/8e5d8422-2e76-4d89-a3be-4283c89cc6cd" />


---

### 8. 📋 Practice Sheets
DSA cheat sheet, interview patterns (STAR, coding flow, system design framework), aptitude formulae, and HR guide. Pro tier.

<img width="1915" height="948" alt="image" src="https://github.com/user-attachments/assets/14bb7b8f-bd70-417e-b3a0-497ce8c81f9f" />


---

## 💳 Subscription System

### Free Trial (2 Hours)
- 7200-second countdown timer shown in navbar
- Access to Blueprint, Academic, Resume, OA, Aptitude tabs
- Timer stored per account using account creation timestamp

### Pro Tier Upgrade Flow

<img width="1849" height="939" alt="image" src="https://github.com/user-attachments/assets/83432ab9-43df-49dc-acb9-0b836c6f8c00" />

<img width="1919" height="933" alt="image" src="https://github.com/user-attachments/assets/28e5aa2c-3232-49e0-ad72-4872879b24dd" />



- Select plan (Monthly ₹199 / Quarterly ₹499 / Yearly ₹999)
- Scan QR code → enter UTR number `991920` → verified instantly
- Unlocks Interview Simulator, System Design, Practice Sheets
- Pro status persisted in PostgreSQL database (survives logout/login)

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js 15    │────▶│  Spring Boot 3.2 │────▶│  PostgreSQL 16  │
│   (Vercel)      │     │  (Docker)        │     │  (Docker)       │
└────────┬────────┘     └──────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│   FastAPI       │────▶  OpenRouter AI (nvidia/mistral free tier)
│   (Render)      │────▶  GitHub REST API
│                 │────▶  pypdf (resume parsing)
└─────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 15, React 19 | UI, session management, timer logic |
| Backend | Spring Boot 3.2, JPA | Auth, user data, Pro status |
| AI Engine | FastAPI, OpenRouter | LLM calls, GitHub fetch, PDF parse |
| Database | PostgreSQL 16 | User accounts, Pro expiry |
| Monitoring | Spring Boot Actuator | Health checks |
| DevOps | Docker, Docker Compose | Local orchestration |
| Deployment | Vercel + Render | Frontend + AI engine hosting |

---

## 🐳 Running Locally

### Option A — Docker (recommended)

```bash
docker-compose up -d --build
```

Then open: http://localhost:3000

### Option B — Manual

**AI Engine (Python):**
```bash
cd ai-engine
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Backend (Java):**
```bash
cd backend
./mvnw spring-boot:run
```

**Frontend (Next.js):**
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Create `.env.local` in the frontend folder:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_AI_ENGINE_URL=http://localhost:8000
```

Create `.env` in the ai-engine folder:
```
OPENROUTER_API_KEY=your_key_here
GITHUB_TOKEN=your_token_here
```

---

## 📁 Project Structure

```
newagent/
├── frontend/          # Next.js app (page.tsx is the entire frontend)
├── backend/           # Spring Boot auth + user API
├── ai-engine/         # FastAPI — LLM, GitHub, PDF endpoints
│   └── main.py
├── docker-compose.yml
└── README.md
```

---

## 🔑 Key Design Decisions

- **Single-file frontend** — entire UI in `page.tsx` for easy demonstration and deployment
- **Free AI tier** — uses OpenRouter free models with a demo fallback when quota is hit
- **Demo mode** — when AI is unavailable, realistic sample data is shown with a visible banner rather than errors
- **Auto-wake** — app pings the Render AI engine on startup to minimise cold-start delay
- **CGPA/backlog validation** — eligibility enforced client-side against real company cutoffs, AI score overridden if ineligible

## Keep-Alive Setup

Both Render services are kept awake 24/7 using UptimeRobot (free).

| Service | URL Monitored | Interval |
|---|---|---|
| Python AI Engine | https://career-architect-ai-h4ii.onrender.com/ping | 5 min |
| Java Backend | https://career-architect-twlt.onrender.com/actuator/health | 5 min |

UptimeRobot pings both every 5 minutes so Render free tier never spins down.
The `/ping` endpoint in `main.py` accepts both GET and HEAD requests for compatibility.
