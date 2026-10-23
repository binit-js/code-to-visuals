import React from 'react';

interface GraphEdge {
  from: string;
  to: string;
}

interface GraphVisualizerProps {
  name: string;
  nodes: string[];
  edges: GraphEdge[];
  activePointers?: Record<string, string>;
}

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  name,
  nodes = [],
  edges = [],
  activePointers = {},
}) => {
  const width = Math.max(480, nodes.length * 45);
  const height = 260;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx - 50, cy - 45, Math.max(75, nodes.length * 12));

  // Position nodes along circumference
  const nodePositions = new Map<string, { x: number; y: number }>();
  nodes.forEach((node, idx) => {
    const angle = (idx / (nodes.length || 1)) * 2 * Math.PI - Math.PI / 2;
    nodePositions.set(node, {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  });

  // Find pointers targeting each node
  const pointersByNode = new Map<string, string[]>();
  Object.entries(activePointers).forEach(([ptrName, targetNode]) => {
    const arr = pointersByNode.get(targetNode) || [];
    arr.push(ptrName);
    pointersByNode.set(targetNode, arr);
  });

  return (
    <div className="graph-card">
      <div className="structure-card-header">
        <div className="flex items-center gap-2">
          <span className="struct-type-tag">Graph</span>
          <span className="struct-name">{name}</span>
          <span className="struct-meta">
            {nodes.length} vertices, {edges.length} edges
          </span>
        </div>
      </div>

      <div className="graph-svg-container" style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="graph-svg" style={{ minWidth: `${width}px` }}>
          <defs>
            <marker
              id="graph-arrow"
              viewBox="0 0 10 10"
              refX="20"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#10b981" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map((edge, idx) => {
            const p1 = nodePositions.get(edge.from);
            const p2 = nodePositions.get(edge.to);
            if (!p1 || !p2) return null;

            return (
              <line
                key={idx}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#10b981"
                strokeWidth="1.5"
                markerEnd="url(#graph-arrow)"
                opacity="0.85"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const pos = nodePositions.get(node);
            if (!pos) return null;
            const nodePointers = pointersByNode.get(node) || [];
            const isActive = nodePointers.length > 0;

            return (
              <g key={node} className="graph-node-group">
                {/* Pointer tags above vertex */}
                {isActive && (
                  <g transform={`translate(${pos.x}, ${pos.y - 24})`}>
                    <rect
                      x={-24}
                      y={-10}
                      width={48}
                      height={14}
                      rx={3}
                      fill="#064e3b"
                      stroke="#10b981"
                      strokeWidth={1}
                    />
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      fill="#a7f3d0"
                      fontSize={8}
                      fontWeight="bold"
                    >
                      {nodePointers.join(', ')}
                    </text>
                  </g>
                )}

                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="17"
                  className={`graph-node-circle ${isActive ? 'stroke-emerald-400 stroke-2 fill-emerald-950' : ''}`}
                />
                <text x={pos.x} y={pos.y + 4} textAnchor="middle" className="graph-node-text">
                  {node}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
