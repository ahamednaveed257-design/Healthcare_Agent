from __future__ import annotations

import re

from .state import (
    AgentAction,
    CarePlan,
    ClinicalSlots,
    Intent,
    Message,
    PatientProfile,
    QualityGate,
    RouteScore,
    UrgencyLevel,
)


EMERGENCY_PATTERNS = [
    r"\b(chest pain|heart attack|stroke|seizure)\b",
    r"\b(can'?t breathe|cannot breathe|trouble breathing|shortness of breath)\b",
    r"\b(severe bleeding|bleeding heavily|blood won'?t stop)\b",
    r"\b(fainted|passed out|unconscious|can'?t wake|cannot wake)\b",
    r"\b(overdose|took too much|poison)\b",
    r"\b(?:took|swallowed|ate)\s+(?:\d{2,}|ten|eleven|twelve|thirteen|fourteen|fifteen|twenty|many|a lot of|a handful of)\s+(?:pills?|tablets?|capsules?|doses?)\b",
    r"\b(?:took|swallowed|ate)\s+(?:\d{2,}|ten|eleven|twelve|thirteen|fourteen|fifteen|twenty|many|a lot of|a handful of)\s+[a-z0-9 -]{2,30}\s+(?:pills?|tablets?|capsules?|doses?)\b",
    r"\b(suicidal|kill myself|self harm|hurt myself|want to die|can'?t stay safe|cannot stay safe)\b",
    r"\b(blue lips|face drooping|weakness on one side|slurred speech)\b",
    r"\b(swelling of (my )?(face|lips|tongue|throat)|anaphylaxis)\b",
    r"\b(cannot speak|can'?t speak|worst headache|sudden confusion)\b",
    r"\b(sudden (?:numbness|weakness|vision changes?|trouble seeing|loss of balance|trouble walking|severe headache))\b",
    r"\b(arm weakness|arm is weak|one arm (?:is )?(?:weak|numb|drift(?:ing)?)|facial droop|face (?:is )?droop(?:ing)?|speech difficulty)\b",
    r"\b(chest (?:pressure|tightness|(?:feels )?tight|squeezing|discomfort).*(?:jaw|neck|back|arm|shoulder|shortness of breath|cold sweat|nausea|light-?headed))\b",
    r"\b((?:jaw|neck|back|arm|shoulder) pain.*(?:chest|shortness of breath|cold sweat|nausea|light-?headed))\b",
    r"\b(severe allergic reaction|throat closing|tongue swelling)\b",
    r"\b(chest (?:pain|pressure|tightness|(?:feels )?tight|squeezing|discomfort).*(?:sweat|sweating|cold sweat|nausea|light-?headed|dizzy|faint))\b",
    r"\b((?:sweat|sweating|cold sweat|nausea|light-?headed|dizzy|faint).*(?:chest (?:pain|pressure|tightness|(?:feels )?tight|squeezing|discomfort)))\b",
    r"\b(fever.*stiff neck|stiff neck.*fever)\b",
    r"\b(hives.*(?:dizzy|faint|trouble breathing|shortness of breath)|(?:dizzy|faint|trouble breathing|shortness of breath).*hives)\b",
    r"\b(cannot speak full sentences|can'?t speak full sentences|rescue inhaler (?:is )?not helping|inhaler (?:is )?not helping)\b",
]

MEDICATION_PATTERNS = [
    r"\b(medicine|medication|drug|pill|prescription|refill)\b",
    r"\b(dose|dosage|side effect|interaction|allergy|antibiotic)\b",
    r"\b(acetaminophen|paracetamol|ibuprofen|aspirin|metformin|amoxicillin)\b",
    r"\b(albuterol|cetirizine|loratadine|diphenhydramine|omeprazole|lisinopril|atorvastatin)\b",
    r"\b(tylenol|advil|motrin|benadryl|zyrtec|claritin|lipitor|prilosec|ventolin)\b",
]

SCHEDULING_PATTERNS = [
    r"\b(appointment|schedule|reschedule|cancel|book|calendar)\b",
    r"\b(next visit|doctor visit|see my doctor|reminder)\b",
]

SYMPTOM_PATTERNS = [
    r"\b(headache|fever|cough|rash|dizzy|dizziness|nausea|vomiting|diarrhea)\b",
    r"\b(sore throat|back pain|stomach pain|fatigue|anxiety|insomnia)\b",
    r"\b(wheezing|chills|confusion|weakness|blood sugar|blood pressure|oxygen|spo2)\b",
]

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
    "wheezing",
    "chills",
    "confusion",
    "weakness",
    "blood sugar",
    "blood pressure",
    "oxygen",
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

