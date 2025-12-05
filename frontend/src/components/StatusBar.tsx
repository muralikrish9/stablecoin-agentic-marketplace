/**
 * System status bar component
 */

import { SystemStatus } from '../services/api';

interface StatusBarProps {
  status: SystemStatus;
}

export default function StatusBar({ status }: StatusBarProps) {
  const getStatusClass = () => {
    if (status.status === 'healthy' && status.swarm_available) {
      return 'status-healthy';
    } else if (status.status === 'degraded') {
      return 'status-degraded';
    } else {
      return 'status-offline';
    }
  };

  const getStatusText = () => {
    if (status.status === 'healthy' && status.swarm_available) {
      return 'All Systems Operational';
    } else if (status.status === 'degraded') {
      return 'Degraded - Using Mock Mode';
    } else {
      return 'Backend Offline';
    }
  };

  return (
    <div className={`status-bar ${getStatusClass()}`}>
      <div className="status-indicator">
        <span className="status-dot"></span>
        <span className="status-text">{getStatusText()}</span>
      </div>
      <div className="status-info">
        <span className="status-item">
          🤖 {status.agents_count} Agents
        </span>
        <span className="status-item">
          {status.swarm_available ? '✓ Swarm Active' : '⚠ Mock Mode'}
        </span>
      </div>
    </div>
  );
}

