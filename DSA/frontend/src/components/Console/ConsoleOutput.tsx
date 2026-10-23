import React from 'react';
import { Terminal, CheckCircle2, AlertOctagon, Clock } from 'lucide-react';

interface ConsoleOutputProps {
  stdout: string;
  error?: string | null;
  executionTimeMs?: number;
  totalSteps?: number;
}

export const ConsoleOutput: React.FC<ConsoleOutputProps> = ({
  stdout,
  error,
  executionTimeMs,
  totalSteps,
}) => {
  return (
    <div className="console-wrapper">
      <div className="console-header">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-zinc-400" />
          <span className="console-title">Console Output</span>
        </div>

        <div className="console-meta-group">
          {typeof executionTimeMs === 'number' && executionTimeMs > 0 && (
            <span className="console-stat">
              <Clock size={12} />
              {executionTimeMs.toFixed(1)}ms
            </span>
          )}
          {typeof totalSteps === 'number' && totalSteps > 0 && (
            <span className="console-stat">
              {totalSteps} steps recorded
            </span>
          )}
          {error ? (
            <span className="console-error-badge">
              <AlertOctagon size={12} />
              Execution Error
            </span>
          ) : stdout ? (
            <span className="console-success-badge">
              <CheckCircle2 size={12} />
              Success
            </span>
          ) : null}
        </div>
      </div>

      <div className="console-body">
        {error && (
          <div className="console-error-box">
            <span className="font-semibold text-rose-400">Error:</span> {error}
          </div>
        )}

        {stdout ? (
          <pre className="console-text">{stdout}</pre>
        ) : !error ? (
          <div className="console-empty">
            Program output will appear here after execution...
          </div>
        ) : null}
      </div>
    </div>
  );
};
