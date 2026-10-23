import React, { useState } from 'react';
import type { TraceStep } from '../../types/trace';
import {
  HelpCircle,
  Code2,
  Database,
  Cpu,
  Layers,
  GitCommit,
  ArrowRight,
  Sparkles,
  Terminal,
  Activity,
  Eye,
  CheckCircle2,
} from 'lucide-react';

interface StepExplainerProps {
  currentStep?: TraceStep | null;
  previousStep?: TraceStep | null;
  totalSteps: number;
  code: string;
}

export const StepExplainer: React.FC<StepExplainerProps> = ({
  currentStep,
  previousStep,
  totalSteps,
  code,
}) => {
  const [activeTab, setActiveTab] = useState<'explanation' | 'vars' | 'heap' | 'stack' | 'mutations'>('explanation');

  const codeLines = code.split('\n');
  const currentLineText =
    currentStep && currentStep.line > 0 && currentStep.line <= codeLines.length
      ? codeLines[currentStep.line - 1].trim()
      : '';

  // Calculate variable changes between previousStep and currentStep
  const changedVariables: Array<{ name: string; oldVal?: string; newVal: string; type: string }> = [];
  if (currentStep) {
    const currentVars = currentStep.variables;
    const prevVars = previousStep?.variables || {};

    for (const [name, desc] of Object.entries(currentVars)) {
      if (name.startsWith('__')) continue;
      const prevDesc = prevVars[name];
      if (!prevDesc) {
        changedVariables.push({
          name,
          newVal: desc.value_repr,
          type: desc.type,
        });
      } else if (prevDesc.value_repr !== desc.value_repr) {
        changedVariables.push({
          name,
          oldVal: prevDesc.value_repr,
          newVal: desc.value_repr,
          type: desc.type,
        });
      }
    }
  }

  // Stdout delta
  const stdoutDelta = currentStep
    ? previousStep
      ? currentStep.stdout.slice(previousStep.stdout.length)
      : currentStep.stdout
    : '';

  // Derive beginner-friendly 3-part educational explanation:
  // 1. What is happening?
  // 2. Why is it happening?
  // 3. What changed in the visualization?
  const getExplanationParts = () => {
    if (!currentStep) {
      return {
        what: 'Run your code to step through each execution instruction.',
        why: 'Stepping line by line shows you how data structures update in memory.',
        visual_change: 'The visualizer will render nodes, pointers, and variables as they change.',
        actionType: 'idle',
      };
    }

    // If backend provided structured explanation, prioritize it
    if (currentStep.explanation) {
      return {
        what: currentStep.explanation.what,
        why: currentStep.explanation.why,
        visual_change: currentStep.explanation.visual_change,
        actionType: currentStep.explanation.action_type,
      };
    }

    // Fallback synthesis
    const { event_type, function_name, line, mutations, exception, return_value } = currentStep;

    if (event_type === 'exception' || exception) {
      return {
        what: `An error occurred: ${exception || 'Error'}.`,
        why: 'The program attempted an invalid operation.',
        visual_change: `Execution stopped at line ${line}.`,
        actionType: 'exception',
      };
    }

    if (event_type === 'call') {
      return {
        what: `Calling function "${function_name}()".`,
        why: 'The program is invoking this function to process inputs.',
        visual_change: `A new stack frame appeared for "${function_name}".`,
        actionType: 'call',
      };
    }

    if (event_type === 'return') {
      return {
        what: `Function "${function_name}()" finished and returned ${return_value || 'None'}.`,
        why: 'All instructions in this function completed.',
        visual_change: `Stack frame for "${function_name}" was popped.`,
        actionType: 'return',
      };
    }

    if (mutations && mutations.length > 0) {
      const m = mutations[0];
      if (m.operation === 'append') {
        return {
          what: `Added item "${m.value}" to ${m.target_name || 'the collection'}.`,
          why: 'Expanding the list with a new element at the end.',
          visual_change: `A new cell [${m.value}] appeared in the visualizer.`,
          actionType: 'append',
        };
      }
      if (m.operation === 'pop') {
        return {
          what: `Removed item "${m.value}" from ${m.target_name || 'the collection'}.`,
          why: 'Retrieving and removing the element.',
          visual_change: `Cell [${m.value}] was removed from the visualizer.`,
          actionType: 'pop',
        };
      }
      if (m.operation === 'setitem') {
        return {
          what: `Set index [${m.index_or_key}] to "${m.value}".`,
          why: 'Updating the cell with the new value.',
          visual_change: `Slot [${m.index_or_key}] updated in the visualizer.`,
          actionType: 'setitem',
        };
      }
      if (m.operation === 'setattr') {
        return {
          what: `Connected .${m.index_or_key} to "${m.value}".`,
          why: 'Updating pointer reference between nodes.',
          visual_change: `Arrow rewired to point to target node.`,
          actionType: 'link_update',
        };
      }
    }

    if (changedVariables.length > 0) {
      const first = changedVariables[0];
      return {
        what: `Variable "${first.name}" updated to ${first.newVal}.`,
        why: `Executing assignment on line ${line}.`,
        visual_change: `Pointer or variable badge updated to ${first.newVal}.`,
        actionType: 'assign',
      };
    }

    return {
      what: `Executing line ${line}: "${currentLineText || `line ${line}`}".`,
      why: 'Processing the next statement in execution order.',
      visual_change: 'State synchronized with current execution line.',
      actionType: 'step',
    };
  };

  const expParts = getExplanationParts();
  const variables = currentStep ? Object.entries(currentStep.variables) : [];
  const heapEntries = currentStep ? Object.entries(currentStep.heap) : [];
  const stackFrames = currentStep ? currentStep.stack_frames : [];
  const mutations = currentStep ? currentStep.mutations : [];

  return (
    <div className="explainer-container">
      {/* Top Header */}
      <div className="explainer-header">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-emerald-400" />
          <span className="explainer-title">Step Explanation</span>
        </div>

        {currentStep && (
          <div className="flex items-center gap-2">
            <span className="step-badge">
              Step {currentStep.step_index + 1} / {totalSteps}
            </span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {!currentStep ? (
        <div className="explainer-empty-state">
          <HelpCircle size={32} className="text-zinc-500 mb-2" />
          <p className="explainer-empty-title">No Active Execution</p>
          <p className="explainer-empty-desc">
            Click <strong>Run Code</strong> or press <strong>Ctrl+Enter</strong> to trace your code and inspect step-by-step educational explanations here.
          </p>
        </div>
      ) : (
        <div className="explainer-body">
          {/* Active Line Card */}
          <div className="step-line-card">
            <div className="step-line-top">
              <span className="line-pill">Line {currentStep.line}</span>
              <span className={`event-pill event-${currentStep.event_type}`}>
                {currentStep.event_type === 'line' && 'Line Step'}
                {currentStep.event_type === 'call' && 'Function Call'}
                {currentStep.event_type === 'return' && 'Return'}
                {currentStep.event_type === 'exception' && 'Exception'}
              </span>
              <span className="scope-pill">
                scope: <strong>{currentStep.function_name}</strong>
              </span>
              {currentStep.call_depth > 1 && (
                <span className="depth-pill">Depth: {currentStep.call_depth}</span>
              )}
            </div>

            {currentLineText && (
              <div className="step-code-preview">
                <Code2 size={13} className="text-emerald-400" />
                <code className="step-code-text">{currentLineText}</code>
              </div>
            )}
          </div>

          {/* Educational Step Explanation (What / Why / What Changed) */}
          <div className="step-narrative-card">
            {/* 1. What is happening? */}
            <div className="explanation-section mb-3.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>1. What is happening?</span>
              </div>
              <p className="text-sm text-zinc-100 font-medium leading-relaxed pl-5">
                {expParts.what}
              </p>
            </div>

            {/* 2. Why is it happening? */}
            <div className="explanation-section mb-3.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 mb-1">
                <HelpCircle size={13} className="text-sky-400" />
                <span>2. Why is it happening?</span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed pl-5">
                {expParts.why}
              </p>
            </div>

            {/* 3. What changed in the visualization? */}
            <div className="explanation-section">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-1">
                <Eye size={13} className="text-amber-400" />
                <span>3. What changed in the visualization?</span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed pl-5">
                {expParts.visual_change}
              </p>
            </div>
          </div>

          {/* State Deltas / Changes Card */}
          {(changedVariables.length > 0 || mutations.length > 0 || stdoutDelta.trim()) && (
            <div className="step-changes-card">
              <div className="changes-header">
                <span className="changes-title">Active Changes In This Step</span>
              </div>

              {/* Changed Variables */}
              {changedVariables.length > 0 && (
                <div className="change-group">
                  <span className="change-label">Variables:</span>
                  <div className="change-items">
                    {changedVariables.map((cv) => (
                      <div key={cv.name} className="change-chip">
                        <span className="cv-name">{cv.name}</span>
                        {cv.oldVal !== undefined && (
                          <>
                            <span className="cv-old">{cv.oldVal}</span>
                            <ArrowRight size={10} className="text-zinc-500" />
                          </>
                        )}
                        <span className="cv-new">{cv.newVal}</span>
                        <span className="cv-type">({cv.type})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mutations */}
              {mutations.length > 0 && (
                <div className="change-group">
                  <span className="change-label">Mutations:</span>
                  <div className="change-items">
                    {mutations.map((m, idx) => (
                      <div key={idx} className="mutation-chip">
                        <span className="mutation-tag">{m.operation}</span>
                        <span className="mutation-txt">{m.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stdout in this step */}
              {stdoutDelta.trim() && (
                <div className="change-group">
                  <span className="change-label">Printed Output:</span>
                  <div className="stdout-delta-chip">
                    <Terminal size={11} className="text-emerald-400" />
                    <span>{stdoutDelta.trim()}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Inspection Tabs for Deeper State Analysis */}
          <div className="explainer-tabs-wrapper">
            <div className="explainer-tabs">
              <button
                onClick={() => setActiveTab('explanation')}
                className={`explainer-tab ${activeTab === 'explanation' ? 'active' : ''}`}
              >
                <Activity size={12} />
                <span>Overview</span>
              </button>
              <button
                onClick={() => setActiveTab('vars')}
                className={`explainer-tab ${activeTab === 'vars' ? 'active' : ''}`}
              >
                <Cpu size={12} />
                <span>Variables ({variables.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('heap')}
                className={`explainer-tab ${activeTab === 'heap' ? 'active' : ''}`}
              >
                <Database size={12} />
                <span>Heap Objects ({heapEntries.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('stack')}
                className={`explainer-tab ${activeTab === 'stack' ? 'active' : ''}`}
              >
                <Layers size={12} />
                <span>Call Stack ({stackFrames.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('mutations')}
                className={`explainer-tab ${activeTab === 'mutations' ? 'active' : ''}`}
              >
                <GitCommit size={12} />
                <span>Mutations ({mutations.length})</span>
              </button>
            </div>

            <div className="tab-panel-content">
              {/* Tab: Overview */}
              {activeTab === 'explanation' && (
                <div className="tab-pane-overview">
                  <div className="overview-grid">
                    <div className="stat-card">
                      <span className="stat-label">Variables In Scope</span>
                      <span className="stat-value">{variables.length}</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label">Heap Objects</span>
                      <span className="stat-value">{heapEntries.length}</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label">Stack Depth</span>
                      <span className="stat-value">{currentStep.call_depth}</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label">Total Mutations</span>
                      <span className="stat-value">{mutations.length}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Variables */}
              {activeTab === 'vars' && (
                <div className="tab-pane-vars">
                  {variables.length === 0 ? (
                    <div className="tab-empty">No variables in current scope</div>
                  ) : (
                    <div className="vars-table">
                      {variables.map(([vName, vDesc]) => (
                        <div key={vName} className="var-row">
                          <div className="var-cell-name">
                            <span className="v-name">{vName}</span>
                            <span className="v-type">{vDesc.type}</span>
                          </div>
                          <div className="var-cell-val">
                            <code>{vDesc.value_repr}</code>
                            {vDesc.ref_id && (
                              <span className="ref-badge" title={`Memory Ref: ${vDesc.ref_id}`}>
                                → {vDesc.ref_id.replace('obj_', '#')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Heap */}
              {activeTab === 'heap' && (
                <div className="tab-pane-heap">
                  {heapEntries.length === 0 ? (
                    <div className="tab-empty">No objects currently on heap</div>
                  ) : (
                    <div className="heap-list">
                      {heapEntries.map(([objId, objDesc]) => (
                        <div key={objId} className="heap-item-card">
                          <div className="heap-item-header">
                            <span className="heap-item-id">#{objId.replace('obj_', '')}</span>
                            <span className="heap-item-class">{objDesc.class_name}</span>
                            <span className="heap-item-type">({objDesc.type})</span>
                          </div>
                          {objDesc.fields && (
                            <div className="heap-fields-list">
                              {Object.entries(objDesc.fields).map(([fKey, fVal]) => (
                                <div key={fKey} className="heap-field-line">
                                  <span className="f-key">.{fKey}:</span>
                                  <span className="f-val">
                                    {typeof fVal === 'object' && fVal && '$ref' in fVal
                                      ? `→ #${fVal.$ref.replace('obj_', '')}`
                                      : String(fVal)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          {objDesc.elements && (
                            <div className="heap-elements-preview">
                              elements: [{objDesc.elements.length} items]
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Stack */}
              {activeTab === 'stack' && (
                <div className="tab-pane-stack">
                  {stackFrames.length === 0 ? (
                    <div className="tab-empty">No active stack frames</div>
                  ) : (
                    <div className="stack-frames-list">
                      {stackFrames.map((frame, idx) => (
                        <div key={frame.frame_id || idx} className="stack-frame-item">
                          <div className="sf-header">
                            <span className="sf-name">{frame.function_name}()</span>
                            <span className="sf-line">line {frame.line}</span>
                            {idx === 0 && <span className="sf-top-pill">Active Frame</span>}
                          </div>
                          <div className="sf-vars">
                            {Object.entries(frame.variables).map(([k, v]) => (
                              <span key={k} className="sf-var-chip">
                                {k} = <strong>{v.value_repr}</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Mutations */}
              {activeTab === 'mutations' && (
                <div className="tab-pane-mutations">
                  {mutations.length === 0 ? (
                    <div className="tab-empty">No state mutations recorded in this step</div>
                  ) : (
                    <div className="mutations-list">
                      {mutations.map((m, idx) => (
                        <div key={idx} className="mutation-row">
                          <span className="m-badge">{m.operation}</span>
                          <span className="m-desc">{m.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