URGENT_SYMPTOM_PATTERNS = [
    r"\b(severe|worsening|blood|faint|dehydrated|cannot keep fluids|high fever)\b",
    r"\b(black stools|vomiting blood|blood in (?:stool|urine)|persistent vomiting|severe abdominal pain)\b",
    r"\b(pregnant.*(?:bleeding|severe pain)|bleeding.*pregnant)\b",
    r"\b(infant.*fever|baby.*fever|newborn.*fever)\b",
]

RISK_FACTOR_PATTERNS = [
    r"\b(pregnant|pregnancy|breastfeeding)\b",
    r"\b(kidney disease|kidney problems?|renal disease)\b",
    r"\b(liver disease|liver problems?|hepatitis)\b",
    r"\b(stomach ulcers?|ulcers?|stomach bleeding|gi bleeding)\b",
    r"\b(blood thinners?|warfarin|apixaban|rivaroxaban|clopidogrel)\b",
    r"\b(heart disease|heart failure|heart condition)\b",
    r"\b(diabetes|asthma|hypertension|high blood pressure)\b",
    r"\b(allerg(?:y|ic) to [a-z0-9 -]{2,40})\b",
]

AGE_GROUP_PATTERNS = [
    r"\b(infant|newborn|baby|toddler|child|teen|teenager|older adult|elderly)\b",
]

NEGATED_RED_FLAG_TERMS = [
    "chest pain",
    "chest pressure",
    "chest tightness",
    "shortness of breath",
    "trouble breathing",
    "cannot breathe",
    "weakness on one side",
    "face drooping",
    "slurred speech",
    "severe bleeding",
    "fainted",
    "passed out",
    "confusion",
    "hives",
    "swelling",
]


def _matches(patterns: list[str], text: str) -> bool:
    return any(re.search(pattern, text, flags=re.IGNORECASE) for pattern in patterns)


def _is_negated_match(text: str, start: int, end: int) -> bool:
    before = text[max(0, start - 72) : start].lower()
    matched_window = text[max(0, start - 12) : min(len(text), end + 36)].lower()
    prefix_negation = re.search(
        r"\b(?:no|not|without|denies|deny|negative for|don't have|do not have|doesn't have|does not have|not having|not experiencing)\b[\w\s,;/:-]{0,64}$",
        before,
    )
    inline_negation = re.search(
        r"\b(?:no|not|without|denies|deny|negative for|don't have|do not have|doesn't have|does not have|not having|not experiencing)\b[\w\s,;/:-]{0,48}"
        r"(?:chest pain|chest pressure|chest tightness|shortness of breath|trouble breathing|weakness|face droop|slurred speech|hives|swelling)",
        matched_window,
    )
    return bool(prefix_negation or inline_negation)


def _pattern_hits(patterns: list[str], text: str, *, skip_negated: bool = False) -> list[str]:
    hits = []
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            if skip_negated and _is_negated_match(text, match.start(), match.end()):
                continue
            hits.append(match.group(0).lower())
    return hits


def _score_from_hits(base: float, hits: list[str], weight: float) -> float:
    return min(1.0, base + len(hits) * weight)


def _add_evidence(evidence: list[str], label: str, hits: list[str]) -> None:
    if hits:
        evidence.append(f"{label}: " + ", ".join(sorted(set(hits))[:5]))


def _unique(values: list[str]) -> list[str]:
    seen = set()
    result = []
    for value in values:
        normalized = re.sub(r"\s+", " ", value.strip().lower())
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        result.append(normalized)
    return result


def _known_terms(text: str, terms: list[str]) -> list[str]:
    return _unique(
        [
            term
            for term in terms
            if re.search(rf"\b{re.escape(term)}\b", text, flags=re.IGNORECASE)
        ]
    )


def _negated_red_flags(text: str) -> list[str]:
    flags: list[str] = []
    for term in NEGATED_RED_FLAG_TERMS:
        pattern = (
            r"\b(?:no|not|without|denies|deny|negative for|don't have|do not have|doesn't have|does not have|not having|not experiencing)\b"
            rf"[\w\s,;/:-]{{0,64}}\b{re.escape(term)}\b"
        )
        if re.search(pattern, text, flags=re.IGNORECASE):
            flags.append(term)
    return _unique(flags)


