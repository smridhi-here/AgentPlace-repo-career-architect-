import asyncio
from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import httpx
import os
import re

app = FastAPI()

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(status_code=422, content={"detail": str(exc)})

@app.post("/v1/chat-debug")
async def chat_debug(request: Request):
    body = await request.body()
    return {"received": str(body)}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def _get_demo_response(contents: list) -> str:
    last = ""
    for c in reversed(contents):
        if c.get("role") == "user":
            last = (c.get("content") or "").lower()
            break

    # Count assistant messages to track question number
    q_count = sum(1 for c in contents if c.get("role") == "assistant")

    # Detect interview context from system prompt or message content
    system_content = ""
    for c in contents:
        if c.get("role") == "system":
            system_content = (c.get("content") or "").lower()
            break

    is_interview = (
        "interviewer" in system_content or
        "priya" in system_content or
        "rahul" in system_content or
        "neha" in system_content or
        "feedback:" in last or
        "next:" in last or
        "greet" in last or
        "starting" in last or
        "interview is starting" in last
    )

    INTERVIEW_QS = [
        "Tell me about yourself and your most impactful project.",
        "Describe the hardest bug you ever debugged — what was your process?",
        "How do you approach learning a new technology under deadline pressure?",
        "Tell me about a time you conflicted with a teammate and how you resolved it.",
        "Where do you see yourself in 3 years, and why does this role interest you?",
        "What is your greatest technical strength and give me a concrete example?",
    ]
    INTERVIEW_FB = [
        "Good start — try to add specific metrics or outcomes next time.",
        "Nice structure. Mention what tools or technologies you used.",
        "Good approach. Try to quantify how quickly you ramped up.",
        "Well handled. Always close by stating what you personally learned.",
        "Clear direction. Tie it more to the company mission.",
        "Strong response. Back it up with a concrete project example.",
    ]

    if is_interview:
        is_dk = any(phrase in last for phrase in ["don't know","dont know","idk","no idea","not sure","skip","pass","nothing","blank"])
        if q_count == 0:
            return f"FEEDBACK: Welcome! Let's begin.\nNEXT: {INTERVIEW_QS[0]}"
        if is_dk:
            idx = min(q_count, len(INTERVIEW_QS)-1)
            return f"FEEDBACK: That is okay, let us try a different question.\nNEXT: {INTERVIEW_QS[idx]}"
        if q_count >= 6:
            return "FEEDBACK: Great session overall! You showed good communication skills.\nNEXT: END_INTERVIEW"
        idx = min(q_count, len(INTERVIEW_QS) - 1)
        fb_idx = max(0, idx - 1)
        fb = INTERVIEW_FB[fb_idx] if last and len(last) > 10 else "Good effort — keep going."
        return f"FEEDBACK: {fb}\nNEXT: {INTERVIEW_QS[idx]}"

    if "eligible" in last and "actionplan" in last:
        backlog_match = re.search(r'backlogs?[^\d]*(\d+)', last)
        cgpa_match = re.search(r'cgpa\s*=\s*([\d.]+)', last)
        mincgpa_match = re.search(r'min cgpa:\s*([\d.]+)', last)
        has_backlogs = backlog_match and int(backlog_match.group(1)) > 0
        student_cgpa = float(cgpa_match.group(1)) if cgpa_match else 0
        min_cgpa = float(mincgpa_match.group(1)) if mincgpa_match else 6.0
        cgpa_ok = student_cgpa >= min_cgpa
        if has_backlogs or not cgpa_ok:
            reason = "Active backlogs make you ineligible" if has_backlogs else f"CGPA {student_cgpa} is below the minimum {min_cgpa} required"
            return f'{{"eligible":false,"score":10,"gaps":["{reason}"],"actionPlan":["Clear all backlogs first","Focus on CGPA improvement","Apply after meeting cutoffs"],"timeline":"Next semester","verdict":"Not eligible. {reason}.","pivotCompanies":["Wipro","Cognizant","Infosys"]}}'
        return '{"eligible":true,"score":78,"gaps":["Improve DSA speed","Practice mock interviews"],"actionPlan":["Complete 50 LeetCode Easy/Medium","Practice 2 mock OA tests per week","Revise DBMS and OS fundamentals","Apply to 5 companies this week"],"timeline":"8 weeks","verdict":"You meet the basic eligibility criteria.","pivotCompanies":["Wipro","Cognizant","Infosys"]}'

    if "ats" in last or "github" in last or "resume" in last:
        return '{"questions":[{"question":"Walk me through your most complex project.","followUp":"What would you change if you rebuilt it today?","difficulty":"Medium","topic":"Projects"}],"ats":{"score":72,"summary":"Solid project experience.","strengths":["Hands-on project work"],"weaknesses":["No system design projects"],"keywords":[{"name":"React","status":"found"},{"name":"Docker","status":"missing"}]}}'

    if "timecomplexity" in last or "complexity" in last or "code" in last:
        return '{"timeComplexity":"O(n)","spaceComplexity":"O(n)","explanation":"Optimal approach using hash map.","optimizations":"Already optimal.","score":88}'

    if "system design" in last or "scalability" in last or "components" in last:
        return '{"score":7,"strengths":["Good separation of concerns"],"issues":["No data replication"],"suggestions":["Add DB read replicas"],"scalability":"Medium-High","verdict":"Solid architecture for mid-scale."}'

    # Safe default — never return raw JSON for unknown context
    return "FEEDBACK: Good effort on that answer.\nNEXT: Can you walk me through your most challenging technical project?"


