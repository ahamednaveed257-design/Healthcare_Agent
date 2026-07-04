from __future__ import annotations

from typing import Any, Literal, TypedDict


Intent = Literal["rag", "pharmacy", "scheduling", "alert"]
UrgencyLevel = Literal["routine", "watch", "urgent", "emergency"]
ActionStatus = Literal["queued", "completed", "blocked"]
WorkflowStepStatus = Literal["completed", "blocked"]
QualityGateStatus = Literal["passed", "watch", "blocked"]


class Message(TypedDict):
    role: Literal["patient", "assistant", "system"]
    content: str


class RouteScore(TypedDict):
    intent: Intent
    score: float
    evidence: list[str]


class PatientProfile(TypedDict, total=False):
    symptoms: list[str]
    medications: list[str]
    conditions: list[str]
    preferences: list[str]


class ClinicalSlots(TypedDict, total=False):
    symptoms: list[str]
    medications: list[str]
    risk_factors: list[str]
    age_group: str
    duration: str
    severity: str
    dose: str
    appointment_time: str
    appointment_reason: str
    red_flags: list[str]
    negated_red_flags: list[str]
    measurements: dict[str, Any]
    measurement_flags: dict[str, list[str]]


class AgentAction(TypedDict, total=False):
    name: str
    status: ActionStatus
    rationale: str
    details: dict[str, Any]


class QualityGate(TypedDict, total=False):
    name: str
    status: QualityGateStatus
    reason: str
    details: dict[str, Any]


class WorkflowStep(TypedDict, total=False):
    step: int
    name: str
    status: WorkflowStepStatus
    summary: str


class CarePlan(TypedDict, total=False):
    selected_intent: Intent
    secondary_intents: list[Intent]
    urgency_level: UrgencyLevel
    route_scores: list[RouteScore]
    clinical_slots: ClinicalSlots
    reasoning_trace: list[str]
    suggested_followups: list[str]
    missing_information: list[str]
    agent_actions: list[AgentAction]
    quality_gates: list[QualityGate]
    needs_clarification: bool
    secondary_outputs: list[dict[str, Any]]
    handoff_packet: dict[str, Any]
    profile_signals: PatientProfile
    confidence: float
    model_efficiency: dict[str, Any]


class AgentState(TypedDict, total=False):
    patient_id: str
    user_input: str
    memory: list[Message]
    patient_profile: PatientProfile
    care_plan: CarePlan
    intent: Intent
    secondary_intents: list[Intent]
    intent_reason: str
    urgency_level: UrgencyLevel
    route_scores: list[RouteScore]
    clinical_slots: ClinicalSlots
    reasoning_trace: list[str]
    suggested_followups: list[str]
    missing_information: list[str]
    agent_actions: list[AgentAction]
    quality_gates: list[QualityGate]
    needs_clarification: bool
    model_efficiency: dict[str, Any]
    specialist_mode: str
    specialist_output: dict[str, Any]
    secondary_outputs: list[dict[str, Any]]
    synthesized_response: str
    safe_response: str
    safety_flags: list[str]
    workflow_trace: list[WorkflowStep]
    governance_card: dict[str, Any]
    handoff_packet: dict[str, Any]
    alerts: list[dict[str, Any]]
    appointment: dict[str, Any] | None
