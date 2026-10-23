import React, { useState } from 'react';
import type { ExecutionResult, TraceStep } from '../../types/trace';
import {
  Terminal,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Layers,
  Copy,
  Check,
  X,
  Sparkles,
  Play,
  Award,
} from 'lucide-react';

interface AnswerOutputProps {
  executionResult: ExecutionResult | null;
  isRunning: boolean;
  onRunCode: () => void;
  onClose: () => void;
}

export const AnswerOutput: React.FC<AnswerOutputProps> = ({
  executionResult,
  isRunning,
  onRunCode,
  onClose,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  // Extract key answer variable if present in final step
  const getComputedAnswer = (): { name: string; value: string; type: string } | null => {
    if (!executionResult || executionResult.steps.length === 0) return null;
    const finalStep: TraceStep = executionResult.steps[executionResult.steps.length - 1];

    // Priority variable names representing answers in DSA/algorithms
    const answerKeys = [
      'ans',
      'result',
      'res',
      'output',
      'final_array',
      'sorted_arr',
      'count',
      'total',
      'sum_val',
      'max_val',
      'min_val',
      'target_index',
      'found',
    ];

    for (const key of answerKeys) {
      if (finalStep.variables[key]) {
        return {
          name: key,
          value: finalStep.variables[key].value_repr,
          type: finalStep.variables[key].type,
        };
      }
    }

    // Check if the final step has a return value
    if (finalStep.return_value) {
      return {
        name: 'return',
        value: finalStep.return_value,
        type: 'return_value',
      };
    }

    return null;
  };

  const computedAnswer = getComputedAnswer();
  const stdout = executionResult?.stdout || '';
  const error = executionResult?.error;

  const handleCopy = () => {
    const textToCopy = stdout || (computedAnswer ? `${computedAnswer.name} = ${computedAnswer.value}` : error || '');
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="answer-output-card">
      {/* Header Bar */}
      <div className="answer-output-header">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-emerald-400" />
          <span className="answer-output-title">Output & Answer</span>

          {executionResult?.success && (
            <span className="answer-badge-success">
              <CheckCircle2 size={11} />
              Success
            </span>
          )}

          {error && (
            <span className="answer-badge-error">
              <AlertOctagon size={11} />
              Error
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {executionResult && (
            <>
              {executionResult.execution_time_ms > 0 && (
                <span className="meta-pill" title="Execution Time">
                  <Clock size={11} />
                  {executionResult.execution_time_ms.toFixed(1)}ms
                </span>
              )}
              {executionResult.total_steps > 0 && (
                <span className="meta-pill" title="Total Execution Steps">
                  <Layers size={11} />
                  {executionResult.total_steps} steps
                </span>
              )}
            </>
          )}

          <button
            onClick={handleCopy}
            disabled={!stdout && !computedAnswer && !error}
            className="btn-output-action"
            title="Copy Output"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={onClose}
            className="btn-output-close"
            title="Close Output Panel"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="answer-output-body">
        {isRunning ? (
          <div className="output-state-box loading">
            <div className="spinner-dot" />
            <span>Executing Python code in isolated sandbox...</span>
          </div>
        ) : !executionResult ? (
          <div className="output-state-box empty">
            <Sparkles size={20} className="text-zinc-500 mb-1" />
            <p className="text-xs text-zinc-400">Code has not been executed yet.</p>
            <button onClick={onRunCode} className="btn btn-primary mt-2">
              <Play size={13} fill="currentColor" />
              <span>Run Code & Get Answer</span>
            </button>
          </div>
        ) : error ? (
          <div className="output-error-container">
            <div className="error-badge-title">
              <AlertOctagon size={14} />
              <span>Runtime Exception</span>
            </div>
            <pre className="error-text-content">{error}</pre>
          </div>
        ) : (
          <div className="output-success-container">
            {/* Featured Computed Answer Card if detected */}
            {computedAnswer && (
              <div className="computed-answer-banner">
                <div className="computed-answer-left">
                  <div className="award-icon-box">
                    <Award size={16} className="text-amber-400" />
                  </div>
                  <div>
                    <span className="answer-label">Computed Result ({computedAnswer.name}):</span>
                    <div className="answer-value-repr">
                      <code>{computedAnswer.value}</code>
                    </div>
                  </div>
                </div>
                <span className="answer-type-tag">{computedAnswer.type}</span>
              </div>
            )}

            {/* Standard Terminal Output */}
            {stdout ? (
              <div className="stdout-section">
                <div className="stdout-label-bar">
                  <span>Standard Output (stdout):</span>
                </div>
                <div className="stdout-terminal-box">
                  <pre className="stdout-content">{stdout}</pre>
                </div>
              </div>
            ) : !computedAnswer ? (
              <div className="clean-success-box">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>Program executed cleanly with no printed output.</span>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