class AIRequest(BaseModel):
    messages: list
    system: Optional[str] = None
    max_tokens: int = 600


class GitHubRequest(BaseModel):
    username: str

@app.get("/")
async def root():
    return {"status": "ok", "service": "AgentPlace AI Engine"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.api_route("/ping", methods=["GET", "HEAD"])
async def ping():
    return {"pong": True}
@app.post("/v1/chat")
async def chat_with_ai(request: AIRequest):
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenRouter API Key missing")
    

    

    async with httpx.AsyncClient() as client:
        try:
            messages_for_api = []
            if request.system:
                messages_for_api.append({"role": "system", "content": request.system})
            for m in request.messages:
                messages_for_api.append({"role": m["role"], "content": m["content"]})

            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://agentplace.app",
                },
                json={
                    "model": "mistralai/mistral-7b-instruct:free",
                    "messages": messages_for_api,
                    "max_tokens": request.max_tokens,
                },
                timeout=45.0
            )
            

            if response.status_code == 429:
                # Rate limited — wait and retry once
                await asyncio.sleep(8)
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://agentplace.app",
                    },
                    json={
                        "model": "mistralai/mistral-7b-instruct:free",
                        "messages": messages_for_api,
                        "max_tokens": request.max_tokens,
                    },
                    timeout=45.0
                )
                if not response.ok:
                    raise HTTPException(status_code=503, detail="AI rate limited. Please wait 10 seconds and try again.")

            if response.status_code == 503:
                raise HTTPException(status_code=503, detail="AI service temporarily unavailable. Please try again in 10 seconds.")

            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)

            res_data = response.json()

            if "choices" in res_data and len(res_data["choices"]) > 0:
                text = res_data["choices"][0]["message"]["content"] or ""
                text = re.sub(r"^```(?:json)?\s*", "", text.strip())
                text = re.sub(r"\s*```$", "", text.strip())
                if not text:
                    demo_text = _get_demo_response(messages_for_api)
                    return {"content": [{"text": demo_text}], "_demo": True}
                return {"content": [{"text": text}]}
            else:
                raise HTTPException(status_code=500, detail="AI response empty or blocked")

        except HTTPException:
            raise
        except Exception as e:
            demo_text = _get_demo_response(messages_for_api)
            return {"content": [{"text": demo_text}], "_demo": True}


@app.post("/v1/github")
async def fetch_github_profile(request: GitHubRequest):
    username = request.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")

    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "AgentPlace-App"
    }
    gh_token = os.getenv("GITHUB_TOKEN")
    if gh_token:
        headers["Authorization"] = f"token {gh_token}"

    async with httpx.AsyncClient() as client:
        try:
            profile_resp = await client.get(
                f"https://api.github.com/users/{username}",
                headers=headers, timeout=15.0
            )
            if profile_resp.status_code == 404:
                raise HTTPException(status_code=404, detail="GitHub user not found.")
            if profile_resp.status_code == 403:
                raise HTTPException(status_code=403, detail="GitHub API rate limit hit.")
            if profile_resp.status_code != 200:
                raise HTTPException(status_code=profile_resp.status_code, detail="GitHub API error")

            profile = profile_resp.json()
            repos_resp = await client.get(
                f"https://api.github.com/users/{username}/repos?sort=stars&per_page=12&type=owner",
                headers=headers, timeout=15.0
            )
            repos = repos_resp.json() if repos_resp.status_code == 200 else []

            repo_summaries = []
            all_languages = {}
            total_stars = 0

            for repo in repos:
                if not isinstance(repo, dict) or repo.get("fork", False):
                    continue
                lang = repo.get("language") or "Unknown"
                stars = repo.get("stargazers_count", 0)
                repo_summaries.append({
                    "name": repo.get("name", ""),
                    "description": repo.get("description") or "No description",
                    "language": lang,
                    "stars": stars,
                    "forks": repo.get("forks_count", 0),
                    "topics": repo.get("topics", []),
                    "updated": repo.get("updated_at", "")[:10],
                })
                if lang != "Unknown":
                    all_languages[lang] = all_languages.get(lang, 0) + 1
                total_stars += stars

            sorted_langs = sorted(all_languages.items(), key=lambda x: x[1], reverse=True)

            return {
                "username": username,
                "name": profile.get("name") or username,
                "bio": profile.get("bio") or "No bio provided",
                "public_repos": profile.get("public_repos", 0),
                "followers": profile.get("followers", 0),
                "following": profile.get("following", 0),
                "company": profile.get("company") or "Not specified",
                "location": profile.get("location") or "Not specified",
                "total_stars": total_stars,
                "languages": [l for l, _ in sorted_langs],
                "top_repos": repo_summaries[:8],
            }

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch GitHub: {str(e)}")


@app.post("/v1/parse-pdf")
async def parse_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        import pypdf
    except ImportError:
        raise HTTPException(status_code=500, detail="pypdf not installed")

    try:
        content = await file.read()
        import io
        reader = pypdf.PdfReader(io.BytesIO(content))

        text_parts = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text_parts.append(t.strip())

        full_text = "\n".join(text_parts)
        full_text = re.sub(r"\n{3,}", "\n\n", full_text)
        full_text = re.sub(r" {2,}", " ", full_text)

        if not full_text.strip():
            raise HTTPException(status_code=422, detail="Could not extract text from PDF.")

        return {"text": full_text[:4000], "pages": len(reader.pages)}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF parsing failed: {str(e)}")
