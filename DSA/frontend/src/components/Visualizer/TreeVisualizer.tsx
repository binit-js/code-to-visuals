import React from 'react';

interface TreeNodeData {
  id: string;
  val: any;
  left_id?: string | null;
  right_id?: string | null;
  pointers?: string[];
}

interface TreeVisualizerProps {
  name: string;
  nodes: TreeNodeData[];
  rootId?: string | null;
}

interface LayoutNode {
  id: string;
  val: any;
  x: number;
  y: number;
  left_id?: string | null;
  right_id?: string | null;
  pointers: string[];
}

export const TreeVisualizer: React.FC<TreeVisualizerProps> = ({
  name,
  nodes = [],
  rootId,
}) => {
  if (nodes.length === 0) {
    return (
      <div className="tree-card">
        <div className="structure-card-header">
          <span className="struct-type-tag">Binary Tree</span>
          <span className="struct-name">{name}</span>
        </div>
        <div className="empty-array-placeholder">Empty Tree (None)</div>
      </div>
    );
  }

  // Build lookup map
  const nodeMap = new Map<string, TreeNodeData>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const startId = rootId || nodes[0]?.id;

  // In-order traversal positioning guarantees NO node overlaps:
  // Every left child has strictly smaller x than parent; every right child has strictly larger x.
  let inOrderIndex = 0;
  const nodePositions = new Map<string, { x: number; y: number }>();
  let maxDepth = 0;

  function computeInOrder(currId: string | null | undefined, depth: number) {
    if (!currId || !nodeMap.has(currId)) return;
    const node = nodeMap.get(currId)!;
    if (depth > maxDepth) maxDepth = depth;

    // Traverse left
    if (node.left_id) {
      computeInOrder(node.left_id, depth + 1);
    }

    // Assign current node
    const col = inOrderIndex++;
    nodePositions.set(currId, { x: col, y: depth });

    // Traverse right
    if (node.right_id) {
      computeInOrder(node.right_id, depth + 1);
    }
  }

  computeInOrder(startId, 0);

  // If some nodes weren't reached (e.g. disconnected nodes), lay them out at the end
  nodes.forEach((n) => {
    if (!nodePositions.has(n.id)) {
      nodePositions.set(n.id, { x: inOrderIndex++, y: 0 });
    }
  });

  const totalCols = Math.max(1, inOrderIndex);
  const colSpacing = Math.max(54, Math.min(80, 580 / totalCols));
  const svgWidth = Math.max(500, (totalCols + 1) * colSpacing);
  const levelHeight = 65;
  const svgHeight = Math.max(240, (maxDepth + 1) * levelHeight + 70);

  const layoutNodes: LayoutNode[] = [];
  const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];

  nodes.forEach((n) => {
    const pos = nodePositions.get(n.id);
    if (!pos) return;
    const x = 40 + pos.x * colSpacing;
    const y = 48 + pos.y * levelHeight;

    layoutNodes.push({
      id: n.id,
      val: n.val,
      x,
      y,
      left_id: n.left_id,
      right_id: n.right_id,
      pointers: n.pointers || [],
    });

    if (n.left_id && nodePositions.has(n.left_id)) {
      const cPos = nodePositions.get(n.left_id)!;
      edges.push({
        x1: x,
        y1: y,
        x2: 40 + cPos.x * colSpacing,
        y2: 48 + cPos.y * levelHeight,
      });
    }

    if (n.right_id && nodePositions.has(n.right_id)) {
      const cPos = nodePositions.get(n.right_id)!;
      edges.push({
        x1: x,
        y1: y,
        x2: 40 + cPos.x * colSpacing,
        y2: 48 + cPos.y * levelHeight,
      });
    }
  });

  return (
    <div className="tree-card">
      <div className="structure-card-header">
        <div className="flex items-center gap-2">
          <span className="struct-type-tag">Binary Tree</span>
          <span className="struct-name">{name}</span>
          <span className="struct-meta">{nodes.length} nodes (depth {maxDepth + 1})</span>
        </div>
      </div>

      <div className="tree-svg-container" style={{ overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="tree-svg"
          style={{ width: '100%', minWidth: `${Math.min(svgWidth, 600)}px` }}
        >
          <defs>
            <marker
              id="tree-arrow"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#10b981" />
            </marker>
          </defs>

          {/* Edge lines */}
          {edges.map((edge, idx) => (
            <line
              key={idx}
              x1={edge.x1}
              y1={edge.y1}
              x2={edge.x2}
              y2={edge.y2}
              stroke="#059669"
              strokeWidth="2"
              markerEnd="url(#tree-arrow)"
              strokeDasharray="none"
              opacity="0.8"
            />
          ))}

          {/* Nodes */}
          {layoutNodes.map((n) => {
            const hasPointers = n.pointers.length > 0;
            return (
              <g key={n.id} className="tree-node-group">
                {/* Pointer tags above node */}
                {hasPointers && (
                  <g transform={`translate(${n.x}, ${n.y - 25})`}>
                    <rect
                      x={-28}
                      y={-12}
                      width={56}
                      height={16}
                      rx={4}
                      fill="#064e3b"
                      stroke="#10b981"
                      strokeWidth={1}
                    />
                    <text
                      x={0}
                      y={-1}
                      textAnchor="middle"
                      fill="#a7f3d0"
                      fontSize={9}
                      fontWeight="bold"
                    >
                      {n.pointers.join(', ')}
                    </text>
                  </g>
                )}

                <circle
                  cx={n.x}
                  cy={n.y}
                  r="18"
                  className={`tree-node-circle ${hasPointers ? 'stroke-emerald-400 stroke-2' : ''}`}
                />
                <text
                  x={n.x}
                  y={n.y + 5}
                  textAnchor="middle"
                  className="tree-node-text"
                >
                  {String(n.val)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
