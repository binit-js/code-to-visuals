import React from 'react';
import { ArrowLeft, Layers, ArrowUp } from 'lucide-react';
import type { MutationEvent } from '../../types/trace';

interface StackVisualizerProps {
  name: string;
  elements: any[];
  mutations?: MutationEvent[];
  pointers?: string[];
}

export const StackVisualizer: React.FC<StackVisualizerProps> = ({
  name,
  elements = [],
  mutations = [],
  pointers = [],
}) => {
  const activeMutation = mutations.find(
    (m) => m.target_name === name || m.description?.toLowerCase().includes(name.toLowerCase())
  );

  const topIndex = elements.length > 0 ? elements.length - 1 : -1;

  return (
    <div className="stack-card">
      <div className="structure-card-header">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <Layers size={13} />
            <span>Stack (LIFO)</span>
          </div>
          <span className="struct-name">{name}</span>
          <span className="struct-meta">size: {elements.length}</span>
          {pointers.length > 0 && (
            <div className="flex items-center gap-1">
              {pointers.map((p) => (
                <span key={p} className="chip text-[10px] text-amber-300">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>

        {activeMutation && (
          <div className="mutation-badge">
            <span className="mutation-dot"></span>
            <span>{activeMutation.description || activeMutation.operation}</span>
          </div>
        )}
      </div>

      <div className="stack-container">
        {elements.length === 0 ? (
          <div className="stack-empty-well">
            <div className="stack-empty-text">Stack is Empty</div>
            <div className="stack-bottom-line">────── [BOTTOM] ──────</div>
          </div>
        ) : (
          <div className="stack-tower-layout">
            {/* Top pointer banner */}
            <div className="stack-top-banner">
              <span className="stack-top-tag">
                <ArrowUp size={13} className="text-amber-400 animate-pulse" />
                <span>TOP (index {topIndex})</span>
              </span>
            </div>

            {/* Elements tower rendered from top (highest index) down to bottom (0) */}
            <div className="stack-elements-tower">
              {elements
                .slice()
                .reverse()
                .map((item, revIdx) => {
                  const actualIdx = elements.length - 1 - revIdx;
                  const isTop = actualIdx === topIndex;
                  const isMutated =
                    activeMutation &&
                    ((activeMutation.operation === 'append' && isTop) ||
                      (activeMutation.operation === 'pop' && isTop));

                  const displayVal =
                    typeof item === 'object' && item !== null
                      ? item.$ref || JSON.stringify(item)
                      : String(item);

                  return (
                    <div
                      key={actualIdx}
                      className={`stack-element-row ${isTop ? 'stack-row-top' : ''} ${
                        isMutated ? 'cell-mutated' : ''
                      }`}
                    >
                      <div className="stack-element-box">
                        <span className="stack-val">{displayVal}</span>
                      </div>
                      <div className="stack-index-tag">[{actualIdx}]</div>
                      {isTop && (
                        <div className="stack-top-pointer-badge">
                          <ArrowLeft size={14} className="text-amber-400" />
                          <span>TOP</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              <div className="stack-base-bar">
                <span>── BOTTOM OF STACK ──</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
