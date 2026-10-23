import React from 'react';
import type { StaticAnalysisResult } from '../../types/trace';
import { Sparkles, AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface LivePreviewBannerProps {
  analysis: StaticAnalysisResult | null;
  isLoading: boolean;
}

export const LivePreviewBanner: React.FC<LivePreviewBannerProps> = ({
  analysis,
  isLoading,
}) => {
  if (!analysis) return null;

  return (
    <div className="preview-banner">
      <div className="preview-header">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-amber-400" />
          <span className="preview-title">Live Structure Preview</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300">
            Predicted Preview (Unexecuted)
          </span>
        </div>

        <div className="preview-status">
          {isLoading ? (
            <span className="preview-analyzing">Analyzing AST...</span>
          ) : analysis.valid_syntax ? (
            <span className="syntax-valid">
              <CheckCircle2 size={13} />
              Valid Python Syntax
            </span>
          ) : (
            <span className="syntax-error">
              <AlertCircle size={13} />
              {analysis.error}
            </span>
          )}
        </div>
      </div>

      {analysis.structures.length > 0 && (
        <div className="preview-chips">
          {analysis.structures.map((s, idx) => (
            <div key={idx} className="inferred-chip" title={s.description}>
              <span className="inferred-kind">{s.kind.replace('_class', '')}</span>
              <span className="inferred-name">{s.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-2">
        <Info size={12} className="text-zinc-500 shrink-0" />
        <span>Click <strong>Run Code & Visualize</strong> to execute and confirm actual runtime values, pointers, and memory state.</span>
      </div>
    </div>
  );
};
