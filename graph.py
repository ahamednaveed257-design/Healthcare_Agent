from __future__ import annotations

from pathlib import Path
from typing import Any

from .classifier import classify_with_plan
from .config import settings
from .governance import build_governance_card
from .memory import LocalJsonMemoryStore, extract_patient_profile, merge_patient_profiles
from .safety import apply_safety_guardrails
from .specialists import run_secondary_specialists, run_specialist
from .state import AgentState, WorkflowStep
from .synthesizer import synthesize_response


def _workflow_step(
    step: int,
    name: str,
    summary: str,
    status: str = "completed",
) -> WorkflowStep:
    return {
        "step": step,
        "name": name,
        "status": status,  # type: ignore[typeddict-item]
        "summary": summary,
    }


def _append_workflow_step(
    trace: list[WorkflowStep] | None,
    step: int,
    name: str,
    summary: str,
    status: str = "completed",
) -> list[WorkflowStep]:
    return [*(trace or []), _workflow_step(step, name, summary, status)]


def _completed_actions(
    actions: list[dict[str, Any]],
    completed_names: set[str],
) -> list[dict[str, Any]]:
    updated = []
    for action in actions:
        next_action = dict(action)
        if next_action.get("name") in completed_names and next_action.get("status") == "queued":
            next_action["status"] = "completed"
        updated.append(next_action)
    return updated


def _specialist_action_names(specialist_output: dict[str, Any]) -> set[str]:
    agent = specialist_output.get("agent")
    if agent == "RAG Agent":
        return {"retrieve_health_knowledge"}
    if agent == "Pharmacy Agent":
        return {"consult_pharmacy_agent"}
    if agent == "Scheduling Agent":
        return {"coordinate_scheduling_agent"}
    if agent == "Alert Agent":
        return {"activate_alert_workflow"}
    return set()


