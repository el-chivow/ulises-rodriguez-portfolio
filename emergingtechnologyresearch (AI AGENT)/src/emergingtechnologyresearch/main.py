#!/usr/bin/env python
"""
Main entry point for running the Emerging Technology Research crew.
"""

import sys
import warnings

from dotenv import load_dotenv
load_dotenv()

from datetime import datetime
from contextlib import contextmanager

from langfuse import get_client
from openinference.instrumentation.crewai import CrewAIInstrumentor
from openinference.instrumentation.litellm import LiteLLMInstrumentor

from emergingtechnologyresearch.crew import EmergingTechnologyResearch

warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")

# -------------------------------------------------------------------
# Langfuse + Observability setup
# -------------------------------------------------------------------

langfuse = get_client()

CrewAIInstrumentor().instrument(skip_dep_check=True)
LiteLLMInstrumentor().instrument()

if langfuse.auth_check():
    print("Langfuse client is authenticated and ready!")
else:
    print("Authentication failed. Please check your credentials and host.")


# -------------------------------------------------------------------
# Langfuse context manager wrapper (FIX for generator issue)
# -------------------------------------------------------------------

@contextmanager
def langfuse_span(name: str):
    """
    Wrap Langfuse generator into a real context manager.
    """
    span = langfuse.start_as_current_span(name=name)
    try:
        yield span
    finally:
        pass


# -------------------------------------------------------------------
# Crew execution helpers
# -------------------------------------------------------------------

def run():
    """
    Run the crew.
    """
    inputs = {
        "topic": "AI LLMs",
        "current_year": str(datetime.now().year),
    }

    with langfuse_span("emerging-technology-research-trace"):
        try:
            EmergingTechnologyResearch().crew().kickoff(inputs=inputs)
        except Exception as e:
            raise RuntimeError(
                "An error occurred while running the crew"
            ) from e

    langfuse.flush()


def train():
    """
    Train the crew for a given number of iterations.
    """
    inputs = {
        "topic": "AI LLMs",
        "current_year": str(datetime.now().year),
    }

    try:
        EmergingTechnologyResearch().crew().train(
            n_iterations=int(sys.argv[1]),
            filename=sys.argv[2],
            inputs=inputs,
        )
    except Exception as e:
        raise RuntimeError(
            "An error occurred while training the crew"
        ) from e


def replay():
    """
    Replay the crew execution from a specific task.
    """
    try:
        EmergingTechnologyResearch().crew().replay(
            task_id=sys.argv[1]
        )
    except Exception as e:
        raise RuntimeError(
            "An error occurred while replaying the crew"
        ) from e


def test():
    """
    Test the crew execution and return the results.
    """
    inputs = {
        "topic": "AI LLMs",
        "current_year": str(datetime.now().year),
    }

    try:
        EmergingTechnologyResearch().crew().test(
            n_iterations=int(sys.argv[1]),
            eval_llm=sys.argv[2],
            inputs=inputs,
        )
    except Exception as e:
        raise RuntimeError(
            "An error occurred while testing the crew"
        ) from e


def run_with_trigger():
    """
    Run the crew with a trigger payload.
    """
    import json

    if len(sys.argv) < 2:
        raise ValueError(
            "No trigger payload provided. Please provide JSON payload as argument."
        )

    try:
        trigger_payload = json.loads(sys.argv[1])
    except json.JSONDecodeError as exc:
        raise ValueError(
            "Invalid JSON payload provided as argument"
        ) from exc

    inputs = {
        "crewai_trigger_payload": trigger_payload,
        "topic": "",
        "current_year": "",
    }

    try:
        return EmergingTechnologyResearch().crew().kickoff(inputs=inputs)
    except Exception as e:
        raise RuntimeError(
            "An error occurred while running the crew with trigger"
        ) from e