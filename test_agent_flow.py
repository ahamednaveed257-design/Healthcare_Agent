from __future__ import annotations

import shutil
from pathlib import Path

from healthcare_agent.config import settings
from healthcare_agent.graph import HealthcareAgent, HealthcareWorkflow
from healthcare_agent.memory import LocalJsonMemoryStore
from healthcare_agent.safety import apply_safety_guardrails


def _workflow(tmp_path: Path) -> HealthcareWorkflow:
    data_dir = tmp_path / "data"
    shutil.copytree(settings.data_dir, data_dir)
    memory = LocalJsonMemoryStore(memory_dir=tmp_path / "memory")
    return HealthcareWorkflow(memory_store=memory, data_dir=data_dir)


def test_general_question_routes_to_rag(tmp_path: Path) -> None:
    result = _workflow(tmp_path).invoke(
        {"patient_id": "test-patient", "user_input": "I have a headache"}
    )
    assert result["intent"] == "rag"
    assert "general information" in result["safe_response"].lower()


def test_healthcare_agent_facade_handles_simple_turn(tmp_path: Path) -> None:
    data_dir = tmp_path / "data"
    shutil.copytree(settings.data_dir, data_dir)
    agent = HealthcareAgent(
        patient_id="facade-patient",
        memory_store=LocalJsonMemoryStore(memory_dir=tmp_path / "memory"),
        data_dir=data_dir,
    )

    result = agent.handle("I have a headache")

    assert result["intent"] == "rag"
    assert result["patient_id"] == "facade-patient"


def test_medication_question_routes_to_pharmacy(tmp_path: Path) -> None:
    result = _workflow(tmp_path).invoke(
        {"patient_id": "test-patient", "user_input": "What are ibuprofen side effects?"}
    )
    assert result["intent"] == "pharmacy"
    assert "ibuprofen" in result["safe_response"].lower()
    assert "label or by your prescriber" in result["safe_response"].lower()


def test_scheduling_question_routes_to_scheduler(tmp_path: Path) -> None:
    result = _workflow(tmp_path).invoke(
        {"patient_id": "demo-patient", "user_input": "When is my next appointment?"}
    )
    assert result["intent"] == "scheduling"
    assert "dr. patel" in result["safe_response"].lower()


def test_emergency_routes_to_alert(tmp_path: Path) -> None:
    result = _workflow(tmp_path).invoke(
        {"patient_id": "test-patient", "user_input": "I have chest pain and cannot breathe"}
    )
    assert result["intent"] == "alert"
    assert "emergency" in result["safe_response"].lower()
    assert "emergency_escalation" in result["safety_flags"]
    packet = result["governance_card"]["handoff_packet"]
    assert packet["handoff_level"] == "emergency"
    assert "Call emergency services now" in packet["next_best_action"]


def test_stroke_warning_language_routes_to_alert(tmp_path: Path) -> None:
    result = _workflow(tmp_path).invoke(
        {"patient_id": "test-patient", "user_input": "My face is drooping and one arm is weak"}
    )
    assert result["intent"] == "alert"
    assert result["governance_card"]["handoff"]["level"] == "emergency"


def test_chest_tightness_with_sweating_routes_to_alert(tmp_path: Path) -> None:
    result = _workflow(tmp_path).invoke(
        {
            "patient_id": "test-patient",
            "user_input": "My chest feels tight and I am sweating and nauseous",
        }
    )
    assert result["intent"] == "alert"
    assert result["urgency_level"] == "emergency"
    assert "emergency_escalation" in result["safety_flags"]


def test_negated_emergency_terms_do_not_trigger_alert(tmp_path: Path) -> None:
    result = _workflow(tmp_path).invoke(
        {
            "patient_id": "test-patient",
            "user_input": "I do not have chest pain or trouble breathing, just a mild headache",
        }
    )
    assert result["intent"] == "rag"
    assert result["urgency_level"] == "routine"
    assert "chest pain" in result["clinical_slots"]["negated_red_flags"]
    assert "emergency_escalation" not in result["safety_flags"]


def test_low_oxygen_measurement_routes_to_alert(tmp_path: Path) -> None:
    result = _workflow(tmp_path).invoke(
        {"patient_id": "test-patient", "user_input": "My oxygen is 88"}
    )
    assert result["intent"] == "alert"
    assert result["urgency_level"] == "emergency"
    assert result["clinical_slots"]["measurements"]["oxygen_saturation"] == 88
    assert "oxygen saturation 88%" in result["clinical_slots"]["measurement_flags"]["emergency"]


