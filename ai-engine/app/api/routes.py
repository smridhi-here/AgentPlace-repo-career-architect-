from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter()


class CareerInput(BaseModel):
    query: str
    context: dict | None = None


@router.post("/invoke")
async def invoke_career_agent(request: Request, body: CareerInput):
    """Invoke the career agent graph with user input."""
    graph = request.app.state.graph
    if not graph:
        return {"error": "Graph not initialized"}
    initial = {"messages": [], "context": body.context or {}}
    result = graph.invoke(initial)
    return {"state": result, "query": body.query}
