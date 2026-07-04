from __future__ import annotations

from typing import Any
from urllib.parse import urlparse

from .state import AgentState


TRUSTED_SOURCE_DOMAINS = (
    "cdc.gov",
    "fda.gov",
    "healthit.gov",
    "medlineplus.gov",
    "nih.gov",
    "nlm.nih.gov",
    "who.int",
)


def _domain_for(source: dict[str, Any]) -> str:
    url = str(source.get("url") or "")
    if not url:
        return ""
    return urlparse(url).netloc.lower().removeprefix("www.")


def _is_trusted_source(source: dict[str, Any]) -> bool:
    domain = _domain_for(source)
    return any(domain == trusted or domain.endswith(f".{trusted}") for trusted in TRUSTED_SOURCE_DOMAINS)


def _source_items(state: AgentState) -> list[dict[str, Any]]:
    output = state.get("specialist_output", {})
    sources: list[dict[str, Any]] = []

    for source in output.get("sources", []) or []:
        if isinstance(source, dict):
            sources.append(source)
        elif source:
            sources.append({"name": str(source), "url": ""})

    for medication in output.get("medications", []) or []:
        source = medication.get("source") if isinstance(medication, dict) else None
        if isinstance(source, dict):
            sources.append(source)

    seen = set()
    unique_sources = []
    for source in sources:
        key = (source.get("name", ""), source.get("url", ""))
        if key in seen:
            continue
        seen.add(key)
        unique_sources.append(source)
    return unique_sources


def _source_quality(sources: list[dict[str, Any]]) -> str:
    if not sources:
        return "none"
    if any(_is_trusted_source(source) for source in sources):
        return "trusted"
    return "local_or_unverified"


def _handoff_for(state: AgentState, source_quality: str) -> dict[str, str]:
    intent = state.get("intent", "rag")
    urgency = state.get("urgency_level", "routine")
    missing = state.get("missing_information", [])
    confidence = float(state.get("care_plan", {}).get("confidence", 0.0) or 0.0)
    blocked_gates = [
        gate
        for gate in state.get("quality_gates", state.get("care_plan", {}).get("quality_gates", []))
        if gate.get("status") == "blocked"
    ]

    if intent == "alert" or urgency == "emergency":
        return {
            "level": "emergency",
            "owner": "Emergency services / caregiver",
            "reason": "Emergency warning signs override routine agent routing.",
        }
    if urgency == "urgent":
        return {
            "level": "prompt_clinician_contact",
            "owner": "Care team",
            "reason": "Potentially concerning symptoms need timely human review.",
        }
    if intent == "pharmacy" and missing:
        return {
            "level": "pharmacist_or_prescriber",
            "owner": "Pharmacist or prescriber",
            "reason": "Medication advice needs exact label details and patient-specific risk factors.",
        }
    if intent == "pharmacy" and state.get("clinical_slots", {}).get("risk_factors"):
        return {
            "level": "pharmacist_or_prescriber",
            "owner": "Pharmacist or prescriber",
            "reason": "Medication risk factors were mentioned, so patient-specific safety should be reviewed by a professional.",
        }
    if blocked_gates:
        return {
            "level": "clinician_review",
            "owner": "Care team",
            "reason": "The agent quality gate blocked full confidence and requested clarification.",
        }
    if confidence < 0.45 or source_quality == "none":
        return {
            "level": "clinician_review",
            "owner": "Care team",
            "reason": "The agent has limited source support or low route confidence.",
        }
    return {
        "level": "routine",
        "owner": "Patient / care team as needed",
        "reason": "The response is educational and source-supported, with normal safety disclaimers.",
    }


def _clinical_fact_items(state: AgentState) -> list[str]:
    slots = state.get("clinical_slots", {})
    facts: list[str] = []
    for label, key in [
        ("Symptoms", "symptoms"),
        ("Medications", "medications"),
        ("Risk factors", "risk_factors"),
        ("Red flags", "red_flags"),
        ("Negated red flags", "negated_red_flags"),
    ]:
        values = slots.get(key, [])
        if isinstance(values, list) and values:
            facts.append(f"{label}: " + ", ".join(str(value) for value in values[:5]))

    measurements = slots.get("measurements", {})
    if isinstance(measurements, dict) and measurements:
        readable_measurements = []
        blood_pressure = measurements.get("blood_pressure")
        if isinstance(blood_pressure, dict):
            readable_measurements.append(
                f"blood pressure {blood_pressure.get('systolic')}/{blood_pressure.get('diastolic')}"
            )
        for key, label in [
            ("temperature_f", "temperature"),
            ("oxygen_saturation", "oxygen saturation"),
            ("blood_glucose", "blood glucose"),
            ("heart_rate", "heart rate"),
        ]:
            if key in measurements:
                readable_measurements.append(f"{label} {measurements[key]}")
        if readable_measurements:
            facts.append("Measurements: " + ", ".join(readable_measurements[:5]))

    for label, key in [("Duration", "duration"), ("Severity", "severity"), ("Appointment time", "appointment_time")]:
        value = slots.get(key)
        if value:
            facts.append(f"{label}: {value}")
    return facts[:8]


