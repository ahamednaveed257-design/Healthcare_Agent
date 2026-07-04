from __future__ import annotations

import streamlit as st

from healthcare_agent import run_healthcare_turn


st.set_page_config(page_title="Healthcare Agent", page_icon="+", layout="centered")

st.title("Healthcare Agent")

with st.sidebar:
    patient_id = st.text_input("Patient ID", value="demo-patient")
    st.caption("Demo mode uses local memory and sample healthcare data.")
    if st.button("Clear chat view"):
        st.session_state.messages = []
        st.rerun()

if "messages" not in st.session_state:
    st.session_state.messages = []

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.write(message["content"])

prompt = st.chat_input("Type a symptom, medication question, or appointment request")
if prompt:
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.write(prompt)

    with st.chat_message("assistant"):
        with st.spinner("Checking the right care path..."):
            result = run_healthcare_turn(prompt, patient_id=patient_id)
        st.write(result["safe_response"])

        with st.expander("Routing details"):
            st.write(f"Intent: {result['intent']}")
            st.write(f"Urgency: {result.get('urgency_level', 'routine')}")
            st.write(result.get("intent_reason", ""))
            if result.get("route_scores"):
                st.write("Route scores")
                st.json(result["route_scores"])
            if result.get("clinical_slots"):
                st.write("Extracted context")
                st.json(result["clinical_slots"])
            if result.get("missing_information"):
                st.write("Still needed")
                st.write(result["missing_information"])
            if result.get("agent_actions"):
                st.write("Agent actions")
                st.json(result["agent_actions"])
            if result.get("workflow_trace"):
                st.write("Workflow trace")
                st.json(result["workflow_trace"])
            if result.get("governance_card"):
                st.write("Governance card")
                st.json(result["governance_card"])
            if result.get("safety_flags"):
                st.write("Safety flags: " + ", ".join(result["safety_flags"]))

    st.session_state.messages.append({"role": "assistant", "content": result["safe_response"]})
