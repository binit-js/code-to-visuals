import React from 'react';
import { Play, RotateCcw, RotateCw, ShieldCheck, Code2, Video, Bug } from 'lucide-react';
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
            <Code2 size={20} className="text-emerald-400" />
          </div>
          <div>
            <div className="logo-title">
              <span>Code</span>
              <span className="logo-highlight">Flow</span>
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
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Isolated Sandbox</span>
        </div>

        {onOpenDemo && (
          <button
            onClick={onOpenDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-emerald-500/50 hover:bg-emerald-950/30 text-zinc-300 hover:text-emerald-300 transition-all text-xs font-semibold shadow-sm cursor-pointer group"
            title="Watch interactive demo & user guide"
          >
            <Video size={14} className="text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>How to Use</span>
          </button>
        )}

        {onOpenFeedback && (
          <button
            onClick={onOpenFeedback}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-neutral-700/80 hover:border-amber-400/50 hover:bg-amber-950/20 text-neutral-200 hover:text-amber-200 transition-all text-xs font-semibold shadow-sm cursor-pointer group"
            title="Report a Bug or Request a Feature (b33022659@gmail.com)"
          >
            <Bug size={14} className="text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Feedback & Bugs</span>
          </button>
        )}

        {onOpenAbout && (
          <button
            onClick={onOpenAbout}
            className="group relative flex items-center gap-2 p-1 pr-3 rounded-full bg-zinc-900/90 border border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-950/30 transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
            title="About Binit — Creator & Lead Architect"
          >
            {/* Attractive Circular DP Photo */}
            <div className="relative size-8 rounded-full overflow-hidden border-2 border-emerald-400 shrink-0">
              <img
                src="/binit-dp.jpg?v=2"
                alt="Binit"
                className="size-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <span className="absolute bottom-0 right-0 size-2 bg-emerald-500 rounded-full border border-zinc-900"></span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-white group-hover:text-emerald-300 transition-colors leading-tight">
                Binit
              </span>
              <span className="text-[9px] font-mono text-emerald-400/80 leading-tight">
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
          <RotateCcw size={15} />
          <span>Reset</span>
        </button>

        {hasTrace && (
          <button
            onClick={onReplay}
            className="btn btn-secondary"
            title="Replay from step 0"
            disabled={isRunning}
          >
            <RotateCw size={15} />
            <span>Replay</span>
          </button>
        )}

        <button
          onClick={onRun}
          disabled={isRunning}
          className={`btn btn-primary ${isRunning ? 'btn-loading' : ''}`}
        >
          <Play size={16} fill="currentColor" />
          <span>{isRunning ? 'Executing...' : 'Run Code'}</span>
        </button>
      </div>
    </header>
  );
};