def test_high_fever_measurement_adds_urgent_triage(tmp_path: Path) -> None:
    result = _workflow(tmp_path).invoke(
        {"patient_id": "test-patient", "user_input": "My temperature is 103.6 and I have a cough"}
    )
    assert result["intent"] == "rag"
    assert result["urgency_level"] == "urgent"
    assert result["clinical_slots"]["measurements"]["temperature_f"] == 103.6
    assert "temperature 103.6f" in result["clinical_slots"]["measurement_flags"]["urgent"]
    assert "urgent_symptom_watch_added" in result["safety_flags"]


def test_large_pill_ingestion_routes_to_alert_and_tracks_pharmacy(tmp_path: Path) -> None:
    result = _workflow(tmp_path).invoke(
        {
            "patient_id": "test-patient",
            "user_input": "I swallowed 12 ibuprofen pills",
        }
    )
    assert result["intent"] == "alert"
    assert result["urgency_level"] == "emergency"
    assert "pharmacy" in result["secondary_intents"]
    assert result.get("secondary_outputs", []) == []
    actions = {action["name"]: action for action in result["agent_actions"]}
    assert actions["track_secondary_routes"]["status"] == "blocked"
    assert actions["preview_secondary_specialists"]["status"] == "blocked"


def test_memory_is_updated(tmp_path: Path) -> None:
    workflow = _workflow(tmp_path)
    workflow.invoke({"patient_id": "test-patient", "user_input": "I have a headache"})
    result = workflow.invoke({"patient_id": "test-patient", "user_input": "What about fever?"})
    assert len(result["memory"]) >= 4


def test_care_plan_metadata_is_returned(tmp_path: Path) -> None:
    result = _workflow(tmp_path).invoke(
        {"patient_id": "test-patient", "user_input": "I have had a headache for two days"}
    )
    assert result["care_plan"]["selected_intent"] == "rag"
    assert result["urgency_level"] == "watch"
    assert result["route_scores"]
    assert result["clinical_slots"]["symptoms"] == ["headache"]
    assert result["clinical_slots"]["duration"] == "two days"
    assert result["reasoning_trace"]
    assert result["suggested_followups"]
    assert result["missing_information"] == ["Current severity"]
    assert result["agent_actions"]
    assert any(action["name"] == "build_triage_context_packet" for action in result["agent_actions"])
    assert result["quality_gates"]
    assert result["needs_clarification"] is False
    assert result["model_efficiency"]["planned_specialist_calls"] == 1
    assert result["model_efficiency"]["clinical_slot_count"] >= 2
    assert result["governance_card"]["model_efficiency"]["routing_mode"] == "deterministic triage scoring"
    packet = result["governance_card"]["handoff_packet"]
    assert packet["primary_agent"] == "RAG Agent"
    assert any("Symptoms: headache" in fact for fact in packet["known_facts"])
    assert packet["next_best_action"]


def test_profile_memory_supports_medication_followup(tmp_path: Path) -> None:
    workflow = _workflow(tmp_path)
    workflow.invoke({"patient_id": "test-patient", "user_input": "I take metformin"})
    result = workflow.invoke({"patient_id": "test-patient", "user_input": "What about it?"})
    assert result["intent"] == "pharmacy"
    assert "metformin" in result["patient_profile"]["medications"]
    assert result["clinical_slots"]["medications"] == ["metformin"]
    assert "metformin" in result["safe_response"].lower()


def test_agent_actions_record_completed_specialist_and_memory(tmp_path: Path) -> None:
    result = _workflow(tmp_path).invoke(
        {"patient_id": "test-patient", "user_input": "What are ibuprofen side effects?"}
    )
    actions = {action["name"]: action["status"] for action in result["agent_actions"]}
    assert actions["parse_patient_context"] == "completed"
    assert actions["screen_for_emergency"] == "completed"
    assert actions["quality_gate_review"] == "completed"
    assert actions["consult_pharmacy_agent"] == "completed"
    assert actions["update_patient_memory"] == "completed"


def test_workflow_trace_follows_requested_loop(tmp_path: Path) -> None:
    workflow = _workflow(tmp_path)
    result = workflow.invoke(
        {"patient_id": "test-patient", "user_input": "What are ibuprofen side effects?"}
    )

    assert [step["name"] for step in result["workflow_trace"]] == [
        "patient_input",
        "load_memory",
        "intent_classifier",
        "specialist_agent",
        "response_synthesizer",
        "safety_guardrails",
        "patient_reply",
        "update_memory",
    ]
    assert result["workflow_trace"][1]["summary"].startswith("Loaded 0 previous")

    payload = workflow.memory_store.load_payload("test-patient")
    assert payload["metadata"]["workflow_trace"][-1]["name"] == "update_memory"


