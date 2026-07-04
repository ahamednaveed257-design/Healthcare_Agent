from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .config import settings
from .state import Message, PatientProfile


def _safe_patient_id(patient_id: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_.-]+", "-", patient_id.strip())
    return cleaned or "demo-patient"


class LocalJsonMemoryStore:
    """Local memory store that mirrors the conversation state carried by LangGraph."""

    def __init__(self, memory_dir: Path | None = None) -> None:
        self.memory_dir = memory_dir or settings.memory_dir
        self.memory_dir.mkdir(parents=True, exist_ok=True)

    def _path_for(self, patient_id: str) -> Path:
        return self.memory_dir / f"{_safe_patient_id(patient_id)}.json"

    def load_payload(self, patient_id: str) -> dict[str, Any]:
        path = self._path_for(patient_id)
        if not path.exists():
            return {}
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return {}

    def load(self, patient_id: str) -> list[Message]:
        payload = self.load_payload(patient_id)

        messages = payload.get("messages", [])
        return [message for message in messages if isinstance(message, dict)]

    def load_profile(self, patient_id: str) -> PatientProfile:
        payload = self.load_payload(patient_id)
        profile = payload.get("patient_profile", {})
        return profile if isinstance(profile, dict) else {}

    def append_exchange(
        self,
        patient_id: str,
        user_input: str,
        assistant_reply: str,
        metadata: dict[str, Any] | None = None,
        patient_profile: PatientProfile | None = None,
    ) -> list[Message]:
        payload = self.load_payload(patient_id)
        messages = [
            message for message in payload.get("messages", []) if isinstance(message, dict)
        ]
        existing_profile = payload.get("patient_profile", {})
        timestamp = datetime.now(timezone.utc).isoformat()
        messages.extend(
            [
                {"role": "patient", "content": user_input},
                {"role": "assistant", "content": assistant_reply},
            ]
        )
        merged_profile = merge_patient_profiles(
            existing_profile if isinstance(existing_profile, dict) else {},
            patient_profile or extract_patient_profile(messages),
        )
        payload = {
            "patient_id": patient_id,
            "updated_at": timestamp,
            "metadata": metadata or {},
            "patient_profile": merged_profile,
            "messages": messages[-40:],
        }
        self._path_for(patient_id).write_text(
            json.dumps(payload, indent=2),
            encoding="utf-8",
        )
        return payload["messages"]


def _contains(text: str, phrase: str) -> bool:
    return bool(re.search(rf"\b{re.escape(phrase)}\b", text, flags=re.IGNORECASE))


def _collect_known_terms(text: str, terms: list[str]) -> list[str]:
    return [term for term in terms if _contains(text, term)]


def _dedupe(values: list[str]) -> list[str]:
    seen = set()
    result = []
    for value in values:
        normalized = value.strip().lower()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        result.append(normalized)
    return result


KNOWN_SYMPTOMS = [
    "headache",
    "fever",
    "cough",
    "sore throat",
    "chest pain",
    "shortness of breath",
    "trouble breathing",
    "chest pressure",
    "chest tightness",
    "arm weakness",
    "face drooping",
    "speech difficulty",
    "vision changes",
    "loss of balance",
    "dizziness",
    "jaw pain",
    "neck pain",
    "rash",
    "hives",
    "nausea",
    "vomiting",
    "diarrhea",
    "constipation",
    "back pain",
    "urinary pain",
    "burning",
    "fatigue",
    "anxiety",
    "insomnia",
]

KNOWN_MEDICATIONS = [
    "acetaminophen",
    "paracetamol",
    "ibuprofen",
    "aspirin",
    "metformin",
    "amoxicillin",
    "albuterol",
    "cetirizine",
    "loratadine",
    "diphenhydramine",
    "omeprazole",
    "lisinopril",
    "atorvastatin",
    "tylenol",
    "advil",
    "motrin",
    "benadryl",
    "zyrtec",
    "claritin",
    "lipitor",
    "prilosec",
    "ventolin",
]

KNOWN_CONDITIONS = [
    "diabetes",
    "asthma",
    "hypertension",
    "high blood pressure",
    "kidney disease",
    "kidney problems",
    "liver disease",
    "liver problems",
    "pregnant",
    "pregnancy",
    "breastfeeding",
    "heart disease",
    "heart failure",
    "ulcer",
    "stomach ulcers",
    "stomach bleeding",
    "blood thinner",
    "blood thinners",
    "warfarin",
    "apixaban",
    "rivaroxaban",
    "clopidogrel",
    "allergy",
]


def extract_patient_profile(
    messages: list[Message],
    current_input: str | None = None,
) -> PatientProfile:
    text = " ".join(
        message.get("content", "")
        for message in messages[-20:]
        if message.get("role") == "patient"
    )
    if current_input:
        text = f"{text} {current_input}"

    profile: PatientProfile = {
        "symptoms": _collect_known_terms(text, KNOWN_SYMPTOMS),
        "medications": _collect_known_terms(text, KNOWN_MEDICATIONS),
        "conditions": _collect_known_terms(text, KNOWN_CONDITIONS),
        "preferences": [],
    }

    name_match = re.search(r"\bmy name is ([a-zA-Z][a-zA-Z .'-]{1,40})", text, flags=re.IGNORECASE)
    if name_match:
        profile["preferences"] = [f"name: {name_match.group(1).strip()}"]

    return {key: _dedupe(values) for key, values in profile.items() if values}


def merge_patient_profiles(
    existing: PatientProfile,
    new_profile: PatientProfile,
) -> PatientProfile:
    merged: PatientProfile = {}
    for key in ("symptoms", "medications", "conditions", "preferences"):
        merged_values = _dedupe([*(existing.get(key, []) or []), *(new_profile.get(key, []) or [])])
        if merged_values:
            merged[key] = merged_values[-20:]
    return merged
