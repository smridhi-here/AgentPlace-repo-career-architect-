# Career Architect: AI-Orchestrated Placement Suite 🚀

**A high-performance Microservices Suite .** This platform transforms a **7.2 CGPA** academic profile into a Placement-Ready technical portfolio through Generative AI, production monitoring, and container orchestration.

---

## 📸 Visual Journey
image.png

home page
image.png

1. **The Command Center** - Features the **2-Hour Free Trial Countdown** and the Eligibility Tracker.
2. **AI Resume Interrogator** - Real-time **ATS Scoring** and Skill Gap Analysis via Gemini 1.5 Flash.
3. **The Paywall Experience** - Demonstrates the **UPI 991920** integration and Subscription Guard.

---

## 🧠 Key Intelligence Modules
### 🚀 Core Platform Modules

1. **Company Blueprint**
image.png
Dynamic strategy engine that generates a 30-day roadmap based on the target company like TCS or Amazon. (Standard Tier)


2. **Academic Tracker**
image.png
Manages CGPA and identifies blocker backlogs like Machine Learning for 6th-semester students. (Standard Tier)

3. **Resume Builder**
image.png
AI-optimized resume generator with professional exporting for software roles. (Standard Tier)

4. **OA Round Simulator**
image.png
Real-time coding environment for Online Assessment practice. (Pro Tier)

5. **Aptitude Training Centre**
image.png
Timed sessions for Quantitative and Logical Reasoning with real-time scoring. (Standard Tier)

6. **AI Interviewer**
image.png
Real-time mock interviews using Gemini 1.5 Flash with video feedback. (Pro Tier)

7. **System Design Architect**
image.png
High-level architectural diagramming for SDE roles. (Pro Tier)

8. **Practice Sheets**
image.png
Curated DSA and ML sheets gated by the Subscription Guard. (Pro Tier)

#**DEMO STATE IF LIMIT EXCEEDED**
image.png
{(isDemo || forcedemo) && <div ...>⚡ Demo Mode</div>}
Remove forcedemo when you're done testing.
this is the quickest — just paste that one line in the console whenever you want to see the badge when you right click-inspect-console and paste command to see demo state and badge when api model limit exceeded.

---

### 🔐 Subscription and Security Logic

**Standard Tier (Free)**
image.png
* Triggered when `is_pro = false` in PostgreSQL.
* Grants a 7200-second session timer.
* Provides access to basic tracking and aptitude modules.

**Expired Tier**
image.png
* Triggered when `is_pro = true` and `pro_expiry` is in the past.
* Triggers a hard lock and redirects to the Subscription Ended gateway.

**Pro Tier Upgrade**
image.png
image.png
* Activated via the 991920 UPI Merchant Gateway.
* Removes the session timer and unlocks AI Interviewer and Practice Sheets.
* "infd left" = Infinite Days Left ✅
---

## 💎 SaaS Architecture & Monetization

### ⏳ 2-Hour Free Trial Logic
* **Time-Gated Access:** Implemented a **7200-second (2-Hour)** session limit. A real-time timer badge tracks activity.
* **Premium Gate:** Once the session expires, a dynamic "Paywall" restricts access to advanced modules like System Design.

### 💳 Pro Tier & UPI Integration
* **Simulated QR Flow:** Generates a Payment QR Code linked to **Merchant Code: 991920**.
* **Verification Logic:** Implements UTR (Unique Transaction Reference) validation to unlock Pro Practice Sheets (DSA Cheat Sheets, STAR Method Guide).

### 🔐 Subscription Guard (RBAC)
* **Demo Accounts:** * `free@gmail.com` (Active Trial Mode)
    * `expired@gmail.com` (Subscription Expired - shows locks)
* **Password:** `helloworld`
Login smridhi  → shows Pro ✅  (from localStorage)
Login expiry@  → shows Lock ✅ (2hr expired long ago)
Login free@    → shows 2hr timer ✅ (registered recently)

Logout smridhi → Login again  
→ DB returns pro:true → still shows Pro ✅ (permanent now)

---

## 🐳 Running with Docker (The "Triangle" Method)

### **Option A: The VS Code "Triangle" (Visual Method)**
1. Ensure the **Docker Extension** is installed.
2. Right-click **`docker-compose.yml`** -> Select **"Compose Up"**.
3. Watch the **Docker Whale Icon** turn all services (Frontend, Backend, AI-Engine, DB) **Green**.

### **Option B: Terminal Command**
```powershell
docker-compose up -d --
### 🛠️ The Technical Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15, React 19, Tailwind CSS | Responsive UI & Session Management |
| **Backend** | Spring Boot 3.2, JPA, Spring Security | Stateless API Gateway & Business Logic |
| **AI Layer** | FastAPI, Gemini 1.5 API, LangGraph | LLM Orchestration & Resume Parsing |
| **Database** | PostgreSQL 16 | Relational Persistence & Pro-Tier Status |
| **Monitoring** | Spring Boot Actuator | Telemetry & Health Checks |
| **DevOps** | Docker & Docker Compose | Containerization & Orchestration |
📈 Strategic Impact
"This project proves that a 3rd-year student can architect a Scalable AI System. By utilizing Dockerized Microservices and Spring Boot Actuator, I have created a production-ready environment that handles both Fuzzy AI Logic and Deterministic College Policy."
pro features 
Since the table was hard to paste, use these points in your README.md to explain why the user can "enter" but remains restricted:

🔐 Granular Permissions: Login is permitted for basic account management (CGPA/Backlog tracking).

💎 AI Access Gate: All Generative AI and Pro Sheets require an active pro_expiry timestamp.

💳 UPI 991920 Gateway: Integrated Merchant Code 991920 for immediate subscription restoration.
