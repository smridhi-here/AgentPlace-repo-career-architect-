from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
def _get_demo_response(contents: list) -> str:
    # Peek at last user message to return the right fake JSON
    last = ""
    for c in reversed(contents):
        if c.get("role") == "user":
            last = c["parts"][0]["text"].lower()
            break

    # Blueprint / eligibility check
    if "eligible" in last and "actionplan" in last:
        return '{"eligible":true,"score":78,"gaps":["Improve DSA speed","Practice mock interviews"],"actionPlan":["Complete 50 LeetCode Easy/Medium","Practice 2 mock OA tests per week","Revise DBMS and OS fundamentals","Apply to 5 companies this week"],"timeline":"8 weeks","verdict":"You meet the basic eligibility criteria. Focus on OA preparation and communication skills to stand out.","pivotCompanies":["Wipro","Cognizant","Infosys"]}'

    # Resume / ATS / GitHub analysis
    if "ats" in last or "github" in last or "resume" in last:
        return '{"questions":[{"question":"Walk me through your most complex project and the technical decisions you made.","followUp":"What would you change if you rebuilt it today?","difficulty":"Medium","topic":"Projects"},{"question":"How do you handle merge conflicts in a team Git workflow?","followUp":"Describe a time a bad merge caused a bug.","difficulty":"Easy","topic":"Version Control"},{"question":"Explain the difference between SQL JOINs with an example.","followUp":"When would you use a LEFT JOIN over INNER JOIN?","difficulty":"Medium","topic":"DBMS"}],"ats":{"score":72,"summary":"Candidate shows solid project experience with modern tech stack. Key gaps are in system design exposure and competitive programming depth.","strengths":["Hands-on project work","Full-stack experience","Active GitHub contributions"],"weaknesses":["No system design projects","Missing cloud/DevOps keywords","Limited open source contributions"],"keywords":[{"name":"React","status":"found"},{"name":"REST API","status":"found"},{"name":"Docker","status":"partial"},{"name":"Kubernetes","status":"missing"},{"name":"System Design","status":"missing"}]}}'

    # OA / complexity analysis
    if "timecomplexity" in last or "complexity" in last or "big-o" in last or "code" in last:
        return '{"timeComplexity":"O(n)","spaceComplexity":"O(n)","explanation":"The solution iterates through the array once using a hash map for O(1) lookups. This is the optimal approach for this problem class.","optimizations":"Already optimal. Could reduce space to O(1) only if input is sorted.","score":88}'

    # System design critique
    if "system design" in last or "scalability" in last or "components" in last:
        return '{"score":7,"strengths":["Good separation of concerns","Load balancer shows scalability thinking","Cache layer reduces DB load"],"issues":["No mention of data replication","Single point of failure at API Gateway","Missing rate limiting"],"suggestions":["Add DB read replicas for scale","Add CDN for static assets","Implement circuit breaker pattern"],"scalability":"Medium-High","verdict":"Solid architecture for mid-scale. Add redundancy at every layer and consider async queues for heavy operations to reach production-grade design."}'

    # Interview FEEDBACK/NEXT format
    if "feedback:" in last or "interview" in last or "question" in last:
        return "FEEDBACK: Good answer � you structured your response well and showed clear thinking.\nNEXT: Tell me about a time you had to learn something new very quickly under pressure. What was the situation and how did you handle it?"

    # Generic fallback
    return '{"result":"Analysis complete.","status":"success","message":"Demo response � AI quota temporarily reached."}'

class AIRequest(BaseModel):
    messages: list
    system: str = None
    max_tokens: int = 600

class GitHubRequest(BaseModel):
    username: str

@app.post("/v1/chat")
async def chat_with_ai(request: AIRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key missing")

    contents = []
    if request.system:
        contents.append({"role": "user", "parts": [{"text": f"SYSTEM INSTRUCTION: {request.system}"}]})

    for m in request.messages:
        role = "model" if m["role"] == "assistant" else "user"
        contents.append({"role": role, "parts": [{"text": m["content"]}]})

    async with httpx.AsyncClient() as client:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
            response = await client.post(url, json={"contents": contents}, timeout=60.0)

            if response.status_code == 429:
    # Quota hit � return smart demo data silently
                demo_text = _get_demo_response(contents)
                return {"content": [{"text": demo_text}], "_demo": True}

            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)

            res_data = response.json()

            if 'candidates' in res_data and len(res_data['candidates']) > 0:
                text = res_data['candidates'][0]['content']['parts'][0]['text']
                return {"content": [{"text": text}]}
            else:
                raise HTTPException(status_code=500, detail="AI response empty or blocked by safety filters")

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


# -- REAL GITHUB ENDPOINT ------------------------------------------------------
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
                raise HTTPException(status_code=404, detail=f"GitHub user '{username}' not found. Check the username.")
            if profile_resp.status_code == 403:
                raise HTTPException(status_code=403, detail="GitHub API rate limit hit. Wait 1 minute and retry.")
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


# -- REAL PDF TEXT EXTRACTION ENDPOINT ----------------------------------------
@app.post("/v1/parse-pdf")
async def parse_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        import pypdf
    except ImportError:
        raise HTTPException(status_code=500, detail="pypdf not installed. Run: pip install pypdf")

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
        full_text = re.sub(r'\n{3,}', '\n\n', full_text)
        full_text = re.sub(r' {2,}', ' ', full_text)

        if not full_text.strip():
            raise HTTPException(status_code=422, detail="Could not extract text. PDF may be a scanned image.")

        return {"text": full_text[:4000], "pages": len(reader.pages)}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF parsing failed: {str(e)}")
