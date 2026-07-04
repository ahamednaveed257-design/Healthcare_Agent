# Deep Research: Healthcare Agentic Model Improvements

## Research Inputs

This improvement pass used current guidance and evidence from:

- WHO guidance on ethics and governance of large multi-modal models in health.
- NIST AI Risk Management Framework and Generative AI Profile.
- FDA AI-enabled Software as a Medical Device lifecycle guidance pages.
- ONC HTI-1 decision support intervention transparency source attributes.
- AHRQ PSNet patient-safety AI resources.
- PLOS Digital Health systematic review on RAG in healthcare.
- CDC stroke and heart attack emergency guidance.
- MedlinePlus / National Library of Medicine patient health and medication content.

## Design Implications

1. The agent should declare its intended use and decision role.
   - Implemented with `governance_card.intended_use` and `decision_role`.
   - The role is explicitly educational and augmenting, never replacing clinical judgment.

2. The agent should expose source quality.
   - Implemented trusted-source detection for CDC, FDA, HealthIT.gov, MedlinePlus, NIH/NLM, and WHO domains.
   - RAG output now carries structured source objects instead of plain titles where available.

3. The agent should support handoff decisions.
   - Implemented handoff levels: emergency, prompt clinician contact, pharmacist/prescriber, clinician review, and routine.
   - Emergency route still overrides all other paths.

4. The agent should broaden high-risk symptom detection.
   - Added stroke-style BE FAST signals: balance, eye/vision changes, face drooping, arm weakness, speech difficulty, sudden severe headache.
   - Added heart attack-style signals: chest pressure/tightness/discomfort with jaw, neck, back, arm, shoulder pain, shortness of breath, cold sweat, nausea, or lightheadedness.

5. The agent should make limitations visible.
   - Backend responses now include a governance card with limitations and risk controls.
   - The installable web app now shows a Research Guardrails panel and includes the card in exported care plans.

6. The agent should keep auditable traces.
   - The existing 8-step workflow trace remains the main operational audit record.
   - Governance metadata is saved alongside memory metadata for each turn.

## Current Production Readiness

This project is still a demo and education system. Before production use, add:

- Clinician-reviewed medical content and a content update process.
- Authentication, consent, and encrypted PHI-safe storage.
- Human review workflows for urgent, low-confidence, and medication-specific cases.
- Prospective evaluation on representative patient inputs.
- Bias, fairness, and subgroup performance checks.
- Monitoring for route errors, stale sources, and harmful-output attempts.
- Formal change-control documentation for future model/routing updates.

## Files Updated

- `healthcare_agent/governance.py`
- `healthcare_agent/graph.py`
- `healthcare_agent/specialists.py`
- `healthcare_agent/classifier.py`
- `healthcare_agent/memory.py`
- `healthcare_agent/state.py`
- `streamlit_app.py`
- `web/app.js`
- `web/app.css`
- `web/index.html`
- `tests/test_agent_flow.py`
