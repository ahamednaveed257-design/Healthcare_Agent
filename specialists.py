from __future__ import annotations

import json
import math
import re
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from .classifier import (
    KNOWN_MEDICATIONS,
    KNOWN_SYMPTOMS,
    MEDICATION_PATTERNS,
    RISK_FACTOR_PATTERNS,
    SCHEDULING_PATTERNS,
    SYMPTOM_PATTERNS,
    _is_appointment_lookup,
    _known_terms,
    _missing_information,
)
from .config import settings
from .state import AgentState, ClinicalSlots, Message, PatientProfile


def _read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return default


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _source_for_document(document: dict[str, Any]) -> dict[str, str]:
    source = document.get("source")
    if isinstance(source, dict):
        return {
            "name": str(source.get("name") or document.get("title") or "Local medical FAQ"),
            "url": str(source.get("url") or ""),
        }
    return {"name": str(document.get("title") or "Local medical FAQ"), "url": ""}


def _tokenize(text: str) -> set[str]:
    stop_words = {
        "a",
        "an",
        "about",
        "and",
        "are",
        "bad",
        "can",
        "do",
        "for",
        "feel",
        "feeling",
        "good",
        "have",
        "how",
        "i",
        "is",
        "it",
        "me",
        "my",
        "not",
        "of",
        "or",
        "the",
        "to",
        "what",
        "when",
        "with",
    }
    return {
        token
        for token in re.findall(r"[a-zA-Z][a-zA-Z0-9-]+", text.lower())
        if token not in stop_words
    }


TOKEN_EXPANSIONS = {
    "bp": {"blood", "pressure", "hypertension"},
    "breathless": {"breathing", "shortness"},
    "dizzy": {"dizziness", "dehydration"},
    "dizziness": {"dizzy", "dehydration"},
    "sugar": {"glucose", "diabetes", "blood"},
    "tummy": {"stomach", "abdominal"},
    "wheeze": {"wheezing", "asthma"},
    "wheezing": {"wheeze", "asthma"},
}


def _expanded_tokens(text: str) -> set[str]:
    tokens = set(_tokenize(text))
    for token in list(tokens):
        tokens.update(TOKEN_EXPANSIONS.get(token, set()))
    return tokens


def _message_content(message: Message) -> str:
    return str(message.get("content") or "")


def _has_direct_clinical_signal(text: str) -> bool:
    if _known_terms(text, [*KNOWN_SYMPTOMS, *KNOWN_MEDICATIONS]):
        return True
    return any(
        re.search(pattern, text, flags=re.IGNORECASE)
        for pattern in [
            *SYMPTOM_PATTERNS,
            *MEDICATION_PATTERNS,
            *SCHEDULING_PATTERNS,
            *RISK_FACTOR_PATTERNS,
        ]
    )


def _contextual_query(
    user_input: str,
    memory: list[Message],
    patient_profile: PatientProfile | None = None,
) -> str:
    """Expand short follow-up queries with recent patient context and profile signals."""
    text = user_input.strip()
    profile = patient_profile or {}
    tokens = _tokenize(text)
    direct_signal = _has_direct_clinical_signal(text)
    vague_followup = bool(
        re.search(r"\b(it|that|this|again|still|same)\b", text, flags=re.IGNORECASE)
    )
    is_followup = vague_followup or (len(tokens) <= 4 and not direct_signal)
    if not is_followup:
        return text

    recent_patient_messages = [
        _message_content(message)
        for message in memory[-10:]
        if message.get("role") == "patient"
    ]
    recent_concrete_messages = [
        message for message in recent_patient_messages if _has_direct_clinical_signal(message)
    ][-2:]
    profile_terms = [
        *profile.get("symptoms", [])[-5:],
        *profile.get("conditions", [])[-5:],
        *profile.get("medications", [])[-5:],
    ]
    context_parts = recent_concrete_messages or recent_patient_messages[-1:]
    if not recent_concrete_messages:
        context_parts = [*context_parts, *profile_terms]
    context = " ".join(context_parts)
    return f"{text} {context}".strip()


