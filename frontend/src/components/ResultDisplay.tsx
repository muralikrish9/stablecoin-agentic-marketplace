/**
 * Result display component showing generated code, payment info, and outputs
 */

import { useState } from 'react';
import { TaskResult } from '../services/api';

interface ResultDisplayProps {
  result: TaskResult | null;
  onPaymentComplete?: (transactionHash: string) => void;
}

export default function ResultDisplay({ result }: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const handleCopy = async () => {
    if (result.code) {
      try {
        await navigator.clipboard.writeText(result.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const formatFinalMessage = (text: string | undefined) => {
    if (!text || typeof text !== 'string') return '';
    // Remove markdown code blocks since they're shown separately
    let formatted = text.replace(/```[\s\S]*?```/g, '[Code shown above]');
    return formatted;
  };

  return (
    <div className="result-display">
      <h2>📊 Task Results</h2>
      
      {/* Final Decision Banner */}
      <div className={`decision-banner decision-${result.final_decision?.toLowerCase() || 'unknown'}`}>
        {result.final_decision === 'COMPLETE' ? (
          <>
            <span className="decision-icon">✓</span>
            <span className="decision-text">Task Completed by AI</span>
          </>
        ) : result.final_decision === 'ESCALATE' ? (
          <>
            <span className="decision-icon">⚠</span>
            <span className="decision-text">Task Escalated to Human Expert</span>
          </>
        ) : (
          <>
            <span className="decision-icon">◐</span>
            <span className="decision-text">Processing...</span>
          </>
        )}
      </div>

      {/* Task Description */}
      <div className="result-section">
        <h3>📝 Task Description</h3>
        <p className="task-description-text">{result.task_description}</p>
      </div>

      {/* Agent Sequence */}
      {result.agent_sequence && result.agent_sequence.length > 0 && (
        <div className="result-section">
          <h3>🔀 Agent Pipeline</h3>
          <div className="agent-pipeline">
            {result.agent_sequence.map((agent, idx) => (
              <span key={idx}>
                <span className="pipeline-agent">{agent}</span>
                {idx < result.agent_sequence.length - 1 && (
                  <span className="pipeline-arrow"> → </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Generated Code */}
      {result.code && (
        <div className="result-section">
          <div className="code-header">
            <h3>💻 Generated Code</h3>
            <button onClick={handleCopy} className="copy-button">
              {copied ? '✓ Copied!' : '📋 Copy Code'}
            </button>
          </div>
          <pre className="code-block">
            <code>{result.code}</code>
          </pre>
        </div>
      )}

      {/* Payment Information */}
      {result.payment && (
        <div className="result-section payment-section">
          <h3>💰 Payment Information</h3>
          <div style={{ 
            background: 'rgba(16, 185, 129, 0.1)', 
            border: '2px solid var(--success-color)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, color: 'var(--success-color)', fontWeight: 600, fontSize: '1rem' }}>
              ✅ Automatic payment will be processed via SBC gasless transaction
            </p>
            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              MetaMask will prompt you to sign the transaction in 1 second...
            </p>
          </div>
          <div className="payment-summary">
            <div className="payment-amount">
              <span className="payment-label">AI Micropayment:</span>
              <span className="payment-value">
                ${result.payment.amount.toFixed(2)} SBC
              </span>
            </div>
            
            {result.payment.breakdown && (
              <div className="payment-breakdown">
                <h4>Breakdown:</h4>
                <div className="breakdown-grid">
                  <div className="breakdown-item">
                    <span className="breakdown-label">Complexity:</span>
                    <span className="breakdown-value">{result.payment.breakdown.complexity}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Base Price:</span>
                    <span className="breakdown-value">${result.payment.breakdown.base_price.toFixed(2)}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Quality Score:</span>
                    <span className="breakdown-value">
                      {result.payment.breakdown.quality_score}/100 ({result.payment.breakdown.quality_tier})
                    </span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Quality Multiplier:</span>
                    <span className="breakdown-value">×{result.payment.breakdown.quality_multiplier}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Speed Tier:</span>
                    <span className="breakdown-value">
                      {result.payment.breakdown.time_tier} (×{result.payment.breakdown.time_multiplier})
                    </span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Execution Time:</span>
                    <span className="breakdown-value">{result.payment.breakdown.execution_time_sec.toFixed(2)}s</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Token Cost:</span>
                    <span className="breakdown-value">
                      ${result.payment.breakdown.token_cost.toFixed(4)} ({result.payment.breakdown.tokens_used.toLocaleString()} tokens)
                    </span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Code Lines:</span>
                    <span className="breakdown-value">{result.payment.breakdown.code_lines}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Execution Metrics */}
      <div className="result-section">
        <h3>⏱️ Execution Metrics</h3>
        <div className="metrics-grid">
          <div className="metric-item">
            <span className="metric-label">Execution Time</span>
            <span className="metric-value">{result.execution_time_ms || 0}ms</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Tokens Used</span>
            <span className="metric-value">{result.total_tokens || result.tokens_used || 0}</span>
          </div>
          {result.agent_sequence && (
            <div className="metric-item">
              <span className="metric-label">Agents Involved</span>
              <span className="metric-value">{result.agent_sequence.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Agent Contributions */}
      {result.agent_outputs && Object.keys(result.agent_outputs).length > 0 && (
        <div className="result-section">
          <h3>🤝 Agent Contributions</h3>
          <div className="agent-outputs">
            {Object.entries(result.agent_outputs).map(([agentName, output]) => (
              <div key={agentName} className="agent-output-card">
                <div className="agent-output-header">
                  <strong>{agentName}</strong>
                </div>
                <div className="agent-output-content">
                  {output.response && (
                    <p className="output-response">{output.response}</p>
                  )}
                  {output.handoff_message && (
                    <p className="output-handoff">
                      <em>→ Handoff: {output.handoff_message}</em>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Result/Message */}
      {result.final_result && (
        <div className="result-section">
          <h3>📄 Final Output</h3>
          <div className="final-message">
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
              {formatFinalMessage(result.final_result)}
            </pre>
          </div>
        </div>
      )}

      {/* Error Display */}
      {result.error && (
        <div className="result-section error-section">
          <h3>❌ Error</h3>
          <div className="error-content">
            {result.error}
          </div>
        </div>
      )}
    </div>
  );
}