def _extract_measurements(text: str) -> dict[str, object]:
    measurements: dict[str, object] = {}

    bp_match = re.search(
        r"\b(?:blood pressure|bp)\s*(?:is|of|reading|:)?\s*(\d{2,3})\s*/\s*(\d{2,3})\b",
        text,
        flags=re.IGNORECASE,
    )
    if bp_match:
        measurements["blood_pressure"] = {
            "systolic": int(bp_match.group(1)),
            "diastolic": int(bp_match.group(2)),
        }

    temperature_match = re.search(
        r"\b(?:temperature|temp|fever)\s*(?:is|of|reading|:)?\s*(9[0-9](?:\.\d+)?|10[0-9](?:\.\d+)?)\s*(?:f|fahrenheit)?\b",
        text,
        flags=re.IGNORECASE,
    )
    if temperature_match:
        measurements["temperature_f"] = float(temperature_match.group(1))

    oxygen_match = re.search(
        r"\b(?:oxygen saturation|oxygen|o2|spo2|pulse ox)\s*(?:is|of|reading|:)?\s*(\d{2,3})\s*%?\b",
        text,
        flags=re.IGNORECASE,
    )
    if oxygen_match:
        measurements["oxygen_saturation"] = int(oxygen_match.group(1))

    glucose_match = re.search(
        r"\b(?:blood sugar|glucose|sugar)\s*(?:is|of|reading|:)?\s*(\d{2,3})\s*(?:mg\s*/?\s*dl)?\b",
        text,
        flags=re.IGNORECASE,
    )
    if glucose_match:
        measurements["blood_glucose"] = int(glucose_match.group(1))

    pulse_match = re.search(
        r"\b(?:heart rate|pulse|hr)\s*(?:is|of|reading|:)?\s*(\d{2,3})\s*(?:bpm)?\b",
        text,
        flags=re.IGNORECASE,
    )
    if pulse_match:
        measurements["heart_rate"] = int(pulse_match.group(1))

    return measurements


def _measurement_flags(measurements: dict[str, object], text: str = "") -> dict[str, list[str]]:
    emergency: list[str] = []
    urgent: list[str] = []

    oxygen = measurements.get("oxygen_saturation")
    if isinstance(oxygen, int):
        if oxygen < 90:
            emergency.append(f"oxygen saturation {oxygen}%")
        elif oxygen <= 93:
            urgent.append(f"oxygen saturation {oxygen}%")

    glucose = measurements.get("blood_glucose")
    if isinstance(glucose, int):
        if glucose <= 54:
            emergency.append(f"blood glucose {glucose}")
        elif glucose < 70 or glucose >= 300:
            urgent.append(f"blood glucose {glucose}")

    temperature = measurements.get("temperature_f")
    if isinstance(temperature, float):
        if temperature >= 105 or temperature < 95:
            emergency.append(f"temperature {temperature:g}F")
        elif temperature >= 103:
            urgent.append(f"temperature {temperature:g}F")

    bp = measurements.get("blood_pressure")
    if isinstance(bp, dict):
        systolic = int(bp.get("systolic", 0) or 0)
        diastolic = int(bp.get("diastolic", 0) or 0)
        if systolic >= 180 or diastolic >= 120:
            if re.search(
                r"\b(chest pain|shortness of breath|trouble breathing|weakness|confusion|vision change|severe headache)\b",
                text,
                flags=re.IGNORECASE,
            ):
                emergency.append(f"blood pressure {systolic}/{diastolic} with concerning symptoms")
            else:
                urgent.append(f"blood pressure {systolic}/{diastolic}")

    heart_rate = measurements.get("heart_rate")
    if isinstance(heart_rate, int):
        if heart_rate >= 140 or heart_rate <= 40:
            urgent.append(f"heart rate {heart_rate}")

    flags: dict[str, list[str]] = {}
    if emergency:
        flags["emergency"] = _unique(emergency)
    if urgent:
        flags["urgent"] = _unique(urgent)
    return flags


def _first_capture(patterns: list[str], text: str) -> str:
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return re.sub(r"\s+", " ", (match.group(1) or match.group(0)).strip().lower())
    return ""


