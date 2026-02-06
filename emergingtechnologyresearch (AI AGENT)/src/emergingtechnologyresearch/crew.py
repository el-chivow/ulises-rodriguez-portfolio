"""
Crew for researching and reporting on emerging technologies.
"""

from typing import List, Dict, Any, cast

from crewai import Agent, Crew, Process, Task, LLM
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from pydantic import BaseModel, Field


# =========================
# LLM CONFIG (AWS BEDROCK)
# =========================

bedrock_llm = LLM(
    model="bedrock/us.amazon.nova-pro-v1:0",
    provider="litellm",  
    temperature=0.2,
)


# =========================
# Pydantic Output Models
# =========================

class Section(BaseModel):
    """A section of the research report."""

    topic: str = Field(description="Title of the section")
    overview: str = Field(description="Overview of the topic")
    keyDevelopments: List[str] = Field(description="Key developments in the topic")
    impact: str = Field(description="Impact in the world because of the topic")


class ResearchReport(BaseModel):
    """Full research report."""

    sections: List[Section] = Field(
        description="List of sections together forming a report"
    )


# =========================
# Crew Definition
# =========================

@CrewBase
class EmergingTechnologyResearch:
    """Emerging Technology Research Crew."""

    # CrewAI loads these YAMLs as dicts at runtime
    agents_config: Dict[str, Any] = "config/agents.yaml"
    tasks_config: Dict[str, Any] = "config/tasks.yaml"

    agents: List[BaseAgent]
    tasks: List[Task]

    # =========================
    # Agents
    # =========================

    @agent
    def researcher(self) -> Agent:
        """Researcher agent."""
        agents_cfg = cast(Dict[str, Any], self.agents_config)
        return Agent(
            config=agents_cfg["researcher"],
            llm=bedrock_llm,   # 👈 FUERZA BEDROCK
            verbose=True,
        )

    @agent
    def reporting_analyst(self) -> Agent:
        """Reporting analyst agent."""
        agents_cfg = cast(Dict[str, Any], self.agents_config)
        return Agent(
            config=agents_cfg["reporting_analyst"],
            llm=bedrock_llm,   # 👈 FUERZA BEDROCK
            verbose=True,
        )

    # =========================
    # Tasks
    # =========================

    @task
    def research_task(self) -> Task:
        """Research task."""
        tasks_cfg = cast(Dict[str, Any], self.tasks_config)
        return Task(
            config=tasks_cfg["research_task"],
        )

    @task
    def reporting_task(self) -> Task:
        """Reporting task."""
        tasks_cfg = cast(Dict[str, Any], self.tasks_config)
        return Task(
            config=tasks_cfg["reporting_task"],
            output_file="report.json",
            output_json=ResearchReport,
        )

    # =========================
    # Crew
    # =========================

    @crew
    def crew(self) -> Crew:
        """Creates the Emerging Technology Research crew."""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
            name="Emerging Technology Research Crew", 
            description="Crew for researching and reporting on emerging technologies.",
        )
    