import React from 'react';
import type { MutationEvent, VariableDescriptor } from '../../types/trace';

interface ArrayVisualizerProps {
  name: string;
  elements: any[];
  mutations?: MutationEvent[];
  variables?: Record<string, VariableDescriptor>;
  pointers?: Record<string, number>;
}

const POINTER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  i: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40' },
  j: { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/40' },
  left: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/40' },
  low: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/40' },
  right: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' },
  high: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' },
  mid: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40' },
  middle: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40' },
  key: { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/40' },
  target: { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/40' },
};

export const ArrayVisualizer: React.FC<ArrayVisualizerProps> = ({
  name,
  elements = [],
  mutations = [],
  variables = {},
  pointers: payloadPointers,
}) => {
  // Combine payload pointers with scanned integer variables
  const pointers: { name: string; index: number }[] = [];

  if (payloadPointers) {
    Object.entries(payloadPointers).forEach(([pName, pIdx]) => {
      pointers.push({ name: pName, index: pIdx });
    });
  } else if (variables) {
    Object.entries(variables).forEach(([varName, varDesc]) => {
      if (
        varDesc.is_primitive &&
        typeof varDesc.value === 'number' &&
        Number.isInteger(varDesc.value) &&
        varDesc.value >= 0 &&
        varDesc.value < elements.length &&
        varName !== name &&
        varName !== 'len'
      ) {
        pointers.push({ name: varName, index: varDesc.value });
      }
    });
  }

  // Check recent mutation on this array
  const activeMutation = mutations.find(
    (m) => m.target_name === name || m.description?.toLowerCase().includes(name.toLowerCase())
  );

  return (
    <div className="array-card">
      <div className="structure-card-header">
        <div className="flex items-center gap-2">
          <span className="struct-type-tag">Array</span>
          <span className="struct-name">{name}</span>
          <span className="struct-meta">length: {elements.length}</span>
        </div>

        {activeMutation && (
          <div className="mutation-badge">
            <span className="mutation-dot"></span>
            <span>{activeMutation.description || activeMutation.operation}</span>
          </div>
        )}
      </div>

      <div className="array-container">
        {elements.length === 0 ? (
          <div className="empty-array-placeholder">Empty Array [ ]</div>
        ) : (
          <div className="array-cells-track">
            {elements.map((item, idx) => {
              const matchingPointers = pointers.filter((p) => p.index === idx);
              const isMutated =
                activeMutation &&
                ((activeMutation.operation === 'append' && idx === elements.length - 1) ||
                  (activeMutation.operation === 'setitem' && activeMutation.index_or_key === idx));

              const displayVal =
                typeof item === 'object' && item !== null
                  ? item.$ref || JSON.stringify(item)
                  : String(item);

              return (
                <div key={idx} className="array-column">
                  {/* Pointers above cell */}
                  <div className="pointer-container">
                    {matchingPointers.map((p) => {
                      const color = POINTER_COLORS[p.name.toLowerCase()] || {
                        bg: 'bg-emerald-500/20',
                        text: 'text-emerald-300',
                        border: 'border-emerald-500/40',
                      };
                      return (
                        <div
                          key={p.name}
                          className={`pointer-badge border ${color.bg} ${color.text} ${color.border}`}
                          title={`Pointer ${p.name} = index ${p.index}`}
                        >
                          <span>{p.name}</span>
                          <span className="pointer-arrow">▼</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cell Box */}
                  <div className={`array-cell ${isMutated ? 'cell-mutated' : ''} ${matchingPointers.length > 0 ? 'cell-pointed' : ''}`}>
                    <span className="cell-value">{displayVal}</span>
                  </div>

                  {/* Index beneath cell */}
                  <div className="cell-index">[{idx}]</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
