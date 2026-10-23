import React from 'react';
import { ArrowRight, ArrowLeftRight, AlertTriangle, Sparkles, CornerRightDown } from 'lucide-react';

export interface LLNode {
  id: string;
  val: any;
  next_id?: string | null;
  prev_id?: string | null;
  pointers?: string[];
}

interface LinkedListVisualizerProps {
  name: string;
  nodes: LLNode[];
  headId?: string | null;
  hasCycle?: boolean;
  cycleTarget?: string | null;
  isDoubly?: boolean;
  unlinkedNodes?: LLNode[];
}

export const LinkedListVisualizer: React.FC<LinkedListVisualizerProps> = ({
  name,
  nodes = [],
  hasCycle = false,
  cycleTarget = null,
  isDoubly = false,
  unlinkedNodes = [],
}) => {
  return (
    <div className="linked-list-card">
      <div className="structure-card-header">
        <div className="flex items-center gap-2">
          <span className="struct-type-tag">
            {isDoubly ? 'Doubly Linked List' : 'Linked List'}
          </span>
          <span className="struct-name">{name}</span>
          <span className="struct-meta">
            {nodes.length} node{nodes.length === 1 ? '' : 's'}
            {unlinkedNodes.length > 0 && ` (+${unlinkedNodes.length} pending)`}
          </span>
        </div>

        {hasCycle && (
          <div className="cycle-badge">
            <AlertTriangle size={13} />
            <span>Cycle Detected {cycleTarget ? `(loops to #${cycleTarget.replace('obj_', '')})` : ''}</span>
          </div>
        )}
      </div>

      <div className="ll-container">
        {nodes.length === 0 ? (
          <div className="empty-array-placeholder">Empty Linked List (None)</div>
        ) : (
          <div className="ll-nodes-track">
            {nodes.map((node, idx) => {
              const isHead = idx === 0;
              const hasNext = Boolean(node.next_id);
              const nodePointers = node.pointers || [];
              const isCycleEnd = hasCycle && idx === nodes.length - 1;

              return (
                <React.Fragment key={node.id || idx}>
                  <div className="ll-node-wrapper">
                    {/* Active pointer indicators (e.g. head, curr, prev) */}
                    <div className="pointer-container">
                      {isHead && !nodePointers.includes('head') && (
                        <div className="pointer-badge head-badge">
                          <span>HEAD</span>
                          <span className="pointer-arrow">▼</span>
                        </div>
                      )}
                      {nodePointers.map((p) => (
                        <div
                          key={p}
                          className={`pointer-badge ${p === 'head' ? 'head-badge' : 'var-pointer-badge'}`}
                        >
                          <span>{p}</span>
                          <span className="pointer-arrow">▼</span>
                        </div>
                      ))}
                    </div>

                    {/* Node Visual Box */}
                    <div className="ll-node-box">
                      <div className="ll-node-val" title={`Node value: ${node.val}`}>
                        {String(node.val)}
                      </div>
                      <div className="ll-node-next" title={`next pointer: ${node.next_id || 'None'}`}>
                        •
                      </div>
                    </div>

                    <div className="ll-node-id">
                      #{node.id.replace('obj_', '').slice(-4)}
                    </div>
                  </div>

                  {/* Arrow to next node */}
                  {hasNext && !isCycleEnd ? (
                    <div className="ll-arrow" title={isDoubly ? 'Bi-directional link' : 'Points to next'}>
                      {isDoubly ? (
                        <ArrowLeftRight size={18} className="text-emerald-400" />
                      ) : (
                        <ArrowRight size={20} className="text-emerald-400" />
                      )}
                    </div>
                  ) : isCycleEnd ? (
                    <div className="ll-cycle-arrow" title="Cycles back to earlier node">
                      <CornerRightDown size={20} className="text-rose-400" />
                      <span className="text-[10px] text-rose-400 font-mono">LOOP</span>
                    </div>
                  ) : (
                    <div className="ll-null-box" title="End of chain">
                      <span>NULL</span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Unlinked / Pending Nodes (e.g. new_node = Node(5) before being inserted) */}
        {unlinkedNodes.length > 0 && (
          <div className="unlinked-nodes-section">
            <div className="unlinked-header">
              <Sparkles size={12} className="text-amber-400" />
              <span>Pending / Unlinked Node{unlinkedNodes.length > 1 ? 's' : ''} (In Scope):</span>
            </div>
            <div className="unlinked-track">
              {unlinkedNodes.map((uNode) => {
                const pointers = uNode.pointers || [];
                return (
                  <div key={uNode.id} className="unlinked-node-item">
                    <div className="pointer-container">
                      {pointers.map((p) => (
                        <div key={p} className="pointer-badge var-pointer-badge">
                          <span>{p}</span>
                          <span className="pointer-arrow">▼</span>
                        </div>
                      ))}
                    </div>
                    <div className="ll-node-box unlinked-box">
                      <div className="ll-node-val">{String(uNode.val)}</div>
                      <div className="ll-node-next">
                        {uNode.next_id ? '→' : '•'}
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 text-center">
                      next: {uNode.next_id ? `#${uNode.next_id.replace('obj_', '').slice(-4)}` : 'None'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
