import React from 'react';

interface MatrixVisualizerProps {
  name: string;
  matrix: any[][];
  rows: number;
  cols: number;
}

export const MatrixVisualizer: React.FC<MatrixVisualizerProps> = ({
  name,
  matrix,
  rows,
  cols,
}) => {
  return (
    <div className="matrix-card">
      <div className="structure-card-header">
        <div className="flex items-center gap-2">
          <span className="struct-type-tag">2D Matrix</span>
          <span className="struct-name">{name}</span>
          <span className="struct-meta">{rows} × {cols}</span>
        </div>
      </div>

      <div className="matrix-grid-wrapper">
        <table className="matrix-table">
          <thead>
            <tr>
              <th className="matrix-corner"></th>
              {Array.from({ length: cols }).map((_, c) => (
                <th key={c} className="matrix-col-header">[{c}]</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, r) => (
              <tr key={r}>
                <th className="matrix-row-header">[{r}]</th>
                {row.map((val, c) => (
                  <td key={c} className="matrix-cell">
                    {typeof val === 'object' && val !== null ? val.$ref || 'ref' : String(val)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