def _extract_clinical_slots(
    user_input: str,
    alert_hits: list[str],
    patient_profile: PatientProfile,
) -> ClinicalSlots:
    text = user_input.strip()
    symptoms = _known_terms(text, KNOWN_SYMPTOMS)
    medications = _known_terms(text, KNOWN_MEDICATIONS)
    measurements = _extract_measurements(text)
    measurement_flags = _measurement_flags(measurements, text)
    risk_factors = _unique(
        [
            *_pattern_hits(RISK_FACTOR_PATTERNS, text),
            *patient_profile.get("conditions", []),
        ]
    )
    if not medications and patient_profile.get("medications") and re.search(
        r"\b(it|that|this|side effects?|dose|dosage|interaction|refill|take|taken)\b",
        text,
        flags=re.IGNORECASE,
    ):
        medications = patient_profile.get("medications", [])[-3:]

    duration = _first_capture(
        [
            r"\b(?:for|since|over|past|last)\s+((?:\d+|one|two|three|four|five|six|seven|a|an)\s+(?:minutes?|hours?|days?|weeks?|months?))\b",
            r"\b(yesterday|today|tonight|this morning|this afternoon|this evening)\b",
        ],
        text,
    )
    severity = _first_capture(
        [
            r"\b(\d{1,2}\s*/\s*10)\b",
            r"\b(mild|moderate|severe|very severe|worst|unbearable)\b",
        ],
        text,
    )
    dose = _first_capture(
        [
            r"\b(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|tablets?|capsules?|puffs?|units?))\b",
            r"\b((?:one|two|three|four|five)\s+(?:tablets?|capsules?|puffs?|units?))\b",
        ],
        text,
    )
    appointment_time = _first_capture(
        [
            r"\b(20\d{2}-\d{2}-\d{2}(?:[ t]\d{1,2}:\d{2})?)\b",
            r"\b(tomorrow|next week|next month|today|this week|morning|afternoon|evening)\b",
        ],
        text,
    )
    reason_match = re.search(
        r"\b(?:for|about|because of)\s+([a-z0-9 ,.'-]{3,80})",
        text,
        flags=re.IGNORECASE,
    )
    appointment_reason = ""
    if reason_match and _matches(SCHEDULING_PATTERNS, text):
        appointment_reason = re.sub(r"\s+", " ", reason_match.group(1).strip().lower())

    slots: ClinicalSlots = {}
    if symptoms:
        slots["symptoms"] = symptoms
    if medications:
        slots["medications"] = _unique(medications)
    if risk_factors:
        slots["risk_factors"] = risk_factors
    age_group = _first_capture(AGE_GROUP_PATTERNS, text)
    if age_group:
        slots["age_group"] = age_group
    if duration:
        slots["duration"] = duration
    if severity:
        slots["severity"] = severity
    if dose:
        slots["dose"] = dose
    if appointment_time:
        slots["appointment_time"] = appointment_time
    if appointment_reason:
        slots["appointment_reason"] = appointment_reason

    negated_red_flags = _negated_red_flags(text)
    red_flags = _unique(
        [
            *alert_hits,
            *_pattern_hits(URGENT_SYMPTOM_PATTERNS, text),
            *measurement_flags.get("emergency", []),
            *measurement_flags.get("urgent", []),
        ]
    )
    if red_flags:
        slots["red_flags"] = red_flags
    if negated_red_flags:
        slots["negated_red_flags"] = negated_red_flags
    if measurements:
        slots["measurements"] = measurements
    if measurement_flags:
        slots["measurement_flags"] = measurement_flags
    return slots


def _urgency_for(
    user_input: str,
    alert_hits: list[str],
    clinical_slots: ClinicalSlots | None = None,
) -> UrgencyLevel:
    text = user_input.lower()
    measurement_flags = (clinical_slots or {}).get("measurement_flags", {})
    emergency_measurements = measurement_flags.get("emergency", []) if isinstance(measurement_flags, dict) else []
    urgent_measurements = measurement_flags.get("urgent", []) if isinstance(measurement_flags, dict) else []
    if alert_hits or emergency_measurements:
        return "emergency"
    if _matches(URGENT_SYMPTOM_PATTERNS, text) or urgent_measurements:
        return "urgent"
    if re.search(r"\b(days|week|recurring|keeps happening|not getting better)\b", text):
        return "watch"
    return "routine"


def _suggest_followups(intent: Intent, urgency: UrgencyLevel) -> list[str]:
    if urgency == "emergency":
        return [
            "If it is safe, tell the caregiver or emergency operator when symptoms started.",
            "Share current medications and allergies with the responder.",
        ]
    if intent == "pharmacy":
        return [
            "What is the exact medication name and strength on the label?",
            "How much was taken and when?",
            "Are there allergies, pregnancy, kidney disease, liver disease, or blood thinners involved?",
        ]
    if intent == "scheduling":
        return [
            "What day or time works best?",
            "What is the reason for the visit?",
            "Do you need a reminder or reschedule?",
        ]
    return [
        "When did this start?",
        "How severe is it right now?",
        "Are there fever, breathing problems, chest pain, fainting, confusion, or new weakness?",
    ]


