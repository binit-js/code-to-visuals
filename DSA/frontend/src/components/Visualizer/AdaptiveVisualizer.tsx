import React from 'react';
import type { TraceStep, StaticAnalysisResult } from '../../types/trace';
import { ArrayVisualizer } from './ArrayVisualizer';
import { StackVisualizer } from './StackVisualizer';
import { QueueVisualizer } from './QueueVisualizer';
import { LinkedListVisualizer } from './LinkedListVisualizer';
import { TreeVisualizer } from './TreeVisualizer';
import { GraphVisualizer } from './GraphVisualizer';
import { MatrixVisualizer } from './MatrixVisualizer';
import { RecursionVisualizer } from './RecursionVisualizer';
import { GenericObjectVisualizer } from './GenericObjectVisualizer';
import { LivePreviewBanner } from './LivePreviewBanner';
import { Eye, Play, Video, Maximize2, Minimize2 } from 'lucide-react';
import {
  Cursor,
  CursorContainer,
  CursorFollow,
  CursorProvider,
} from '@animate-ui/react/primitives/cursor';

interface AdaptiveVisualizerProps {
  currentStep?: TraceStep | null;
  staticAnalysis: StaticAnalysisResult | null;
  isAnalyzing: boolean;
  onRunCode: () => void;
  onOpenDemo?: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export const AdaptiveVisualizer: React.FC<AdaptiveVisualizerProps> = ({
  currentStep,
  staticAnalysis,
  isAnalyzing,
  onRunCode,
  onOpenDemo,
  isMaximized = false,
  onToggleMaximize,
}) => {
  const hasStep = Boolean(currentStep);
  const detected = currentStep?.detected_structures || [];
  const isRecursive = currentStep && currentStep.call_depth > 1;

  return (
    <div className="visualizer-wrapper">
      <div className="visualizer-topbar">
        <div className="flex items-center gap-2">
          <Eye size={15} className="text-zinc-400" />
          <span className="font-medium text-sm text-zinc-200">
            {hasStep ? 'Runtime Visualizer' : 'Code Structure Preview'}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {hasStep && (
            <div className="step-counter-pill">
              Step {currentStep!.step_index + 1} • Line {currentStep!.line} ({currentStep!.event_type})
            </div>
          )}

          {onToggleMaximize && (
            <button
              onClick={onToggleMaximize}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all text-xs font-semibold border border-zinc-700/80 cursor-pointer shadow-sm"
              title={isMaximized ? "Restore split-screen layout" : "Expand screen to full width"}
            >
              {isMaximized ? (
                <>
                  <Minimize2 size={13} className="text-emerald-400" />
                  <span>Restore</span>
                </>
              ) : (
                <>
                  <Maximize2 size={13} className="text-emerald-400" />
                  <span>Expand Screen</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="visualizer-scroll-area">
        <CursorProvider global={false}>
          <CursorContainer>
            <Cursor>
              <svg
                width="20"
                height="20"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="#10b981"
                  stroke="#064e3b"
                  strokeWidth="2.5"
                  d="M1.8 4.4 7 36.2c.3 1.8 2.6 2.3 3.6.8l3.9-5.7c1.7-2.5 4.5-4.1 7.5-4.3l6.9-.5c1.8-.1 2.5-2.4 1.1-3.5L5 2.5c-1.4-1.1-3.5 0-3.3 1.9Z"
                />
              </svg>
            </Cursor>
            <CursorFollow side="bottom" sideOffset={12} align="end" alignOffset={4}>
              <div className="visualizer-cursor-tag">
                <span className="cursor-tag-dot" />
                <span>Runtime Inspector</span>
              </div>
            </CursorFollow>
          </CursorContainer>

          {/* If no execution step, show live preview & run prompt */}
          {!hasStep ? (
            <div className="preview-empty-state">
              <LivePreviewBanner analysis={staticAnalysis} isLoading={isAnalyzing} />

              <div className="empty-prompt">
                <div className="empty-icon-ring">
                  <Play size={24} className="text-emerald-400 ml-1" />
                </div>
                <h3 className="empty-title">Ready for Execution</h3>
                <p className="empty-desc">
                  Write or modify Python code on the left and click <strong>Run Code</strong>.
                  The engine will instrument runtime events, inspect objects and pointers, and dynamically render data structures step by step.
                </p>
                <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
                  <button onClick={onRunCode} className="btn btn-primary">
                    <Play size={15} fill="currentColor" />
                    <span>Run Code & Visualize</span>
                  </button>

                  {onOpenDemo && (
                    <button
                      onClick={onOpenDemo}
                      className="btn btn-secondary flex items-center gap-1.5 hover:border-emerald-500/50 hover:text-emerald-300"
                    >
                      <Video size={14} className="text-emerald-400" />
                      <span>Watch Demo Guide</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="structures-grid">
              {/* Render Recursion Stack if depth > 1 */}
              {isRecursive && (
                <RecursionVisualizer
                  frames={currentStep!.stack_frames}
                  callDepth={currentStep!.call_depth}
                />
              )}

              {/* Render Detected Structures */}
              {detected.map((struct, idx) => {
                if (struct.kind === 'stack') {
                  return (
                    <StackVisualizer
                      key={struct.name + idx}
                      name={struct.name}
                      elements={struct.payload.elements || []}
                      mutations={currentStep!.mutations}
                      pointers={struct.payload.pointers || []}
                    />
                  );
                }

                if (struct.kind === 'queue') {
                  return (
                    <QueueVisualizer
                      key={struct.name + idx}
                      name={struct.name}
                      elements={struct.payload.elements || []}
                      mutations={currentStep!.mutations}
                      pointers={struct.payload.pointers || []}
                    />
                  );
                }

                if (struct.kind === 'array') {
                  return (
                    <ArrayVisualizer
                      key={struct.name + idx}
                      name={struct.name}
                      elements={struct.payload.elements || []}
                      mutations={currentStep!.mutations}
                      variables={currentStep!.variables}
                      pointers={struct.payload.pointers}
                    />
                  );
                }

                if (struct.kind === 'matrix') {
                  return (
                    <MatrixVisualizer
                      key={struct.name + idx}
                      name={struct.name}
                      matrix={struct.payload.matrix || []}
                      rows={struct.payload.rows || 0}
                      cols={struct.payload.cols || 0}
                    />
                  );
                }

                if (struct.kind === 'linked_list') {
                  return (
                    <LinkedListVisualizer
                      key={struct.name + idx}
                      name={struct.name}
                      nodes={struct.payload.nodes || []}
                      headId={struct.payload.head_id}
                      hasCycle={struct.payload.has_cycle}
                      cycleTarget={struct.payload.cycle_target}
                      isDoubly={struct.payload.is_doubly}
                      unlinkedNodes={struct.payload.unlinked_nodes || []}
                    />
                  );
                }

                if (struct.kind === 'binary_tree') {
                  return (
                    <TreeVisualizer
                      key={struct.name + idx}
                      name={struct.name}
                      nodes={struct.payload.nodes || []}
                      rootId={struct.payload.root_id}
                    />
                  );
                }

                if (struct.kind === 'graph') {
                  return (
                    <GraphVisualizer
                      key={struct.name + idx}
                      name={struct.name}
                      nodes={struct.payload.nodes || []}
                      edges={struct.payload.edges || []}
                      activePointers={struct.payload.active_pointers || {}}
                    />
                  );
                }

                if (struct.kind === 'generic') {
                  return (
                    <GenericObjectVisualizer
                      key={struct.name + idx}
                      name={struct.name}
                      type={struct.payload.type}
                      className={struct.payload.class_name}
                      valueRepr={struct.payload.value_repr}
                      fields={struct.payload.fields}
                      entries={struct.payload.entries}
                      elements={struct.payload.elements}
                    />
                  );
                }

                return null;
              })}

              {detected.length === 0 && (
                <div className="no-structures-box">
                  <p>No high-level data structures detected in scope at this step.</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Inspect active variables and memory references in the right panel.
                  </p>
                </div>
              )}
            </div>
          )}
        </CursorProvider>
      </div>
    </div>
  );
};
