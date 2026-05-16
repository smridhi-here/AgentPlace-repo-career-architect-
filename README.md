# AgentPlace — AI-Powered Campus Placement Suite 🚀

> Transforms a student profile into a placement-ready portfolio using Generative AI, microservices, and real-time mock interviews.

**Live Demo:** https://career-architect-zbs9.vercel.app

<img width="1919" height="964" alt="Screenshot 2026-05-03 040340" src="https://github.com/user-attachments/assets/d02e96d6-48f7-4c69-9197-7e15400b7610" />


<img width="1919" height="946" alt="Screenshot 2026-05-04 025829" src="https://github.com/user-attachments/assets/14b2ffea-25f7-4df3-a4d6-8cbf54bfd329" />



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


<img width="1908" height="953" alt="Screenshot 2026-05-03 031309" src="https://github.com/user-attachments/assets/2b6c5d0c-d5ad-4d92-89d3-2b98a159c5c0" />



---

### 2. 🎓 Academic Optimizer
Tracks CGPA trajectory and backlog status. Identifies blockers like pending re-exams. Generates a 12-week hybrid study + DSA timeline. Free tier.
<img width="1919" height="965" alt="Screenshot 2026-05-03 031408" src="https://github.com/user-attachments/assets/aa08995f-1e25-4522-9e9e-219a8be699eb" />


---

### 3. 📄 ATS Resume & GitHub Analyser
Reads actual PDF text and live GitHub profile data via the GitHub API. Returns an ATS score, keyword gap analysis, strengths, weaknesses, and 3 AI-generated interview questions based on real projects. Free tier.
<img width="1919" height="961" alt="Screenshot 2026-05-03 031528" src="https://github.com/user-attachments/assets/f0ea626d-c77f-429f-ab69-0ad8602d3de5" />



---

### 4. ⏱ OA Round Simulator
Timed coding environment (90-minute countdown) with 8 DSA problems. Supports JavaScript execution, test case running, and AI Big-O complexity analysis. Free tier.


---

### 5. 🧠 Aptitude Training Centre
50-question bank across Quant, Logic, and Verbal. Timed 30-second per question. Tracks score history in localStorage. Free tier.


<img width="1889" height="919" alt="Screenshot 2026-05-03 031649" src="https://github.com/user-attachments/assets/315f5a4e-be89-4221-acc1-727c52bc7620" />

<img width="1893" height="708" alt="Screenshot 2026-05-03 031716" src="https://github.com/user-attachments/assets/0da87a84-31b0-47d9-b0e3-58ac272ad7dd" />




---

### 6. 🎥 Live AI Mock Interview
Real-time video mock interview with 3 interviewer personas (friendly HR, strict FAANG, behavioural HR). Speech-to-text input, text-to-speech AI responses, 6-question dynamic flow, and a full performance report with scores across communication, technical, and confidence. Pro tier.

<img width="1912" height="949" alt="Screenshot 2026-05-03 031800" src="https://github.com/user-attachments/assets/3d526caf-94d3-479a-b300-c003ebd775f5" />

<img width="1907" height="1022" alt="Screenshot 2026-05-03 031907" src="https://github.com/user-attachments/assets/7044344b-da1b-4900-8828-d3192179f20c" />




---

### 7. 🗺 System Design Whiteboard
Drag-and-drop architecture builder with 10 components (Client, Load Balancer, Cache, Database, etc.). Click two nodes to connect them. Click a connection line to remove it. AI critique gives score, strengths, issues, and suggestions. Pro tier.

<img width="1848" height="936" alt="Screenshot 2026-05-03 032042" src="https://github.com/user-attachments/assets/b9111633-c7a6-4d73-83b7-a926e7e24026" />

<img width="1904" height="936" alt="Screenshot 2026-05-03 032100" src="https://github.com/user-attachments/assets/dab122ee-0758-4ffa-8833-105d2bdb5816" />



---

### 8. 📋 Practice Sheets
DSA cheat sheet, interview patterns (STAR, coding flow, system design framework), aptitude formulae, and HR guide. Pro tier.

<img width="1915" height="957" alt="Screenshot 2026-05-03 032158" src="https://github.com/user-attachments/assets/4485eef8-7501-4c66-9d6e-94872b0d3713" />


---

## 💳 Subscription System

### Free Trial (2 Hours)
- 7200-second countdown timer shown in navbar
- Access to Blueprint, Academic, Resume, OA, Aptitude tabs
- Timer stored per account using account creation timestamp

### Pro Tier Upgrade Flow!




<img width="1914" height="938" alt="Screenshot 2026-05-03 032240" src="https://github.com/user-attachments/assets/36a32a10-ab8f-414e-822a-692e60f11380" />






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