def _is_appointment_lookup(text: str) -> bool:
    lower = text.lower()
    lookup_signal = bool(
        re.search(r"\b(?:when|upcoming|check)\b", lower)
        or re.search(r"\bnext\s+(?:appointment|visit|doctor visit)\b", lower)
    )
    create_signal = bool(re.search(r"\b(?:schedule|book|create|make|request|reschedule)\b", lower))
    return lookup_signal and not create_signal


def _missing_information(
    intent: Intent,
    urgency: UrgencyLevel,
    slots: ClinicalSlots,
    patient_profile: PatientProfile,
    user_input: str,
) -> list[str]:
    missing: list[str] = []
    text = user_input.lower()
    is_appointment_lookup = intent == "scheduling" and _is_appointment_lookup(text)

    if urgency == "emergency":
        if not slots.get("duration"):
            missing.append("When the emergency symptoms started")
        if not patient_profile.get("medications"):
            missing.append("Current medications and allergies for responders")
        return missing

    if intent == "pharmacy":
        if not slots.get("medications"):
            missing.append("Medication name from the label")
        if not slots.get("dose"):
            missing.append("Dose or strength and when it was taken")
        if not patient_profile.get("conditions") and not slots.get("risk_factors"):
            missing.append("Relevant conditions such as pregnancy, kidney disease, liver disease, ulcers, or blood thinner use")
        return missing

    if intent == "scheduling" and not is_appointment_lookup:
        if not slots.get("appointment_time"):
            missing.append("Preferred appointment day or time")
        if not slots.get("appointment_reason"):
            missing.append("Reason for the appointment")
        return missing

    if intent == "rag":
        if not slots.get("symptoms"):
            missing.append("Main symptom or health concern")
        if not slots.get("duration"):
            missing.append("When this started or how long it has been happening")
        if not slots.get("severity"):
            missing.append("Current severity")

    return missing


def _quality_gates(
    intent: Intent,
    urgency: UrgencyLevel,
    route_scores: list[RouteScore],
    confidence: float,
    missing: list[str],
) -> tuple[list[QualityGate], bool]:
    gates: list[QualityGate] = []
    top_route = route_scores[0] if route_scores else None
    second_route = route_scores[1] if len(route_scores) > 1 else None

    if urgency == "emergency" or intent == "alert":
        return [
            {
                "name": "emergency_override",
                "status": "passed",
                "reason": "Emergency signals override ambiguity and routine route scoring.",
                "details": {"selected_intent": intent, "confidence": confidence},
            }
        ], False

    if confidence < 0.45:
        gates.append(
            {
                "name": "low_route_confidence",
                "status": "blocked",
                "reason": "The selected route is below the minimum confidence threshold.",
                "details": {"confidence": confidence, "threshold": 0.45},
            }
        )
    elif confidence < 0.58:
        gates.append(
            {
                "name": "moderate_route_confidence",
                "status": "watch",
                "reason": "The selected route is usable but should ask for concrete follow-up details.",
                "details": {"confidence": confidence, "threshold": 0.58},
            }
        )

    if top_route and second_route:
        score_gap = float(top_route["score"]) - float(second_route["score"])
        if second_route["score"] >= 0.34 and score_gap < 0.12:
            gates.append(
                {
                    "name": "ambiguous_route",
                    "status": "blocked",
                    "reason": "Two specialist routes are close enough that the agent should clarify before relying on one.",
                    "details": {
                        "top_intent": top_route["intent"],
                        "second_intent": second_route["intent"],
                        "score_gap": round(score_gap, 3),
                    },
                }
            )

    if intent == "pharmacy" and any("Medication name" in item for item in missing):
        gates.append(
            {
                "name": "missing_medication_name",
                "status": "blocked",
                "reason": "The Pharmacy Agent needs the exact medication name before lookup.",
                "details": {"missing_information": missing},
            }
        )

    if intent == "pharmacy" and not any(gate.get("status") == "blocked" for gate in gates) and missing:
        gates.append(
            {
                "name": "pharmacy_context_gap",
                "status": "watch",
                "reason": "The Pharmacy Agent can provide general information, but patient-specific dosing and risk review need the missing context.",
                "details": {"missing_information": missing},
            }
        )

    if intent == "scheduling" and missing:
        gates.append(
            {
                "name": "missing_scheduling_details",
                "status": "blocked",
                "reason": "The Scheduling Agent needs a time and reason before creating a request.",
                "details": {"missing_information": missing},
            }
        )

    if not gates:
        gates.append(
            {
                "name": "route_quality",
                "status": "passed",
                "reason": "Route confidence and required fields are sufficient for this turn.",
                "details": {"confidence": confidence},
            }
        )

    needs_clarification = any(gate.get("status") == "blocked" for gate in gates)
    return gates, needs_clarification


