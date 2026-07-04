from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from .config import settings
from .state import AgentState


def _format_datetime(value: str | None) -> str:
    if not value:
        return "the requested time"
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return value
    return parsed.strftime("%A, %B %d, %Y at %I:%M %p").replace(" 0", " ")


def _local_synthesize_response(state: AgentState) -> str:
    intent = state.get("intent", "rag")
    output = state.get("specialist_output", {})

    if intent == "alert":
        return (
            "I am concerned this could be urgent. Please call local emergency services now "
            "or have someone nearby call for you. I have also started the caregiver alert workflow."
        )

    if intent == "pharmacy":
        medications = output.get("medications", [])
        if not medications:
            return output.get("answer", "Please share the medication name so I can look it up.")

        sections = []
        for medication in medications:
            side_effects = medication.get("side_effects", [])
            warnings = medication.get("warnings", [])
            risk_notes = medication.get("risk_notes", [])
            section = [
                f"Here is general information about {medication.get('name', 'this medicine')}:",
                medication.get("common_use", ""),
                medication.get("general_guidance", ""),
            ]
            if side_effects:
                section.append("Common side effects can include " + ", ".join(side_effects) + ".")
            if risk_notes:
                section.append("Extra caution based on what you shared: " + " ".join(risk_notes[:3]))
            if warnings:
                section.append("Important cautions: " + " ".join(warnings))
            source = medication.get("source") or {}
            if source.get("name"):
                section.append("Source: " + source["name"] + ".")
            sections.append(" ".join(part for part in section if part))
        return "\n\n".join(sections)

    if intent == "scheduling":
        appointment: dict[str, Any] | None = output.get("appointment")
        if not appointment:
            missing = output.get("missing_information", [])
            if missing:
                return "Before I create that appointment request, I still need: " + "; ".join(missing[:3]) + "."
            return output.get("answer", "I could not find an appointment for you yet.")

        when = _format_datetime(appointment.get("when"))
        status = appointment.get("status", "scheduled")
        clinician = appointment.get("clinician", "your care team")
        if status == "requested":
            return f"I created an appointment request with {clinician} for {when}. Your care team should confirm it."
        return f"Your next appointment is with {clinician} on {when}."

    answer = output.get("answer")
    if answer:
        if state.get("needs_clarification") or output.get("needs_clarification"):
            missing = state.get("missing_information", []) or output.get("missing_information", [])
            if missing:
                return (
                    "I can help, but I need a little more detail to route this safely. "
                    "Please share: " + "; ".join(missing[:3]) + "."
                    f"\n\nClosest local match: {answer}"
                )
        sections = [str(answer)]
        self_care = [item for item in output.get("self_care", []) if item]
        monitor = [item for item in output.get("monitor", []) if item]
        red_flags = [item for item in output.get("red_flags", []) if item]
        if self_care:
            sections.append("Helpful next steps: " + "; ".join(self_care[:3]) + ".")
        if monitor:
            sections.append("Monitor: " + "; ".join(monitor[:3]) + ".")
        if red_flags:
            sections.append("Get urgent help for: " + "; ".join(red_flags[:3]) + ".")
        return "\n\n".join(sections)
    return "I can share general health information, but I may need a little more detail to help."


def _llm_synthesize_response(state: AgentState) -> str | None:
    if not settings.openai_api_key:
        return None

    try:
        from langchain_openai import ChatOpenAI
    except ImportError:
        return None

    prompt = (
        "Rewrite the specialist output for a patient. Use simple, warm language. "
        "Do not diagnose. Do not invent facts. Keep emergency advice direct.\n\n"
        f"Intent: {state.get('intent')}\n"
        f"Patient message: {state.get('user_input')}\n"
        f"Care plan: {json.dumps(state.get('care_plan', {}), ensure_ascii=True)}\n"
        f"Specialist output: {json.dumps(state.get('specialist_output', {}), ensure_ascii=True)}"
    )
    llm = ChatOpenAI(model=settings.openai_model, temperature=0.2)
    try:
        result = llm.invoke(prompt)
    except Exception:
        return None
    return str(result.content)


def _append_followup_prompts(response: str, state: AgentState) -> str:
    if state.get("intent") == "alert":
        return response
    if state.get("needs_clarification"):
        return response
    if state.get("specialist_output", {}).get("needs_clarification"):
        return response

    missing = [item.strip() for item in state.get("missing_information", []) if item.strip()]
    followups = [item.strip() for item in state.get("suggested_followups", []) if item.strip()]
    prompts = missing[:3] or followups[:3]
    if not prompts:
        return response

    label = "Still needed" if missing else "Helpful details to share next"
    prompt = label + ": " + "; ".join(prompts)
    if prompt in response:
        return response
    return f"{response}\n\n{prompt}"


def _append_secondary_route_note(response: str, state: AgentState) -> str:
    if state.get("intent") == "alert" or state.get("urgency_level") == "emergency":
        return response

    secondary_outputs = [
        output
        for output in state.get("secondary_outputs", [])
        if isinstance(output, dict) and output.get("intent") != state.get("intent")
    ]
    if secondary_outputs:
        labels = {
            "rag": "health information",
            "pharmacy": "medication question",
            "scheduling": "appointment need",
            "alert": "urgent safety concern",
        }
        notes = []
        for output in secondary_outputs[:2]:
            intent = str(output.get("intent") or "")
            summary = str(output.get("summary") or "Preview completed.").strip()
            notes.append(f"{labels.get(intent, intent or 'secondary need')}: {summary}")
        note = "I also previewed the other care need: " + " ".join(notes)
        if note in response:
            return response
        return f"{response}\n\n{note}"

    secondary = [item for item in state.get("secondary_intents", []) if item != state.get("intent")]
    if not secondary:
        return response

    labels = {
        "rag": "general health information",
        "pharmacy": "a medication question",
        "scheduling": "an appointment need",
        "alert": "an urgent safety concern",
    }
    readable = ", ".join(labels.get(item, item) for item in secondary[:2])
    note = f"I also noticed this may involve {readable}; we can handle that after this step."
    if note in response:
        return response
    return f"{response}\n\n{note}"


def synthesize_response(state: AgentState) -> str:
    response = _llm_synthesize_response(state) or _local_synthesize_response(state)
    response = _append_secondary_route_note(response, state)
    return _append_followup_prompts(response, state)