def _rank_documents(query_text: str, documents: list[dict[str, Any]]) -> list[tuple[float, dict[str, Any]]]:
    query_tokens = _expanded_tokens(query_text)
    query_lower = query_text.lower()
    ranked: list[tuple[float, dict[str, Any]]] = []
    for document in documents:
        title = str(document.get("title", ""))
        question = str(document.get("question", ""))
        answer = str(document.get("answer", ""))
        tags = [str(tag) for tag in document.get("tags", [])]
        haystack = " ".join([title, question, answer, " ".join(tags)])
        haystack_tokens = _expanded_tokens(haystack)
        score = float(len(query_tokens & haystack_tokens))
        title_overlap = len(query_tokens & _expanded_tokens(title))
        tag_overlap = len(query_tokens & _expanded_tokens(" ".join(tags)))
        score += title_overlap * 0.65
        score += tag_overlap * 0.45
        normalized_tags = [tag.lower().strip() for tag in tags if tag.strip()]
        if any(tag and tag in query_lower for tag in normalized_tags):
            score += 1.1
        if title.lower() and title.lower() in query_lower:
            score += 1.2
        ranked.append((round(score, 3), document))
    return sorted(ranked, key=lambda item: item[0], reverse=True)


def _risk_terms(patient_profile: PatientProfile | None, clinical_slots: ClinicalSlots | None) -> list[str]:
    profile = patient_profile or {}
    slots = clinical_slots or {}
    return sorted(
        {
            str(value).strip().lower()
            for value in [
                *profile.get("conditions", []),
                *slots.get("risk_factors", []),
            ]
            if str(value).strip()
        }
    )


MEDICATION_RISK_RULES = {
    "ibuprofen": {
        "kidney": "Kidney disease or kidney problems make ibuprofen a higher-risk medicine to review with a clinician or pharmacist.",
        "ulcer": "A history of ulcers or stomach bleeding can raise the bleeding risk with ibuprofen.",
        "blood thinner": "Blood thinner use can raise bleeding risk with ibuprofen.",
        "warfarin": "Warfarin plus ibuprofen can raise bleeding risk and should be reviewed by a clinician or pharmacist.",
        "apixaban": "Apixaban plus ibuprofen can raise bleeding risk and should be reviewed by a clinician or pharmacist.",
        "rivaroxaban": "Rivaroxaban plus ibuprofen can raise bleeding risk and should be reviewed by a clinician or pharmacist.",
        "pregnan": "Pregnancy is a reason to ask a clinician before using ibuprofen.",
    },
    "aspirin": {
        "blood thinner": "Blood thinner use can raise bleeding risk with aspirin.",
        "warfarin": "Warfarin plus aspirin can raise bleeding risk and should be reviewed by a clinician or pharmacist.",
        "ulcer": "A history of ulcers or stomach bleeding can raise the bleeding risk with aspirin.",
    },
    "acetaminophen": {
        "liver": "Liver disease or heavy alcohol use makes acetaminophen dosing riskier and should be reviewed with a clinician or pharmacist.",
    },
    "metformin": {
        "kidney": "Kidney disease is important for metformin safety and should be reviewed by the prescriber.",
        "liver": "Liver disease or heavy alcohol use is important for metformin safety review.",
    },
    "diphenhydramine": {
        "older adult": "Diphenhydramine can cause confusion or strong sleepiness in some older adults.",
        "elderly": "Diphenhydramine can cause confusion or strong sleepiness in some older adults.",
        "asthma": "Breathing conditions can change whether sedating antihistamines are appropriate.",
    },
    "lisinopril": {
        "pregnan": "Pregnancy or possible pregnancy is urgent to discuss with the prescriber for lisinopril.",
        "kidney": "Kidney problems are important for lisinopril monitoring and should be reviewed with the prescriber.",
    },
}


def _medication_risk_notes(
    medication_name: str,
    patient_profile: PatientProfile | None,
    clinical_slots: ClinicalSlots | None,
) -> list[str]:
    terms = _risk_terms(patient_profile, clinical_slots)
    rules = MEDICATION_RISK_RULES.get(medication_name, {})
    notes: list[str] = []
    for term in terms:
        for needle, note in rules.items():
            if needle in term and note not in notes:
                notes.append(note)
    return notes