class HealthcareWorkflow:
    def __init__(
        self,
        memory_store: LocalJsonMemoryStore | None = None,
        data_dir: Path | None = None,
    ) -> None:
        self.memory_store = memory_store or LocalJsonMemoryStore()
        self.data_dir = data_dir or settings.data_dir

    def invoke(self, state: AgentState) -> AgentState:
        patient_id = state.get("patient_id", "demo-patient")
        user_input = state.get("user_input", "")
        workflow_trace = [
            _workflow_step(
                1,
                "patient_input",
                "Accepted free-form patient symptom, question, or request.",
            )
        ]

        memory = self.memory_store.load(patient_id)
        stored_profile = self.memory_store.load_profile(patient_id)
        workflow_trace = _append_workflow_step(
            workflow_trace,
            2,
            "load_memory",
            f"Loaded {len(memory)} previous conversation messages and stored patient profile.",
        )
        turn_profile = extract_patient_profile(memory, user_input)
        patient_profile = merge_patient_profiles(stored_profile, turn_profile)
        care_plan = classify_with_plan(user_input, memory, patient_profile)
        intent = care_plan.get("selected_intent", "rag")
        reasoning_trace = care_plan.get("reasoning_trace", [])
        reason = (
            " ".join(reasoning_trace)
            if reasoning_trace
            else "The message is best handled as a general health question."
        )
        workflow_trace = _append_workflow_step(
            workflow_trace,
            3,
            "intent_classifier",
            f"Selected {intent} route with urgency {care_plan.get('urgency_level', 'routine')}.",
        )

        state = {
            **state,
            "patient_id": patient_id,
            "user_input": user_input,
            "memory": memory,
            "patient_profile": patient_profile,
            "care_plan": care_plan,
            "intent": intent,
            "secondary_intents": care_plan.get("secondary_intents", []),
            "intent_reason": reason,
            "urgency_level": care_plan.get("urgency_level", "routine"),
            "route_scores": care_plan.get("route_scores", []),
            "clinical_slots": care_plan.get("clinical_slots", {}),
            "reasoning_trace": reasoning_trace,
            "suggested_followups": care_plan.get("suggested_followups", []),
            "missing_information": care_plan.get("missing_information", []),
            "agent_actions": care_plan.get("agent_actions", []),
            "quality_gates": care_plan.get("quality_gates", []),
            "needs_clarification": care_plan.get("needs_clarification", False),
            "model_efficiency": care_plan.get("model_efficiency", {}),
            "workflow_trace": workflow_trace,
        }
        specialist_output = run_specialist(state, data_dir=self.data_dir)
        state["specialist_output"] = specialist_output
        secondary_outputs = run_secondary_specialists(state, data_dir=self.data_dir)
        state["secondary_outputs"] = secondary_outputs
        state["care_plan"]["secondary_outputs"] = secondary_outputs
        workflow_trace = _append_workflow_step(
            workflow_trace,
            4,
            "specialist_agent",
            (
                f"Routed to {specialist_output.get('agent', 'Specialist Agent')} and previewed "
                f"{len(secondary_outputs)} secondary specialist route(s)."
                if secondary_outputs
                else f"Routed to {specialist_output.get('agent', 'Specialist Agent')}."
            ),
        )
        state["workflow_trace"] = workflow_trace
        completed_action_names = _specialist_action_names(specialist_output)
        if secondary_outputs:
            completed_action_names.add("preview_secondary_specialists")
        state["agent_actions"] = _completed_actions(
            state.get("agent_actions", []),
            completed_action_names,
        )
        state["care_plan"]["agent_actions"] = state["agent_actions"]
        state["appointment"] = specialist_output.get("appointment")
        if specialist_output.get("alert"):
            state["alerts"] = [specialist_output["alert"]]

        state["synthesized_response"] = synthesize_response(state)
        workflow_trace = _append_workflow_step(
            workflow_trace,
            5,
            "response_synthesizer",
            "Converted specialist output into simple, patient-friendly language.",
        )
        state["workflow_trace"] = workflow_trace
        safe_response, flags = apply_safety_guardrails(state)
        state["safe_response"] = safe_response
        state["safety_flags"] = flags
        state["governance_card"] = build_governance_card(state)
        state["handoff_packet"] = state["governance_card"].get("handoff_packet", {})
        workflow_trace = _append_workflow_step(
            workflow_trace,
            6,
            "safety_guardrails",
            "Applied emergency escalation, diagnosis blocking, disclaimers, and medication safety checks.",
        )
        workflow_trace = _append_workflow_step(
            workflow_trace,
            7,
            "patient_reply",
            "Prepared the final clean response for the patient chat UI.",
        )

        state["agent_actions"] = _completed_actions(
            state.get("agent_actions", []),
            {"update_patient_memory"},
        )
        state["care_plan"]["agent_actions"] = state["agent_actions"]
        workflow_trace = _append_workflow_step(
            workflow_trace,
            8,
            "update_memory",
            f"Saved the patient and assistant exchange; memory now keeps up to {min(40, len(memory) + 2)} messages.",
        )
        state["workflow_trace"] = workflow_trace
        state["memory"] = self.memory_store.append_exchange(
            patient_id=patient_id,
            user_input=user_input,
            assistant_reply=safe_response,
            patient_profile=patient_profile,
            metadata={
                "intent": intent,
                "intent_reason": reason,
                "care_plan": care_plan,
                "secondary_outputs": state.get("secondary_outputs", []),
                "safety_flags": flags,
                "workflow_trace": workflow_trace,
                "governance_card": state["governance_card"],
                "handoff_packet": state.get("handoff_packet", {}),
            },
        )
        return state


class HealthcareAgent:
    """Small convenience facade for apps that expect a simple agent object."""

    def __init__(
        self,
        patient_id: str = "demo-patient",
        memory_store: LocalJsonMemoryStore | None = None,
        data_dir: Path | None = None,
        prefer_langgraph: bool = False,
    ) -> None:
        self.patient_id = patient_id
        self.workflow = build_agent(
            memory_store=memory_store,
            data_dir=data_dir,
            prefer_langgraph=prefer_langgraph,
        )

    def handle(self, user_input: str, patient_id: str | None = None) -> AgentState:
        return self.workflow.invoke(
            {
                "patient_id": patient_id or self.patient_id,
                "user_input": user_input,
            }
        )