def _route_summary(state: AgentState) -> list[str]:
    routes = state.get("route_scores", [])
    summaries = []
    for route in routes[:4]:
        intent = str(route.get("intent", "route"))
        score = float(route.get("score", 0.0) or 0.0)
        evidence = route.get("evidence", [])
        evidence_text = "; ".join(str(item) for item in evidence[:2]) if isinstance(evidence, list) else ""
        summary = f"{intent}: {score:.2f}"
        if evidence_text:
            summary += f" ({evidence_text})"
        summaries.append(summary)
    return summaries


def _next_best_action_for(
    state: AgentState,
    handoff: dict[str, str],
    secondary_outputs: list[dict[str, Any]],
) -> str:
    intent = state.get("intent", "rag")
    urgency = state.get("urgency_level", "routine")
    missing = state.get("missing_information", [])
    output = state.get("specialist_output", {})

    if intent == "alert" or urgency == "emergency":
        return "Call emergency services now and share the extracted facts with the responder or caregiver."
    if urgency == "urgent":
        return "Contact the care team promptly and use the handoff packet to summarize the concern."
    if missing:
        return "Ask the patient for: " + "; ".join(str(item) for item in missing[:3]) + "."
    if intent == "scheduling" and output.get("appointment"):
        return "Confirm the appointment details with the care team and watch for any urgent symptom changes."
    if intent == "pharmacy":
        return "Use only label or prescriber directions and escalate medication-specific concerns to a pharmacist or prescriber."
    if secondary_outputs:
        return "Finish the primary response, then continue with the previewed secondary care need."
    if handoff.get("level") != "routine":
        return handoff.get("reason", "Use the care-team handoff guidance.")
    return "Continue self-care education, monitor for red flags, and contact the care team if symptoms worsen."


def _build_handoff_packet(
    state: AgentState,
    handoff: dict[str, str],
    secondary_outputs: list[dict[str, Any]],
) -> dict[str, Any]:
    output = state.get("specialist_output", {})
    reasoning = [str(item) for item in state.get("reasoning_trace", []) if item]
    return {
        "title": f"{str(state.get('intent', 'rag')).title()} handoff packet",
        "urgency_level": state.get("urgency_level", "routine"),
        "handoff_level": handoff.get("level", "routine"),
        "handoff_owner": handoff.get("owner", "Care team"),
        "primary_agent": output.get("agent", "Specialist Agent"),
        "route_summary": _route_summary(state),
        "known_facts": _clinical_fact_items(state),
        "missing_information": state.get("missing_information", [])[:5],
        "secondary_work": [
            {
                "intent": item.get("intent"),
                "status": item.get("status"),
                "summary": item.get("summary"),
            }
            for item in secondary_outputs[:2]
        ],
        "next_best_action": _next_best_action_for(state, handoff, secondary_outputs),
        "safety_flags": state.get("safety_flags", []),
        "reasoning_snapshot": reasoning[:4],
    }


def build_governance_card(state: AgentState) -> dict[str, Any]:
    sources = _source_items(state)
    source_quality = _source_quality(sources)
    quality_gates = state.get("quality_gates", state.get("care_plan", {}).get("quality_gates", []))
    secondary_intents = state.get("secondary_intents", state.get("care_plan", {}).get("secondary_intents", []))
    secondary_outputs = state.get(
        "secondary_outputs",
        state.get("care_plan", {}).get("secondary_outputs", []),
    )
    limitations = [
        "Educational support only; not a diagnosis or substitute for a clinician.",
        "Patient-reported text may be incomplete, ambiguous, or inaccurate.",
        "Local demo data can become stale and should be reviewed before production use.",
        "The model should inform or augment decisions, not replace clinical management.",
    ]
    if source_quality == "none":
        limitations.append("No external source was matched for this turn.")
    if state.get("intent") == "pharmacy":
        limitations.append("No personalized dose changes, starts, stops, or interactions are provided.")
    handoff = _handoff_for(state, source_quality)
    handoff_packet = _build_handoff_packet(state, handoff, secondary_outputs)

    return {
        "intended_use": "General health education, routing, and care-team handoff support.",
        "decision_role": "Informs or augments patient and care-team decisions; does not replace clinical judgment.",
        "source_quality": source_quality,
        "sources": sources,
        "handoff": handoff,
        "handoff_packet": handoff_packet,
        "quality_gates": quality_gates,
        "secondary_intents": secondary_intents,
        "secondary_outputs": secondary_outputs,
        "model_efficiency": state.get("model_efficiency", state.get("care_plan", {}).get("model_efficiency", {})),
        "limitations": limitations,
        "risk_controls": [
            "Emergency signal override",
            "Measurement-aware triage",
            "Negation-aware emergency screening",
            "Bounded secondary specialist preview",
            "Secondary route tracking",
            "Structured handoff packet",
            "Agent quality gate review",
            "Medication safety note",
            "Diagnosis language blocking",
            "Source-quality check",
            "Memory trace and workflow audit",
        ],
    }
