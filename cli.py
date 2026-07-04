from __future__ import annotations

import argparse

from .graph import run_healthcare_turn


def main() -> None:
    parser = argparse.ArgumentParser(description="Run one Healthcare Agent turn.")
    parser.add_argument("message", help="Patient message to route through the agent")
    parser.add_argument("--patient-id", default="demo-patient", help="Patient memory identifier")
    parser.add_argument("--langgraph", action="store_true", help="Use LangGraph if installed")
    args = parser.parse_args()

    result = run_healthcare_turn(
        args.message,
        patient_id=args.patient_id,
        prefer_langgraph=args.langgraph,
    )
    print(result["safe_response"])
    print()
    print(f"Intent: {result['intent']}")
    print(result.get("intent_reason", ""))


if __name__ == "__main__":
    main()