def _secondary_intents(
    selected: Intent,
    urgency: UrgencyLevel,
    route_scores: list[RouteScore],
) -> list[Intent]:
    threshold = 0.28 if urgency == "emergency" else 0.40
    secondary: list[Intent] = []
    for route in route_scores:
        intent = route.get("intent")
        score = float(route.get("score", 0.0) or 0.0)
        if intent == selected or score < threshold:
            continue
        if intent == "rag" and (urgency == "emergency" or score < 0.62):
            continue
        if not route.get("evidence") and score < 0.55:
            continue
        secondary.append(intent)
    return secondary[:2]


def _agent_actions(
    intent: Intent,
    urgency: UrgencyLevel,
    missing: list[str],
    quality_gates: list[QualityGate],
    clinical_slots: ClinicalSlots | None = None,
    secondary_intents: list[Intent] | None = None,
    memory_count: int = 0,
) -> list[AgentAction]:
    blocking_gates = [gate.get("name", "quality_gate") for gate in quality_gates if gate.get("status") == "blocked"]
    secondary_intents = secondary_intents or []
    clinical_slots = clinical_slots or {}
    measurements = clinical_slots.get("measurements", {})
    measurement_flags = clinical_slots.get("measurement_flags", {})
    actions: list[AgentAction] = [
        {
            "name": "resolve_memory_context",
            "status": "completed",
            "rationale": "Loaded recent conversation and patient profile before choosing a specialist.",
            "details": {"memory_messages_available": memory_count, "recent_messages_used": min(memory_count, 4)},
        },
        {
            "name": "parse_patient_context",
            "status": "completed",
            "rationale": "Extracted symptoms, medications, timing, risk phrases, and profile signals.",
            "details": {"missing_information_count": len(missing)},
        },
        {
            "name": "screen_for_emergency",
            "status": "completed",
            "rationale": f"Urgency classified as {urgency}.",
            "details": {
                "urgency_level": urgency,
                "measurement_flags": measurement_flags,
                "negated_red_flags": clinical_slots.get("negated_red_flags", []),
            },
        },
        {
            "name": "build_triage_context_packet",
            "status": "completed",
            "rationale": "Combined extracted slots, vital-style measurements, memory, and profile signals before routing.",
            "details": {
                "clinical_slot_count": len(clinical_slots),
                "measurement_count": len(measurements) if isinstance(measurements, dict) else 0,
            },
        },
        {
            "name": "quality_gate_review",
            "status": "blocked" if blocking_gates else "completed",
            "rationale": (
                "Blocked specialist execution until the patient clarifies: " + ", ".join(blocking_gates)
                if blocking_gates
                else "Route confidence, ambiguity, and required-field checks passed."
            ),
            "details": {"blocking_gates": blocking_gates},
        },
    ]

    if urgency == "emergency":
        actions.append(
            {
                "name": "activate_alert_workflow",
                "status": "queued",
                "rationale": "Emergency warning signs should bypass routine routing.",
                "details": {},
            }
        )
    elif intent == "pharmacy":
        needs_medication_name = any("Medication name" in item for item in missing)
        actions.append(
            {
                "name": "consult_pharmacy_agent",
                "status": "blocked" if needs_medication_name else "queued",
                "rationale": "Medication safety questions require a named medicine before detailed lookup.",
                "details": {"blocking_fields": [item for item in missing if "Medication name" in item]},
            }
        )
    elif intent == "scheduling":
        actions.append(
            {
                "name": "coordinate_scheduling_agent",
                "status": "queued",
                "rationale": "Appointment requests can be checked or drafted from local scheduling data.",
                "details": {"missing_information": missing},
            }
        )
    else:
        actions.append(
            {
                "name": "retrieve_health_knowledge",
                "status": "queued",
                "rationale": "General health questions are answered from the local knowledge library.",
                "details": {"missing_information": missing},
            }
        )

    if secondary_intents:
        actions.append(
            {
                "name": "track_secondary_routes",
                "status": "blocked" if urgency == "emergency" else "completed",
                "rationale": (
                    "Emergency handling stays first; secondary route(s) are saved for follow-up."
                    if urgency == "emergency"
                    else "Captured additional care needs so the next turn can continue without losing context."
                ),
                "details": {"secondary_intents": secondary_intents},
            }
        )
        actions.append(
            {
                "name": "preview_secondary_specialists",
                "status": "blocked" if urgency == "emergency" else "queued",
                "rationale": (
                    "Emergency handling stays first; secondary specialists are deferred."
                    if urgency == "emergency"
                    else "Run a bounded preview of secondary specialists so mixed patient requests are not lost."
                ),
                "details": {
                    "secondary_intents": secondary_intents,
                    "max_preview_calls": 2,
                    "side_effect_safe": True,
                },
            }
        )

    actions.append(
        {
            "name": "update_patient_memory",
            "status": "queued",
            "rationale": "Persist patient-provided context for safer follow-up turns.",
            "details": {},
        }
    )
    return actions