def _hash_embedding(text: str, size: int = 64) -> list[float]:
    vector = [0.0] * size
    for token in _tokenize(text):
        vector[hash(token) % size] += 1.0
    norm = math.sqrt(sum(value * value for value in vector))
    if norm == 0:
        return vector
    return [value / norm for value in vector]


@dataclass
class RagAgent:
    faq_path: Path

    def run(
        self,
        user_input: str,
        memory: list[Message],
        patient_profile: PatientProfile | None = None,
        care_plan: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        documents = _read_json(self.faq_path, [])
        query_text = _contextual_query(user_input, memory, patient_profile)
        ranked = _rank_documents(query_text, documents)
        best_score, best_document = ranked[0] if ranked else (0, {})

        if best_score == 0:
            chroma_result = self._try_chroma_search(query_text, documents, care_plan)
            if chroma_result is not None:
                return chroma_result

        if best_score == 0:
            return {
                "agent": "RAG Agent",
                "answer": (
                    "I do not have a close match in the local health FAQ. "
                    "I can share general information, but a clinician is the right person for personal advice."
                ),
                "sources": [],
                "confidence": 0.2,
                "retrieval_score": 0,
                "retriever": "keyword_ranker_v3",
                "retrieval_candidates_considered": len(documents),
                "needs_clarification": True,
                "missing_information": (care_plan or {}).get("missing_information", []),
            }

        confidence = min(0.95, 0.4 + best_score * 0.08)
        needs_clarification = bool((care_plan or {}).get("needs_clarification")) or confidence < 0.45
        return {
            "agent": "RAG Agent",
            "answer": best_document.get("answer", ""),
            "self_care": best_document.get("self_care", []),
            "monitor": best_document.get("monitor", []),
            "red_flags": best_document.get("red_flags", []),
            "sources": [_source_for_document(best_document)],
            "confidence": confidence,
            "retrieval_score": best_score,
            "matched_topic": best_document.get("title", ""),
            "related_topics": [
                document.get("title", "")
                for score, document in ranked[1:4]
                if score > 0 and document.get("title")
            ],
            "retriever": "keyword_ranker_v3",
            "retrieval_candidates_considered": len(documents),
            "needs_clarification": needs_clarification,
            "missing_information": (care_plan or {}).get("missing_information", []),
        }

    def _try_chroma_search(
        self,
        query_text: str,
        documents: list[dict[str, Any]],
        care_plan: dict[str, Any] | None = None,
    ) -> dict[str, Any] | None:
        if not documents:
            return None

        try:
            import chromadb
        except ImportError:
            return None

        try:
            client = chromadb.PersistentClient(path=str(self.faq_path.parent / "chroma"))
            collection = client.get_or_create_collection(name="medical_faqs")
            ids = [f"faq-{index}" for index in range(len(documents))]
            texts = [
                " ".join(
                    [
                        document.get("title", ""),
                        document.get("question", ""),
                        document.get("answer", ""),
                        " ".join(document.get("tags", [])),
                    ]
                )
                for document in documents
            ]
            collection.upsert(
                ids=ids,
                documents=texts,
                metadatas=[
                    {"index": index, "title": document.get("title", "Local medical FAQ")}
                    for index, document in enumerate(documents)
                ],
                embeddings=[_hash_embedding(text) for text in texts],
            )
            result = collection.query(
                query_embeddings=[_hash_embedding(query_text)],
                n_results=1,
                include=["metadatas", "distances"],
            )
        except Exception:
            return None

        metadatas = result.get("metadatas") or [[]]
        distances = result.get("distances") or [[]]
        if not metadatas[0]:
            return None

        index = int(metadatas[0][0]["index"])
        distance = float(distances[0][0]) if distances[0] else 1.0
        if distance > 1.3:
            return None

        best_document = documents[index]
        confidence = max(0.2, min(0.95, 1.0 - distance / 2))
        return {
            "agent": "RAG Agent",
            "answer": best_document.get("answer", ""),
            "self_care": best_document.get("self_care", []),
            "monitor": best_document.get("monitor", []),
            "red_flags": best_document.get("red_flags", []),
            "sources": [_source_for_document(best_document)],
            "confidence": confidence,
            "retrieval_score": round(1.0 - distance, 3),
            "matched_topic": best_document.get("title", ""),
            "needs_clarification": bool((care_plan or {}).get("needs_clarification")) or confidence < 0.45,
            "missing_information": (care_plan or {}).get("missing_information", []),
            "retriever": "chromadb",
            "retrieval_candidates_considered": len(documents),
        }


@dataclass
class PharmacyAgent:
    drug_path: Path

    def run(
        self,
        user_input: str,
        memory: list[Message],
        patient_profile: PatientProfile | None = None,
        clinical_slots: ClinicalSlots | None = None,
    ) -> dict[str, Any]:
        drugs = _read_json(self.drug_path, {})
        text = user_input.lower()
        slot_medications = clinical_slots.get("medications", []) if clinical_slots else []
        matches = [name for name in slot_medications if name in drugs]
        for drug_name, info in drugs.items():
            if drug_name in matches:
                continue
            names = [drug_name, *info.get("aliases", [])]
            if any(re.search(rf"\b{re.escape(name.lower())}\b", text) for name in names):
                matches.append(drug_name)

        if not matches and patient_profile:
            profile_meds = patient_profile.get("medications", [])
            is_followup = re.search(
                r"\b(it|that|this|side effects?|dose|dosage|interaction|refill|take|taken)\b",
                text,
            )
            matches = [name for name in profile_meds if name in drugs and is_followup]

        if not matches:
            return {
                "agent": "Pharmacy Agent",
                "answer": (
                    "I can help with general medication questions, but I need the medicine name. "
                    "Use the exact label name if you can."
                ),
                "medications": [],
                "needs_clarification": True,
                "missing_information": ["Medication name from the label"],
            }

        responses = []
        for name in matches:
            info = drugs[name]
            responses.append(
                {
                    "name": name,
                    "common_use": info.get("common_use", ""),
                    "general_guidance": info.get("general_guidance", ""),
                    "side_effects": info.get("side_effects", []),
                    "warnings": info.get("warnings", []),
                    "risk_notes": _medication_risk_notes(name, patient_profile, clinical_slots),
                    "identified_from": "memory" if name in (patient_profile or {}).get("medications", []) else "message",
                    "source": info.get("source"),
                }
            )

        return {
            "agent": "Pharmacy Agent",
            "answer": "General medication information found.",
            "medications": responses,
        }


@dataclass
class SchedulingAgent:
    appointment_path: Path

    def run(
        self,
        user_input: str,
        memory: list[Message],
        patient_id: str,
        missing_information: list[str] | None = None,
        preview: bool = False,
    ) -> dict[str, Any]:
        payload = _read_json(self.appointment_path, {"appointments": []})
        appointments = payload.setdefault("appointments", [])
        text = user_input.lower()

        if _is_appointment_lookup(text):
            upcoming = self._upcoming_for_patient(appointments, patient_id)
            if not upcoming:
                return {
                    "agent": "Scheduling Agent",
                    "answer": "I could not find an upcoming appointment in the local schedule.",
                    "appointment": None,
                }
            return {
                "agent": "Scheduling Agent",
                "answer": "Upcoming appointment found.",
                "appointment": upcoming[0],
            }

        if missing_information:
            return {
                "agent": "Scheduling Agent",
                "answer": "I need a little more scheduling detail before creating an appointment request.",
                "appointment": None,
                "missing_information": missing_information,
                "needs_clarification": True,
            }

        requested_time = self._extract_requested_time(user_input)
        appointment = {
            "id": f"apt-{len(appointments) + 1:03d}",
            "patient_id": patient_id,
            "when": requested_time.isoformat(timespec="minutes"),
            "clinician": "Care team",
            "reason": user_input.strip(),
            "status": "draft_preview" if preview else "requested",
        }
        if preview:
            return {
                "agent": "Scheduling Agent",
                "answer": "Appointment request preview drafted.",
                "appointment": appointment,
                "preview": True,
            }
        appointments.append(appointment)
        _write_json(self.appointment_path, payload)
        return {
            "agent": "Scheduling Agent",
            "answer": "Appointment request created.",
            "appointment": appointment,
        }

    @staticmethod
    def _upcoming_for_patient(appointments: list[dict[str, Any]], patient_id: str) -> list[dict[str, Any]]:
        now = datetime.now()
        upcoming = []
        for appointment in appointments:
            if appointment.get("patient_id") not in {patient_id, "demo-patient"}:
                continue
            try:
                when = datetime.fromisoformat(appointment["when"])
            except (KeyError, ValueError, TypeError):
                continue
            if when >= now and appointment.get("status") in {"scheduled", "requested"}:
                upcoming.append(appointment)
        return sorted(upcoming, key=lambda item: item["when"])

    @staticmethod
    def _extract_requested_time(user_input: str) -> datetime:
        text = user_input.lower()
        now = datetime.now().replace(second=0, microsecond=0)
        iso_match = re.search(r"\b(20\d{2}-\d{2}-\d{2})(?:[ t](\d{1,2}:\d{2}))?\b", text)
        if iso_match:
            date_part = iso_match.group(1)
            time_part = iso_match.group(2) or "09:00"
            try:
                return datetime.fromisoformat(f"{date_part}T{time_part}")
            except ValueError:
                pass
        if "tomorrow" in text:
            return (now + timedelta(days=1)).replace(hour=9, minute=0)
        if "next week" in text:
            return (now + timedelta(days=7)).replace(hour=9, minute=0)
        return (now + timedelta(days=3)).replace(hour=9, minute=0)


@dataclass
class AlertAgent:
    alert_path: Path

    def run(self, state: AgentState) -> dict[str, Any]:
        alert = {
            "patient_id": state.get("patient_id", "demo-patient"),
            "created_at": datetime.now().isoformat(timespec="seconds"),
            "message": state.get("user_input", ""),
            "clinical_slots": state.get("clinical_slots", {}),
            "urgency_level": state.get("urgency_level", "emergency"),
            "status": "logged",
            "channels": ["local_log"],
        }

        if settings.enable_real_alerts:
            sent = self._try_send_sms(alert)
            if sent:
                alert["status"] = "sent"
                alert["channels"].append("twilio_sms")

        payload = _read_json(self.alert_path, {"alerts": []})
        payload.setdefault("alerts", []).append(alert)
        _write_json(self.alert_path, payload)

        return {
            "agent": "Alert Agent",
            "answer": "Emergency warning signs detected and caregiver alert workflow started.",
            "alert": alert,
        }

    @staticmethod
    def _try_send_sms(alert: dict[str, Any]) -> bool:
        required = [
            settings.twilio_account_sid,
            settings.twilio_auth_token,
            settings.twilio_from_number,
            settings.caregiver_phone_number,
        ]
        if not all(required):
            return False

        try:
            from twilio.rest import Client
        except ImportError:
            return False

        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        body = (
            "Healthcare Agent alert: possible emergency warning signs reported by "
            f"{alert['patient_id']}. Message: {alert['message']}"
        )
        client.messages.create(
            body=body[:1500],
            from_=settings.twilio_from_number,
            to=settings.caregiver_phone_number,
        )
        return True


def run_specialist(state: AgentState, data_dir: Path | None = None) -> dict[str, Any]:
    data_root = data_dir or settings.data_dir
    intent = state["intent"]
    user_input = state.get("user_input", "")
    memory = state.get("memory", [])
    patient_id = state.get("patient_id", "demo-patient")

    if intent == "pharmacy":
        return PharmacyAgent(drug_path=data_root / "drugs.json").run(
            user_input,
            memory,
            state.get("patient_profile", {}),
            state.get("clinical_slots", {}),
        )
    if intent == "scheduling":
        return SchedulingAgent(appointment_path=data_root / "appointments.json").run(
            user_input,
            memory,
            patient_id,
            state.get("missing_information", []),
            preview=bool(state.get("specialist_mode") == "preview"),
        )
    if intent == "alert":
        return AlertAgent(alert_path=data_root / "alerts.json").run(state)
    return RagAgent(faq_path=data_root / "medical_faqs.json").run(
        user_input,
        memory,
        state.get("patient_profile", {}),
        state.get("care_plan", {}),
    )


def _secondary_output_summary(intent: str, output: dict[str, Any]) -> str:
    missing = [str(item) for item in output.get("missing_information", []) if item]
    if missing:
        return "Needs: " + "; ".join(missing[:3]) + "."

    if intent == "scheduling":
        appointment = output.get("appointment") or {}
        when = appointment.get("when")
        if when:
            status = "drafted" if appointment.get("status") == "draft_preview" else "found"
            return f"Appointment {status} for {when}."
        return str(output.get("answer") or "Scheduling preview completed.")

    if intent == "pharmacy":
        names = [
            str(medication.get("name"))
            for medication in output.get("medications", [])
            if isinstance(medication, dict) and medication.get("name")
        ]
        if names:
            return "Medication information found for " + ", ".join(names[:3]) + "."
        return str(output.get("answer") or "Pharmacy preview completed.")

    if intent == "rag":
        topic = output.get("matched_topic")
        if topic:
            return f"Closest health topic: {topic}."
        return str(output.get("answer") or "Health knowledge preview completed.")

    return str(output.get("answer") or "Secondary agent preview completed.")


def _compact_secondary_output(intent: str, output: dict[str, Any]) -> dict[str, Any]:
    compact: dict[str, Any] = {
        "intent": intent,
        "agent": output.get("agent", "Specialist Agent"),
        "status": "needs_clarification" if output.get("needs_clarification") else "previewed",
        "summary": _secondary_output_summary(intent, output),
    }
    if output.get("missing_information"):
        compact["missing_information"] = output.get("missing_information", [])
    if output.get("appointment"):
        compact["appointment"] = output["appointment"]
    if output.get("matched_topic"):
        compact["matched_topic"] = output["matched_topic"]
    medications = [
        {"name": medication.get("name"), "identified_from": medication.get("identified_from")}
        for medication in output.get("medications", [])
        if isinstance(medication, dict) and medication.get("name")
    ]
    if medications:
        compact["medications"] = medications
    return compact


def run_secondary_specialists(
    state: AgentState,
    data_dir: Path | None = None,
    max_calls: int = 2,
) -> list[dict[str, Any]]:
    """Run bounded, side-effect-safe previews for non-emergency secondary routes."""
    if state.get("intent") == "alert" or state.get("urgency_level") == "emergency":
        return []

    secondary_intents = [
        intent
        for intent in state.get("secondary_intents", [])
        if intent != state.get("intent") and intent != "alert"
    ][:max_calls]
    if not secondary_intents:
        return []

    previews: list[dict[str, Any]] = []
    for intent in secondary_intents:
        secondary_missing = _missing_information(
            intent,  # type: ignore[arg-type]
            state.get("urgency_level", "routine"),  # type: ignore[arg-type]
            state.get("clinical_slots", {}),
            state.get("patient_profile", {}),
            state.get("user_input", ""),
        )
        secondary_care_plan = {
            **state.get("care_plan", {}),
            "selected_intent": intent,
            "missing_information": secondary_missing,
            "needs_clarification": bool(secondary_missing),
        }
        secondary_state: AgentState = {
            **state,
            "intent": intent,  # type: ignore[typeddict-item]
            "missing_information": secondary_missing,
            "care_plan": secondary_care_plan,  # type: ignore[typeddict-item]
            "specialist_mode": "preview",
        }
        try:
            output = run_specialist(secondary_state, data_dir=data_dir)
        except Exception:
            previews.append(
                {
                    "intent": intent,
                    "agent": "Specialist Agent",
                    "status": "failed",
                    "summary": "Secondary preview could not complete in this turn.",
                }
            )
            continue
        previews.append(_compact_secondary_output(intent, output))
    return previews
