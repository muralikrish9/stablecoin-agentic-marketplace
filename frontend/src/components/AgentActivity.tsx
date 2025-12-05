/**
 * Agent activity display showing real-time agent progress
 */

import { useMemo } from 'react';

export interface AgentState {
  name: string;
  backendName: string;
  status: 'idle' | 'working' | 'completed' | 'error';
  activity: string;
  progress: number;
  icon?: string;
}

interface AgentActivityProps {
  agents: AgentState[];
}

export default function AgentActivity({ agents }: AgentActivityProps) {
  const agentIcons: Record<string, string> = useMemo(() => ({
    'RequirementsAgent': '📋',
    'requirements_agent': '📋',
    'ContextAgent': '🔍',
    'context_agent': '🔍',
    'BuilderAgent': '🔨',
    'builder_agent': '🔨',
    'QualityAgent': '✅',
    'quality_agent': '✅',
    'EscalationAgent': '🎯',
    'escalation_agent': '🎯',
  }), []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'status-working';
      case 'completed':
        return 'status-completed';
      case 'error':
        return 'status-error';
      default:
        return 'status-idle';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return '⚙️';
      case 'completed':
        return '✓';
      case 'error':
        return '✗';
      default:
        return '○';
    }
  };

  return (
    <div className="agent-activity-card">
      <h2>🤖 Agent Activity</h2>
      <p className="agent-subtitle">Multi-agent swarm collaboration in progress</p>
      
      <div className="agents-list">
        {agents.map((agent) => (
          <div key={agent.name} className={`agent-item ${getStatusColor(agent.status)}`}>
            <div className="agent-header">
              <div className="agent-name">
                <span className="agent-icon">{agentIcons[agent.name] || agentIcons[agent.backendName] || '🤖'}</span>
                <span className="agent-label">{agent.name}</span>
              </div>
              <span className="agent-status-icon">{getStatusIcon(agent.status)}</span>
            </div>
            
            <div className="agent-activity">
              <span className="activity-text">{agent.activity}</span>
            </div>
            
            {agent.status === 'working' && (
              <div className="agent-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${agent.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="agent-info">
        <p>💡 <strong>How it works:</strong> Each agent specializes in a specific task - from analyzing requirements to writing code to ensuring quality. They collaborate by passing context and building upon each other's work.</p>
      </div>
    </div>
  );
}

