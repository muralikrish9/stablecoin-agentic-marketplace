"""
CodeCollab Agents Package
Strands-based multi-agent system for autonomous development
"""

from .swarm_orchestrator import CodeCollabSwarm, CodeCollabSwarmTool

__all__ = [
    'CodeCollabSwarm',
    'CodeCollabSwarmTool'
]

__version__ = '2.0.0'  # Updated to reflect Swarm pattern implementation