def test_governance_card_tracks_source_quality_and_decision_role(tmp_path: Path) -> None:
    result = _workflow(tmp_path).invoke(
        {"patient_id": "test-patient", "user_input": "I have had a headache for two days"}
    )
    card = result["governance_card"]
    assert card["source_quality"] == "trusted"
    assert "does not replace clinical judgment" in card["decision_role"]
    assert card["handoff"]["level"] in {"routine", "prompt_clinician_contact", "clinician_review"}


def test_safety_removes_unsafe_medication_instructions() -> None:
    safe_response, flags = apply_safety_guardrails(
        {
            "intent": "pharmacy",
            "urgency_level": "routine",
            "user_input": "Can I change my medication dose?",
            "synthesized_response": "Double your dose tonight. This medicine can cause nausea.",
        }
    )

    assert "double your dose" not in safe_response.lower()
    assert "prescriber or pharmacist" in safe_response.lower()
    assert "unsafe_medication_instruction_removed" in flags


def test_scheduling_request_requires_missing_details(tmp_path: Path) -> None:
    result = _workflow(tmp_path).invoke(
        {"patient_id": "test-patient", "user_input": "Schedule an appointment"}
    )
    assert result["intent"] == "scheduling"
    assert result["appointment"] is None
    assert "Preferred appointment day or time" in result["missing_information"]
    assert "Reason for the appointment" in result["missing_information"]
    assert result["needs_clarification"] is True
    assert any(gate["name"] == "missing_scheduling_details" for gate in result["quality_gates"])
    assert "still need" in result["safe_response"].lower()


def test_quality_gate_blocks_low_confidence_vague_input(tmp_path: Path) -> None:
    result = _workflow(tmp_path).invoke(
        {"patient_id": "test-patient", "user_input": "I do not feel good"}
    )
    assert result["intent"] == "rag"
    assert result["needs_clarification"] is True
    assert any(gate["name"] == "low_route_confidence" for gate in result["quality_gates"])
    assert "need a little more detail" in result["safe_response"].lower()
    assert result["governance_card"]["handoff"]["level"] == "clinician_review"


def test_pharmacy_uses_risk_factors_for_caution_and_handoff(tmp_path: Path) -> None:
    result = _workflow(tmp_path).invoke(
        {
            "patient_id": "test-patient",
            "user_input": "I have kidney disease. What are ibuprofen side effects?",
        }
    )
    assert result["intent"] == "pharmacy"
    assert "kidney disease" in result["clinical_slots"]["risk_factors"]
    assert "higher-risk medicine" in result["safe_response"]
    assert result["governance_card"]["handoff"]["level"] == "pharmacist_or_prescriber"


def test_mixed_pharmacy_and_scheduling_tracks_secondary_route(tmp_path: Path) -> None:
    result = _workflow(tmp_path).invoke(
        {
            "patient_id": "test-patient",
            "user_input": "I have a medication question about ibuprofen side effects and schedule an appointment next week for pain",
        }
    )
    assert result["intent"] == "pharmacy"
    assert "scheduling" in result["secondary_intents"]
    assert result["secondary_outputs"][0]["intent"] == "scheduling"
    assert result["secondary_outputs"][0]["status"] == "previewed"
    assert "Appointment drafted" in result["secondary_outputs"][0]["summary"]
    assert "appointment need" in result["safe_response"]
    assert result["governance_card"]["secondary_intents"] == ["scheduling"]
    assert result["governance_card"]["secondary_outputs"][0]["intent"] == "scheduling"
    assert result["governance_card"]["handoff_packet"]["secondary_work"][0]["intent"] == "scheduling"
    assert result["model_efficiency"]["planned_specialist_calls"] == 2


def test_rag_retrieval_uses_memory_for_short_followup(tmp_path: Path) -> None:
    workflow = _workflow(tmp_path)
    workflow.invoke({"patient_id": "test-patient", "user_input": "I have a headache"})
    result = workflow.invoke({"patient_id": "test-patient", "user_input": "What about it?"})
    assert result["intent"] == "rag"
    assert result["specialist_output"]["matched_topic"] == "Headache Self-Care"
    assert "headache" in result["safe_response"].lower()
