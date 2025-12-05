/**
 * API service for communicating with Python backend (simple_api_server.py)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface AgentOutput {
  response?: string;
  context?: any;
  handoff_message?: string;
}

export interface PaymentBreakdown {
  base_price: number;
  complexity: string;
  quality_score: number;
  quality_tier: string;
  quality_multiplier: number;
  execution_time_sec: number;
  time_tier: string;
  time_multiplier: number;
  token_cost: number;
  tokens_used: number;
  code_lines: number;
}

export interface PaymentInfo {
  amount: number;
  currency: string;
  breakdown: PaymentBreakdown;
}

export interface TaskResult {
  success: boolean;
  task_description: string;
  github_url?: string;
  requirements?: string;
  agent_sequence: string[];
  agent_outputs?: Record<string, AgentOutput>;
  final_result?: string;
  code?: string;
  final_decision: string;
  execution_time_ms: number;
  tokens_used?: number;
  total_tokens?: number;
  payment?: PaymentInfo;
  error?: string;
}

export interface SystemStatus {
  status: string;
  swarm_available: boolean;
  agents_count: number;
  timestamp?: string;
  version?: string;
}

export interface Agent {
  name: string;
  icon: string;
  description: string;
  status: string;
}

/**
 * Check backend health status
 */
export async function getSystemStatus(): Promise<SystemStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to get system status:', error);
    throw new Error('Backend server is not available. Please start simple_api_server.py');
  }
}

/**
 * Get list of available agents
 */
export async function getAgents(): Promise<Agent[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/agents`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to get agents:', error);
    return [];
  }
}

/**
 * Process a coding task with the agent swarm
 */
export async function processTask(
  taskDescription: string,
  githubUrl: string = '',
  requirements: string = ''
): Promise<TaskResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: taskDescription,
        github_url: githubUrl,
        requirements: requirements,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to process task:', error);
    throw error;
  }
}

/**
 * Get task history
 */
export async function getTaskHistory(): Promise<TaskResult[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/history`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to get task history:', error);
    return [];
  }
}

/**
 * Clear task history
 */
export async function clearHistory(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clear`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to clear history:', error);
    throw error;
  }
}

