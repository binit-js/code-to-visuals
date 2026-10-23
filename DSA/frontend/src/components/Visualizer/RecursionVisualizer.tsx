import React from 'react';
import type { StackFrameDescriptor } from '../../types/trace';
import { Layers } from 'lucide-react';

interface RecursionVisualizerProps {
  frames: StackFrameDescriptor[];
  callDepth: number;
}

export const RecursionVisualizer: React.FC<RecursionVisualizerProps> = ({
  frames,
  callDepth,
}) => {
  return (
    <div className="recursion-card">
      <div className="structure-card-header">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-emerald-400" />
          <span className="struct-type-tag">Recursion / Call Stack</span>
          <span className="struct-meta">Depth: {callDepth}</span>
        </div>
      </div>

      <div className="recursion-frames-container">
        {frames.length === 0 ? (
          <div className="empty-array-placeholder">No active stack frames</div>
        ) : (
          <div className="recursion-stack-list">
            {frames.map((frame, idx) => {
              const isTop = idx === 0;
              return (
                <div
                  key={frame.frame_id || idx}
                  className={`recursion-frame-item ${isTop ? 'frame-top' : ''}`}
                >
                  <div className="frame-header">
                    <span className="frame-name">{frame.function_name}()</span>
                    <span className="frame-line">Line {frame.line}</span>
                    {isTop && <span className="frame-active-badge">Active</span>}
                  </div>
                  <div className="frame-variables">
                    {Object.entries(frame.variables).map(([k, v]) => (
                      <span key={k} className="frame-var-chip">
                        {k}: <strong>{v.value_repr}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
