import React from 'react';
import { Code2 } from 'lucide-react';
import { CODE_SNIPPETS, type CodeSnippet } from '../examples/codeSnippets';

interface HeaderProps {
  onRun: () => void;
  onReset: () => void;
  onReplay: () => void;
  onOpenDemo?: () => void;
  onOpenFeedback?: () => void;
  onOpenAbout?: () => void;
  isRunning: boolean;
  hasTrace: boolean;
  selectedSnippetId: string;
  onSelectSnippet: (snippet: CodeSnippet) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRun,
  onReset,
  onReplay,
  onOpenDemo,
  onOpenFeedback,
  onOpenAbout,
  isRunning,
  hasTrace,
  selectedSnippetId,
  onSelectSnippet,
}) => {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo-group">
          <div className="logo-icon">
            <Code2 size={20} className="text-[#0eb37c]" />
          </div>
          <div>
            <div className="logo-title font-heading">
              <span>Code</span>
              <span className="text-[#0eb37c]">Flow</span>
            </div>
            <span className="logo-subtitle">Runtime Tracing & DSA Visualizer</span>
          </div>
        </div>

        <div className="language-badge">
          <span className="lang-dot"></span>
          <span className="lang-text">Python 3.12</span>
          <span className="lang-tag">Sandboxed</span>
        </div>
      </div>

      <div className="header-center">
        <div className="snippet-selector">
          <span className="snippet-label">Presets:</span>
          <select
            value={selectedSnippetId}
            onChange={(e) => {
              const snippet = CODE_SNIPPETS.find((s) => s.id === e.target.value);
              if (snippet) onSelectSnippet(snippet);
            }}
            className="snippet-select"
          >
            {CODE_SNIPPETS.map((snippet) => (
              <option key={snippet.id} value={snippet.id}>
                {snippet.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="header-right">
        <div className="security-tag" title="Subprocess sandboxing with timeout, memory limit, and restricted builtins">
          <span>Isolated Sandbox</span>
        </div>

        {onOpenDemo && (
          <button
            onClick={onOpenDemo}
            className="px-3 py-1.5 rounded-lg bg-[#111513] border border-[#222b26] hover:border-[#2f3d35] hover:bg-[#171d19] text-[#c5d2cb] hover:text-white transition-colors text-xs font-medium cursor-pointer"
            title="Watch interactive demo & user guide"
          >
            <span>How to Use</span>
          </button>
        )}

        {onOpenFeedback && (
          <button
            onClick={onOpenFeedback}
            className="px-3 py-1.5 rounded-lg bg-[#111513] border border-[#222b26] hover:border-[#2f3d35] hover:bg-[#171d19] text-[#c5d2cb] hover:text-white transition-colors text-xs font-medium cursor-pointer"
            title="Report a Bug or Request a Feature (b33022659@gmail.com)"
          >
            <span>Feedback & Bugs</span>
          </button>
        )}

        {onOpenAbout && (
          <button
            onClick={onOpenAbout}
            className="group flex items-center gap-2 p-1 pr-3 rounded-full bg-[#111513] border border-[#222b26] hover:border-[#0eb37c]/60 hover:bg-[#171d19] transition-colors cursor-pointer"
            title="About Binit — Creator & Lead Architect"
          >
            <div className="relative size-7 rounded-full overflow-hidden border border-[#0eb37c]/60 shrink-0">
              <img
                src="/binit-dp.jpg?v=2"
                alt="Binit"
                className="size-full object-cover"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-semibold text-white leading-tight">
                Binit
              </span>
              <span className="text-[9px] font-mono text-[#0eb37c] leading-tight">
                Creator
              </span>
            </div>
          </button>
        )}

        <button
          onClick={onReset}
          className="btn btn-secondary"
          title="Reset code and execution trace"
          disabled={isRunning}
        >
          <span>Reset</span>
        </button>

        {hasTrace && (
          <button
            onClick={onReplay}
            className="btn btn-secondary"
            title="Replay from step 0"
            disabled={isRunning}
          >
            <span>Replay</span>
          </button>
        )}

        <button
          onClick={onRun}
          disabled={isRunning}
          className={`btn btn-primary ${isRunning ? 'btn-loading' : ''}`}
        >
          <span>{isRunning ? 'Executing...' : 'Run Code'}</span>
        </button>
      </div>
    </header>
  );
};