def build_langgraph(
    memory_store: LocalJsonMemoryStore | None = None,
    data_dir: Path | None = None,
) -> Any:
    """Build the same workflow with LangGraph when the package is installed."""
    try:
        from langgraph.graph import END, StateGraph
    except ImportError:
        return None

    store = memory_store or LocalJsonMemoryStore()
    data_root = data_dir or settings.data_dir
    builder = StateGraph(AgentState)

    def load_memory_node(state: AgentState) -> AgentState:
        patient_id = state.get("patient_id", "demo-patient")
        memory = store.load(patient_id)
        return {
            "memory": memory,
            "patient_profile": store.load_profile(patient_id),
            "patient_id": patient_id,
            "workflow_trace": [
                _workflow_step(
                    1,
                    "patient_input",
                    "Accepted free-form patient symptom, question, or request.",
                ),
                _workflow_step(
                    2,
                    "load_memory",
                    f"Loaded {len(memory)} previous conversation messages and stored patient profile.",
                ),
            ],
        }

    def classify_node(state: AgentState) -> AgentState:
        memory = state.get("memory", [])
        turn_profile = extract_patient_profile(memory, state.get("user_input", ""))
        patient_profile = merge_patient_profiles(state.get("patient_profile", {}), turn_profile)
        care_plan = classify_with_plan(state.get("user_input", ""), memory, patient_profile)
        intent = care_plan.get("selected_intent", "rag")
        reasoning_trace = care_plan.get("reasoning_trace", [])
        reason = (
            " ".join(reasoning_trace)
            if reasoning_trace
            else "The message is best handled as a general health question."
        )
        return {
            "patient_profile": patient_profile,
            "care_plan": care_plan,
            "intent": intent,
            "secondary_intents": care_plan.get("secondary_intents", []),
            "intent_reason": reason,
            "urgency_level": care_plan.get("urgency_level", "routine"),
            "route_scores": care_plan.get("route_scores", []),
            "clinical_slots": care_plan.get("clinical_slots", {}),
            "reasoning_trace": reasoning_trace,
            "suggested_followups": care_plan.get("suggested_followups", []),
            "missing_information": care_plan.get("missing_information", []),
            "agent_actions": care_plan.get("agent_actions", []),
            "quality_gates": care_plan.get("quality_gates", []),
            "needs_clarification": care_plan.get("needs_clarification", False),
            "model_efficiency": care_plan.get("model_efficiency", {}),
            "workflow_trace": _append_workflow_step(
                state.get("workflow_trace", []),
                3,
                "intent_classifier",
                f"Selected {intent} route with urgency {care_plan.get('urgency_level', 'routine')}.",
            ),
        }

    def specialist_node(state: AgentState) -> AgentState:
        output = run_specialist(state, data_dir=data_root)
        working_state: AgentState = {**state, "specialist_output": output}
        secondary_outputs = run_secondary_specialists(working_state, data_dir=data_root)
        completed_action_names = _specialist_action_names(output)
        if secondary_outputs:
            completed_action_names.add("preview_secondary_specialists")
        actions = _completed_actions(
            state.get("agent_actions", []),
            completed_action_names,
        )
        care_plan = {
            **state.get("care_plan", {}),
            "agent_actions": actions,
            "secondary_outputs": secondary_outputs,
        }
        next_state: AgentState = {
            "specialist_output": output,
            "secondary_outputs": secondary_outputs,
            "appointment": output.get("appointment"),
            "agent_actions": actions,
            "care_plan": care_plan,
            "workflow_trace": _append_workflow_step(
                state.get("workflow_trace", []),
                4,
                "specialist_agent",
                (
                    f"Routed to {output.get('agent', 'Specialist Agent')} and previewed "
                    f"{len(secondary_outputs)} secondary specialist route(s)."
                    if secondary_outputs
                    else f"Routed to {output.get('agent', 'Specialist Agent')}."
                ),
            ),
        }
        if output.get("alert"):
            next_state["alerts"] = [output["alert"]]
        return next_state

    def synthesize_node(state: AgentState) -> AgentState:
        return {
            "synthesized_response": synthesize_response(state),
            "workflow_trace": _append_workflow_step(
                state.get("workflow_trace", []),
                5,
                "response_synthesizer",
                "Converted specialist output into simple, patient-friendly language.",
            ),
        }

    def safety_node(state: AgentState) -> AgentState:
        response, flags = apply_safety_guardrails(state)
        next_state: AgentState = {
            **state,
            "safe_response": response,
            "safety_flags": flags,
        }
        governance_card = build_governance_card(next_state)
        return {
            "safe_response": response,
            "safety_flags": flags,
            "governance_card": governance_card,
            "handoff_packet": governance_card.get("handoff_packet", {}),
            "workflow_trace": _append_workflow_step(
                state.get("workflow_trace", []),
                6,
                "safety_guardrails",
                "Applied emergency escalation, diagnosis blocking, disclaimers, and medication safety checks.",
            ),
        }

    def patient_reply_node(state: AgentState) -> AgentState:
        return {
            "workflow_trace": _append_workflow_step(
                state.get("workflow_trace", []),
                7,
                "patient_reply",
                "Prepared the final clean response for the patient chat UI.",
            )
        }

    def update_memory_node(state: AgentState) -> AgentState:
        actions = _completed_actions(state.get("agent_actions", []), {"update_patient_memory"})
        care_plan = {**state.get("care_plan", {}), "agent_actions": actions}
        current_memory = state.get("memory", [])
        workflow_trace = _append_workflow_step(
            state.get("workflow_trace", []),
            8,
            "update_memory",
            f"Saved the patient and assistant exchange; memory now keeps up to {min(40, len(current_memory) + 2)} messages.",
        )
        memory = store.append_exchange(
            patient_id=state.get("patient_id", "demo-patient"),
            user_input=state.get("user_input", ""),
            assistant_reply=state.get("safe_response", ""),
            patient_profile=state.get("patient_profile", {}),
            metadata={
                "intent": state.get("intent"),
                "intent_reason": state.get("intent_reason"),
                "care_plan": care_plan,
                "secondary_outputs": state.get("secondary_outputs", []),
                "safety_flags": state.get("safety_flags", []),
                "workflow_trace": workflow_trace,
                "governance_card": state.get("governance_card", {}),
                "handoff_packet": state.get("handoff_packet", {}),
            },
        )
        return {
            "memory": memory,
            "agent_actions": actions,
            "care_plan": care_plan,
            "workflow_trace": workflow_trace,
        }

    builder.add_node("load_memory", load_memory_node)
    builder.add_node("classify_intent", classify_node)
    builder.add_node("specialist_agent", specialist_node)
    builder.add_node("response_synthesizer", synthesize_node)
    builder.add_node("safety_guardrails", safety_node)
    builder.add_node("patient_reply", patient_reply_node)
    builder.add_node("update_memory", update_memory_node)

    builder.set_entry_point("load_memory")
    builder.add_edge("load_memory", "classify_intent")
    builder.add_edge("classify_intent", "specialist_agent")
    builder.add_edge("specialist_agent", "response_synthesizer")
    builder.add_edge("response_synthesizer", "safety_guardrails")
    builder.add_edge("safety_guardrails", "patient_reply")
    builder.add_edge("patient_reply", "update_memory")
    builder.add_edge("update_memory", END)
    return builder.compile()


def build_agent(
    memory_store: LocalJsonMemoryStore | None = None,
    data_dir: Path | None = None,
    prefer_langgraph: bool = False,
) -> Any:
    if prefer_langgraph:
        graph = build_langgraph(memory_store=memory_store, data_dir=data_dir)
        if graph is not None:
            return graph
    return HealthcareWorkflow(memory_store=memory_store, data_dir=data_dir)


def run_healthcare_turn(
    user_input: str,
    patient_id: str = "demo-patient",
    prefer_langgraph: bool = False,
) -> AgentState:
    agent = build_agent(prefer_langgraph=prefer_langgraph)
    return agent.invoke({"patient_id": patient_id, "user_input": user_input})
