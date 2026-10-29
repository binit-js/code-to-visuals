import React, { useRef } from 'react';
import { Terminal, AlertCircle, Play } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  activeLine?: number | null;
  errorLine?: number | null;
  readOnly?: boolean;
  onRunCode?: () => void;
  onToggleOutput?: () => void;
  isOutputOpen?: boolean;
  hasOutput?: boolean;
  isRunning?: boolean;
  outputContent?: React.ReactNode;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  activeLine,
  errorLine,
  readOnly = false,
  onRunCode,
  onToggleOutput,
  isOutputOpen = false,
  hasOutput = false,
  isRunning = false,
  outputContent,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = code.split('\n');

  // Handle Tab key for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const updated = code.substring(0, start) + '    ' + code.substring(end);
      onChange(updated);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="editor-container">
      {/* Top Header */}
      <div className="editor-header">
        <div className="editor-title">
          <Terminal size={14} className="text-zinc-400" />
          <span>main.py</span>
        </div>
        <div className="editor-status">
          {activeLine && (
            <span className="active-line-badge">
              Executing Line {activeLine}
            </span>
          )}
          {errorLine && (
            <span className="error-line-badge">
              <AlertCircle size={12} />
              Error on Line {errorLine}
            </span>
          )}
        </div>
      </div>

      {/* Editor Body */}
      <div className="editor-body">
        {/* Line Numbers with active line indicator */}
        <div className="line-numbers" ref={lineNumbersRef}>
          {lines.map((_, idx) => {
            const lineNum = idx + 1;
            const isActive = activeLine === lineNum;
            const isError = errorLine === lineNum;

            return (
              <div
                key={lineNum}
                className={`line-number ${isActive ? 'active-line' : ''} ${
                  isError ? 'error-line' : ''
                }`}
              >
                {isActive && <span className="line-arrow">▶</span>}
                {isError && <span className="line-error-icon">●</span>}
                <span className="line-num-text">{lineNum}</span>
              </div>
            );
          })}
        </div>

        {/* Text Area */}
        <div className="code-input-wrapper">
          {/* Active line background highlight overlay */}
          <div className="line-highlights-overlay">
            {lines.map((_, idx) => {
              const lineNum = idx + 1;
              const isActive = activeLine === lineNum;
              const isError = errorLine === lineNum;

              if (isActive) {
                return (
                  <div
                    key={lineNum}
                    className="active-line-highlight"
                    style={{ top: `${idx * 1.5}rem` }}
                  />
                );
              }
              if (isError) {
                return (
                  <div
                    key={lineNum}
                    className="error-line-highlight"
                    style={{ top: `${idx * 1.5}rem` }}
                  />
                );
              }
              return null;
            })}
          </div>

          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            readOnly={readOnly}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            className="code-textarea"
            placeholder="Write your Python code here..."
          />
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="editor-footer-toolbar">
        <div className="flex items-center gap-2">
          {onRunCode && (
            <button
              onClick={onRunCode}
              disabled={isRunning}
              className={`btn btn-primary ${isRunning ? 'btn-loading' : ''}`}
              title="Execute Python Code (Ctrl+Enter)"
            >
              <Play size={13} fill="currentColor" />
              <span>{isRunning ? 'Running...' : 'Run Code'}</span>
            </button>
          )}

          {onToggleOutput && (
            <button
              onClick={onToggleOutput}
              className={`btn-output-trigger ${isOutputOpen ? 'active' : ''} ${
                hasOutput ? 'has-output' : ''
              }`}
              title="Toggle Output and Answer View"
            >
              <span>{isOutputOpen ? 'Hide Answer' : 'Output & Answer'}</span>
              {hasOutput && <span className="output-status-dot" />}
            </button>
          )}
        </div>

        <div className="editor-shortcut-hint">
          <span>Ctrl+Enter</span>
        </div>
      </div>

      {/* Expandable Output Drawer */}
      {isOutputOpen && outputContent && (
        <div className="editor-output-drawer">
          {outputContent}
        </div>
      )}
    </div>
  );
};
