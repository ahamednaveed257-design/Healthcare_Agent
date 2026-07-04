from __future__ import annotations

import re

from .classifier import EMERGENCY_PATTERNS, _pattern_hits
from .state import AgentState


MEDICAL_DISCLAIMER = (
    "This is general information, not a diagnosis. Please contact your doctor or care team "
    "for personal medical advice."
)


def _contains_any(patterns: list[str], text: str) -> bool:
    return any(re.search(pattern, text, flags=re.IGNORECASE) for pattern in patterns)


def _strip_sentences_with(patterns: list[str], text: str) -> str:
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    kept = [
        sentence
        for sentence in sentences
        if sentence and not _contains_any(patterns, sentence)
    ]
    return " ".join(kept).strip()


def apply_safety_guardrails(state: AgentState) -> tuple[str, list[str]]:
    response = state.get("synthesized_response", "")
    user_input = state.get("user_input", "")
    urgency = state.get("urgency_level", "routine")
    flags: list[str] = []

    emergency_hits = _pattern_hits(EMERGENCY_PATTERNS, user_input, skip_negated=True)
    if state.get("intent") == "alert" or urgency == "emergency" or emergency_hits:
        flags.append("emergency_escalation")
        response = (
            "This may be an emergency. Call local emergency services now, or ask someone nearby "
            "to call for you. If you are in the U.S., call 911. I have started the caregiver alert workflow."
        )
        return response, flags

    diagnosis_patterns = [
        r"\byou have\b",
        r"\byou are definitely\b",
        r"\bthis is caused by\b",
        r"\bthe diagnosis is\b",
    ]
    if _contains_any(diagnosis_patterns, response):
        flags.append("diagnosis_language_softened")
        response = re.sub(r"\byou have\b", "you may be experiencing", response, flags=re.IGNORECASE)
        response = re.sub(
            r"\bthe diagnosis is\b",
            "a clinician would need to diagnose whether this is",
            response,
            flags=re.IGNORECASE,
        )

    unsafe_instruction_patterns = [
        r"\b(stop|start|restart|skip)\s+(?:taking\s+)?(?:your\s+)?(?:medicine|medication|prescription|dose)\b",
        r"\b(double|triple|increase|decrease|change)\s+(?:your\s+)?(?:dose|dosage)\b",
        r"\btake\s+(?:an?\s+)?(?:extra|additional|double)\s+(?:pill|tablet|capsule|dose)s?\b",
        r"\btake\s+\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|tablets?|capsules?|puffs?|units?)\b",
        r"\bignore\s+(?:the\s+)?(?:label|directions|instructions)\b",
        r"\bignore\s+(?:your\s+)?(?:doctor|clinician|prescriber|pharmacist)\b",
        r"\bmix\s+(?:it|this|medicine|medication|drug)\s+with\s+alcohol\b",
    ]
    if _contains_any(unsafe_instruction_patterns, response):
        flags.append("unsafe_medication_instruction_removed")
        stripped = _strip_sentences_with(unsafe_instruction_patterns, response)
        response = stripped or "I can share general information, but I cannot give personalized medication instructions."
        response = (
            f"{response}\n\nFor medication changes, dose questions, or stopping/starting a prescription, "
            "please check with your prescriber or pharmacist."
        )

    if urgency == "urgent" and state.get("intent") != "alert":
        flags.append("urgent_symptom_watch_added")
        response = (
            f"{response}\n\nBecause you mentioned a potentially concerning symptom, contact your care team "
            "promptly. Seek urgent care now if symptoms are severe, worsening, or feel unsafe."
        )
    elif urgency == "watch" and state.get("intent") == "rag":
        flags.append("watchful_waiting_note_added")
        response = (
            f"{response}\n\nSince this sounds ongoing or recurring, keep track of timing, severity, "
            "and any new symptoms to share with your care team."
        )

    if state.get("intent") in {"rag", "pharmacy"} and MEDICAL_DISCLAIMER not in response:
        flags.append("medical_disclaimer_added")
        response = f"{response}\n\n{MEDICAL_DISCLAIMER}"

    if state.get("intent") == "pharmacy":
        flags.append("medication_safety_note_added")
        response = (
            f"{response}\n\nUse medication only as directed on the label or by your prescriber. "
            "If you notice severe symptoms, an allergic reaction, or took more than directed, seek urgent help."
        )

    return response, flags
