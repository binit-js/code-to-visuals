import React, { useState } from 'react';
import type { TraceStep } from '../../types/trace';
import { Database, Cpu, Layers, GitCommit } from 'lucide-react';

interface RuntimeInspectorProps {
  currentStep?: TraceStep | null;
}

export const RuntimeInspector: React.FC<RuntimeInspectorProps> = ({ currentStep }) => {
  const [activeTab, setActiveTab] = useState<'vars' | 'heap' | 'stack' | 'mutations'>('vars');

  const variables = currentStep ? Object.entries(currentStep.variables) : [];
  const heapEntries = currentStep ? Object.entries(currentStep.heap) : [];
  const stackFrames = currentStep ? currentStep.stack_frames : [];
  const mutations = currentStep ? currentStep.mutations : [];

  return (
    <div className="inspector-container">
      <div className="inspector-tabs">
        <button
          onClick={() => setActiveTab('vars')}
          className={`inspector-tab ${activeTab === 'vars' ? 'active' : ''}`}
        >
          <Database size={13} />
          <span>Variables ({variables.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('heap')}
          className={`inspector-tab ${activeTab === 'heap' ? 'active' : ''}`}
        >
          <Cpu size={13} />
          <span>Heap ({heapEntries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stack')}
          className={`inspector-tab ${activeTab === 'stack' ? 'active' : ''}`}
        >
          <Layers size={13} />
          <span>Stack ({stackFrames.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('mutations')}
          className={`inspector-tab ${activeTab === 'mutations' ? 'active' : ''}`}
        >
          <GitCommit size={13} />
          <span>Mutations ({mutations.length})</span>
        </button>
      </div>

      <div className="inspector-content">
        {!currentStep ? (
          <div className="inspector-empty">No active execution state</div>
        ) : (
          <>
            {/* Variables Tab */}
            {activeTab === 'vars' && (
              <div className="vars-table-wrapper">
                {variables.length === 0 ? (
                  <div className="inspector-empty">No local variables in current frame</div>
                ) : (
                  <table className="inspector-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variables.map(([name, desc]) => (
                        <tr key={name}>
                          <td className="var-name-cell">
                            <code>{name}</code>
                          </td>
                          <td className="var-type-cell">
                            <span className="type-badge">{desc.type}</span>
                          </td>
                          <td className="var-value-cell">
                            <span className="var-value-text">{desc.value_repr}</span>
                            {desc.ref_id && (
                              <span className="ref-tag" title={`Heap Ref: ${desc.ref_id}`}>
                                {desc.ref_id.replace('obj_', '#')}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Heap Tab */}
            {activeTab === 'heap' && (
              <div className="heap-list">
                {heapEntries.length === 0 ? (
                  <div className="inspector-empty">Heap is empty</div>
                ) : (
                  heapEntries.map(([objId, objDesc]) => (
                    <div key={objId} className="heap-card">
                      <div className="heap-card-header">
                        <span className="heap-id">{objId.replace('obj_', 'ID: #')}</span>
                        <span className="heap-class">{objDesc.class_name}</span>
                      </div>
                      <div className="heap-repr">{objDesc.value_repr}</div>
                      {objDesc.fields && Object.keys(objDesc.fields).length > 0 && (
                        <div className="heap-fields">
                          {Object.entries(objDesc.fields).map(([fk, fv]) => (
                            <div key={fk} className="heap-field-line">
                              <span className="text-zinc-400">.{fk}:</span>{' '}
                              <span className="text-emerald-300">
                                {typeof fv === 'object' && fv !== null ? fv.$ref || 'ref' : String(fv)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Stack Tab */}
            {activeTab === 'stack' && (
              <div className="stack-list">
                {stackFrames.map((frame, idx) => (
                  <div key={frame.frame_id || idx} className="stack-frame-card">
                    <div className="stack-frame-header">
                      <span className="stack-fn">{frame.function_name}()</span>
                      <span className="stack-line">Line {frame.line}</span>
                    </div>
                    <div className="stack-vars-mini">
                      {Object.entries(frame.variables).map(([k, v]) => (
                        <span key={k} className="stack-chip">
                          {k} = {v.value_repr}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Mutations Tab */}
            {activeTab === 'mutations' && (
              <div className="mutations-list">
                {mutations.length === 0 ? (
                  <div className="inspector-empty">No mutations recorded in this step</div>
                ) : (
                  mutations.map((m, idx) => (
                    <div key={idx} className="mutation-log-item">
                      <span className="mutation-op-badge">{m.operation}</span>
                      <span className="mutation-desc">{m.description}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
