"""
Base agent configuration and utilities
Following Strands Agents SDK patterns and best practices
"""

from strands import Agent, tool
from strands.models import BedrockModel
import os
import logging
from typing import Optional, Dict, Any

# Configure Strands logging as recommended
logging.getLogger("strands").setLevel(logging.INFO)
logging.basicConfig(
    format="%(levelname)s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler()]
)

logger = logging.getLogger(__name__)


class BaseAgentConfig:
    """Base configuration for all CodeCollab agents following Strands patterns"""

    # Model configuration - using Claude 3.5 Sonnet (compatible with on-demand)
    MODEL_ID = "us.anthropic.claude-3-5-sonnet-20241022-v2:0"
    REGION = "us-west-2"
    TEMPERATURE = 0.3
    MAX_TOKENS = 4096

    # Agent behavior
    TIMEOUT_SECONDS = 300
    MAX_RETRIES = 3

    @staticmethod
    def create_model() -> BedrockModel:
        """Create configured Bedrock model following Strands patterns"""
        return BedrockModel(
            model_id=BaseAgentConfig.MODEL_ID,
            region_name=BaseAgentConfig.REGION,
            temperature=BaseAgentConfig.TEMPERATURE,
            max_tokens=BaseAgentConfig.MAX_TOKENS
        )

    @staticmethod
    def create_simple_agent(system_prompt: str, tools: list = None) -> Agent:
        """Create a simple Strands agent with default configuration"""
        return Agent(
            system_prompt=system_prompt,
            model=BaseAgentConfig.create_model(),
            tools=tools or []
        )


class BaseCodeCollabAgent:
    """Base class for all CodeCollab agents"""

    def __init__(self, name: str, system_prompt: str, tools: list = None):
        """
        Initialize base agent

        Args:
            name: Agent name
            system_prompt: System prompt defining agent behavior
            tools: List of tools available to agent
        """
        self.name = name
        self.system_prompt = system_prompt
        self.tools = tools or []

        # Create underlying Strands agent
        self.agent = Agent(
            name=name,
            model=BaseAgentConfig.create_model(),
            system_prompt=system_prompt,
            tools=self.tools
        )

        logger.info(f"Initialized {name} with {len(self.tools)} tools")

    def __call__(self, prompt: str) -> Dict[str, Any]:
        """
        Execute agent with given prompt

        Args:
            prompt: User input/task description

        Returns:
            Dict containing:
                - message: Agent response
                - tokens: Token usage
                - latency_ms: Response time
                - success: Boolean success indicator
        """
        try:
            result = self.agent(prompt)

            # Extract metrics safely
            tokens = 0
            latency_ms = 0

            if hasattr(result, 'metrics'):
                # Try different attribute names for token count
                if hasattr(result.metrics, 'total_tokens'):
                    tokens = result.metrics.total_tokens
                elif hasattr(result.metrics, 'token_count'):
                    tokens = result.metrics.token_count
                elif hasattr(result.metrics, 'usage'):
                    tokens = result.metrics.usage.get('total_tokens', 0)

                # Try different attribute names for latency
                if hasattr(result.metrics, 'total_latency_ms'):
                    latency_ms = result.metrics.total_latency_ms
                elif hasattr(result.metrics, 'latency_ms'):
                    latency_ms = result.metrics.latency_ms
                elif hasattr(result.metrics, 'latency'):
                    latency_ms = result.metrics.latency

            return {
                "message": result.message,
                "tokens": tokens,
                "latency_ms": latency_ms,
                "success": True,
                "agent_name": self.name
            }
        except Exception as e:
            logger.error(f"{self.name} execution failed: {e}")
            return {
                "message": f"Error in {self.name}: {str(e)}",
                "tokens": 0,
                "latency_ms": 0,
                "success": False,
                "agent_name": self.name,
                "error": str(e)
            }

    async def stream_async(self, prompt: str):
        """
        Stream agent response asynchronously

        Args:
            prompt: User input

        Yields:
            Stream events from agent execution
        """
        async for event in self.agent.stream_async(prompt):
            yield event