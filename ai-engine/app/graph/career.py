from typing import Annotated, TypedDict

from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages


class CareerState(TypedDict):
    messages: Annotated[list, add_messages]
    context: dict


def analyze_node(state: CareerState) -> CareerState:
    """Placeholder node: analyze user input for career context."""
    return {**state, "context": {**(state.get("context") or {}), "analyzed": True}}


def recommend_node(state: CareerState) -> CareerState:
    """Placeholder node: generate career recommendations."""
    return {**state, "context": {**(state.get("context") or {}), "recommendations": []}}


def create_career_graph():
    """Build the LangGraph workflow for career orchestration."""
    workflow = StateGraph(CareerState)

    workflow.add_node("analyze", analyze_node)
    workflow.add_node("recommend", recommend_node)

    workflow.set_entry_point("analyze")
    workflow.add_edge("analyze", "recommend")
    workflow.add_edge("recommend", END)

    return workflow.compile()
