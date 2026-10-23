import React from 'react';
import { ArrowRight, LogIn, LogOut } from 'lucide-react';
import type { MutationEvent } from '../../types/trace';

interface QueueVisualizerProps {
  name: string;
  elements: any[];
  mutations?: MutationEvent[];
  pointers?: string[];
}

export const QueueVisualizer: React.FC<QueueVisualizerProps> = ({
  name,
  elements = [],
  mutations = [],
  pointers = [],
}) => {
  const activeMutation = mutations.find(
    (m) => m.target_name === name || m.description?.toLowerCase().includes(name.toLowerCase())
  );

  return (
    <div className="queue-card">
      <div className="structure-card-header">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
            <ArrowRight size={13} />
            <span>Queue (FIFO)</span>
          </div>
          <span className="struct-name">{name}</span>
          <span className="struct-meta">size: {elements.length}</span>
          {pointers.length > 0 && (
            <div className="flex items-center gap-1">
              {pointers.map((p) => (
                <span key={p} className="chip text-[10px] text-sky-300">
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

      <div className="queue-container">
        {elements.length === 0 ? (
          <div className="empty-array-placeholder">Queue is Empty (no items in line)</div>
        ) : (
          <div className="queue-track-wrapper">
            {/* Dequeue indicator on the left (Front) */}
            <div className="queue-flow-label queue-flow-left">
              <LogOut size={14} className="text-rose-400" />
              <span>EXIT (FRONT)</span>
            </div>

            <div className="queue-cells-track">
              {elements.map((item, idx) => {
                const isFront = idx === 0;
                const isRear = idx === elements.length - 1;
                const isMutated =
                  activeMutation &&
                  ((activeMutation.operation === 'append' && isRear) ||
                    (activeMutation.operation === 'pop' && isFront));

                const displayVal =
                  typeof item === 'object' && item !== null
                    ? item.$ref || JSON.stringify(item)
                    : String(item);

                return (
                  <div key={idx} className="queue-column">
                    {/* Top pointers */}
                    <div className="queue-tag-top">
                      {isFront && (
                        <span className="queue-front-badge">
                          FRONT
                          <span className="text-[10px] block">▼</span>
                        </span>
                      )}
                      {isRear && !isFront && (
                        <span className="queue-rear-badge">
                          REAR
                          <span className="text-[10px] block">▼</span>
                        </span>
                      )}
                    </div>

                    {/* Cell */}
                    <div className={`queue-cell ${isMutated ? 'cell-mutated' : ''} ${isFront ? 'cell-front' : ''}`}>
                      <span className="queue-val">{displayVal}</span>
                    </div>

                    {/* Bottom index */}
                    <div className="cell-index">[{idx}]</div>
                  </div>
                );
              })}
            </div>

            {/* Enqueue indicator on the right (Rear) */}
            <div className="queue-flow-label queue-flow-right">
              <span>ENTER (REAR)</span>
              <LogIn size={14} className="text-emerald-400" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
