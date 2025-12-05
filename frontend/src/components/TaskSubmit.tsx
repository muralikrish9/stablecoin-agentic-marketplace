/**
 * Task submission form component
 */

import { useState } from 'react';

interface TaskSubmitProps {
  onTaskSubmitted: (description: string, githubUrl?: string, requirements?: string) => Promise<void>;
  isProcessing?: boolean;
}

export default function TaskSubmit({ onTaskSubmitted, isProcessing = false }: TaskSubmitProps) {
  const [taskDescription, setTaskDescription] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [requirements, setRequirements] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskDescription.trim()) {
      return;
    }

    try {
      await onTaskSubmitted(taskDescription, githubUrl, requirements);
      // Clear form on success
      setTaskDescription('');
      setGithubUrl('');
      setRequirements('');
      setShowAdvanced(false);
    } catch (error) {
      console.error('Task submission failed:', error);
    }
  };

  return (
    <div className="task-submit-card">
      <h2>📝 Submit Any Task</h2>
      <p className="task-subtitle">Describe your development task and let AI agents handle it</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="task">Task Description *</label>
          <textarea
            id="task"
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="e.g., Create a function to calculate factorial recursively"
            rows={4}
            disabled={isProcessing}
            required
          />
        </div>

        <button
          type="button"
          className="toggle-advanced"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? '▼' : '▶'} Advanced Options
        </button>

        {showAdvanced && (
          <div className="advanced-options">
            <div className="form-group">
              <label htmlFor="github">GitHub Repository URL (optional)</label>
              <input
                id="github"
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
                disabled={isProcessing}
              />
            </div>

            <div className="form-group">
              <label htmlFor="requirements">Additional Requirements (optional)</label>
              <textarea
                id="requirements"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Any specific requirements, constraints, or preferences..."
                rows={3}
                disabled={isProcessing}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          className="submit-button"
          disabled={!taskDescription.trim() || isProcessing}
        >
          {isProcessing ? '⏳ Processing...' : '🚀 Process Task'}
        </button>
      </form>

      <div className="task-examples">
        <p className="examples-title">💡 Example Tasks:</p>
        <ul>
          <li>Create a binary search algorithm in Python</li>
          <li>Write a REST API endpoint for user authentication</li>
          <li>Implement a React component for displaying a todo list</li>
          <li>Add input validation to a user registration form</li>
        </ul>
      </div>
    </div>
  );
}