def classify_with_plan(
    user_input: str,
    memory: list[Message] | None = None,
    patient_profile: PatientProfile | None = None,
) -> CarePlan:
    text = user_input.strip()
    memory_messages = memory or []
    recent_context = " ".join(message["content"] for message in memory_messages[-4:])
    profile = patient_profile or {}

    alert_hits = _pattern_hits(EMERGENCY_PATTERNS, text, skip_negated=True)
    clinical_slots = _extract_clinical_slots(text, alert_hits, profile)
    measurement_flags = clinical_slots.get("measurement_flags", {})
    emergency_measurement_hits = (
        measurement_flags.get("emergency", []) if isinstance(measurement_flags, dict) else []
    )
    urgent_measurement_hits = (
        measurement_flags.get("urgent", []) if isinstance(measurement_flags, dict) else []
    )
    medication_hits = _unique([*_pattern_hits(MEDICATION_PATTERNS, text), *clinical_slots.get("medications", [])])
    scheduling_hits = _pattern_hits(SCHEDULING_PATTERNS, text)
    symptom_hits = _unique([*_pattern_hits(SYMPTOM_PATTERNS, text), *clinical_slots.get("symptoms", [])])

    route_scores: list[RouteScore] = []

    alert_evidence: list[str] = []
    _add_evidence(alert_evidence, "emergency signal", alert_hits)
    _add_evidence(alert_evidence, "emergency measurement", emergency_measurement_hits)
    _add_evidence(alert_evidence, "urgent measurement", urgent_measurement_hits)
    alert_score = _score_from_hits(0.0, [*alert_hits, *emergency_measurement_hits], 0.75)
    route_scores.append({"intent": "alert", "score": alert_score, "evidence": alert_evidence})

    pharmacy_evidence: list[str] = []
    _add_evidence(pharmacy_evidence, "medication signal", medication_hits)
    pharmacy_score = _score_from_hits(0.0, medication_hits, 0.45)
    if _matches(MEDICATION_PATTERNS, recent_context) and re.search(
        r"\b(it|that|this)\b", text, flags=re.IGNORECASE
    ):
        pharmacy_score += 0.3
        pharmacy_evidence.append("recent conversation was medication-related")
    if profile.get("medications") and re.search(r"\b(side effect|dose|refill|interaction|it|that)\b", text, flags=re.IGNORECASE):
        pharmacy_score += 0.15
        pharmacy_evidence.append("patient profile contains medication history")
    route_scores.append(
        {"intent": "pharmacy", "score": min(1.0, pharmacy_score), "evidence": pharmacy_evidence}
    )

    scheduling_evidence: list[str] = []
    _add_evidence(scheduling_evidence, "scheduling signal", scheduling_hits)
    scheduling_score = _score_from_hits(0.0, scheduling_hits, 0.55)
    if _matches(SCHEDULING_PATTERNS, recent_context) and re.search(
        r"\b(it|that|this|next|again)\b", text, flags=re.IGNORECASE
    ):
        scheduling_score += 0.25
        scheduling_evidence.append("recent conversation was appointment-related")
    route_scores.append(
        {"intent": "scheduling", "score": min(1.0, scheduling_score), "evidence": scheduling_evidence}
    )

    rag_evidence: list[str] = []
    _add_evidence(rag_evidence, "symptom or general-health signal", symptom_hits)
    rag_score = 0.28 if text else 0.0
    rag_score = _score_from_hits(rag_score, symptom_hits, 0.28)
    if profile.get("symptoms"):
        rag_score += 0.08
        rag_evidence.append("patient profile contains prior symptoms")
    route_scores.append({"intent": "rag", "score": min(1.0, rag_score), "evidence": rag_evidence})

    route_scores = sorted(route_scores, key=lambda route: route["score"], reverse=True)
    selected = route_scores[0]["intent"] if route_scores else "rag"
    if alert_score >= 0.75:
        selected = "alert"
    elif route_scores and route_scores[0]["score"] < 0.34:
        selected = "rag"

    urgency = _urgency_for(text, alert_hits, clinical_slots)
    missing_information = _missing_information(selected, urgency, clinical_slots, profile, text)
    confidence = next((route["score"] for route in route_scores if route["intent"] == selected), 0.4)
    selected_route = next((route for route in route_scores if route["intent"] == selected), None)
    secondary_intents = _secondary_intents(selected, urgency, route_scores)
    quality_gates, needs_clarification = _quality_gates(
        selected,
        urgency,
        route_scores,
        confidence,
        missing_information,
    )
    agent_actions = _agent_actions(
        selected,
        urgency,
        missing_information,
        quality_gates,
        clinical_slots,
        secondary_intents=secondary_intents,
        memory_count=len(memory_messages),
    )
    evidence = selected_route.get("evidence", []) if selected_route else []
    reasoning_trace = [
        f"Selected {selected} with confidence {confidence:.2f}.",
        f"Urgency level: {urgency}.",
    ]
    if evidence:
        reasoning_trace.extend(evidence)
    else:
        reasoning_trace.append("No high-risk or tool-specific signal was stronger than general health retrieval.")
    if clinical_slots:
        reasoning_trace.append("Extracted clinical slots: " + ", ".join(sorted(clinical_slots.keys())) + ".")
    if emergency_measurement_hits or urgent_measurement_hits:
        reasoning_trace.append(
            "Measurement-aware triage signals: "
            + ", ".join([*emergency_measurement_hits, *urgent_measurement_hits])
            + "."
        )
    if clinical_slots.get("negated_red_flags"):
        reasoning_trace.append(
            "Negated emergency phrases noted: " + ", ".join(clinical_slots["negated_red_flags"][:4]) + "."
        )
    if secondary_intents:
        secondary_reason = "deferred for emergency handling" if urgency == "emergency" else "queued for bounded preview"
        reasoning_trace.append(
            "Secondary routes " + secondary_reason + ": " + ", ".join(secondary_intents) + "."
        )
    if missing_information:
        reasoning_trace.append("Missing information: " + "; ".join(missing_information[:4]) + ".")
    blocked_gates = [gate["name"] for gate in quality_gates if gate.get("status") == "blocked"]
    if blocked_gates:
        reasoning_trace.append("Quality gates blocked: " + ", ".join(blocked_gates) + ".")
    elif quality_gates:
        reasoning_trace.append(
            "Quality gates: "
            + ", ".join(f"{gate['name']}={gate['status']}" for gate in quality_gates)
            + "."
        )
    profile_signal_count = sum(len(values or []) for values in profile.values() if isinstance(values, list))
    model_efficiency = {
        "routing_mode": "deterministic triage scoring",
        "route_count": len(route_scores),
        "secondary_intents": secondary_intents,
        "secondary_specialist_strategy": (
            "defer_for_emergency" if urgency == "emergency" else "preview_non_emergency"
        ),
        "memory_messages_available": len(memory_messages),
        "recent_messages_used": min(len(memory_messages), 4),
        "profile_signal_count": profile_signal_count,
        "planned_specialist_calls": 1 + (0 if urgency == "emergency" else len(secondary_intents)),
        "deferred_specialist_calls": len(secondary_intents) if urgency == "emergency" else 0,
        "clarification_first": needs_clarification,
        "clinical_slot_count": len(clinical_slots),
        "measurement_signal_count": len([*emergency_measurement_hits, *urgent_measurement_hits]),
        "negated_red_flag_count": len(clinical_slots.get("negated_red_flags", [])),
    }

    return {
        "selected_intent": selected,
        "secondary_intents": secondary_intents,
        "urgency_level": urgency,
        "route_scores": route_scores,
        "clinical_slots": clinical_slots,
        "reasoning_trace": reasoning_trace,
        "suggested_followups": _suggest_followups(selected, urgency),
        "missing_information": missing_information,
        "agent_actions": agent_actions,
        "quality_gates": quality_gates,
        "needs_clarification": needs_clarification,
        "profile_signals": profile,
        "confidence": confidence,
        "model_efficiency": model_efficiency,
    }


def classify_intent(user_input: str, memory: list[Message] | None = None) -> tuple[Intent, str]:
    plan = classify_with_plan(user_input, memory)
    intent = plan.get("selected_intent", "rag")
    trace = plan.get("reasoning_trace", [])
    reason = " ".join(trace) if trace else "The message is best handled as a general health question."
    return intent, reason
