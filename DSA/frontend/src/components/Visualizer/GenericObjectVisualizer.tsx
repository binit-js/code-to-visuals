import React from 'react';

interface GenericObjectVisualizerProps {
  name: string;
  type: string;
  className: string;
  valueRepr: string;
  fields?: Record<string, any>;
  entries?: [any, any][];
  elements?: any[];
}

export const GenericObjectVisualizer: React.FC<GenericObjectVisualizerProps> = ({
  name,
  type,
  className,
  valueRepr,
  fields,
  entries,
  elements,
}) => {
  return (
    <div className="generic-card">
      <div className="structure-card-header">
        <div className="flex items-center gap-2">
          <span className="struct-type-tag">Object</span>
          <span className="struct-name">{name}</span>
          <span className="struct-meta">({className || type})</span>
        </div>
      </div>

      <div className="generic-content">
        <div className="generic-repr">{valueRepr}</div>

        {fields && Object.keys(fields).length > 0 && (
          <div className="generic-fields-table">
            <div className="field-table-title">Attributes / Fields</div>
            {Object.entries(fields).map(([k, v]) => (
              <div key={k} className="field-row">
                <span className="field-key">{k}</span>
                <span className="field-val">
                  {typeof v === 'object' && v !== null ? v.$ref || JSON.stringify(v) : String(v)}
                </span>
              </div>
            ))}
          </div>
        )}

        {entries && entries.length > 0 && (
          <div className="generic-fields-table">
            <div className="field-table-title">Key-Value Pairs</div>
            {entries.map(([k, v], idx) => (
              <div key={idx} className="field-row">
                <span className="field-key">{String(k)}</span>
                <span className="field-val">
                  {typeof v === 'object' && v !== null ? v.$ref || JSON.stringify(v) : String(v)}
                </span>
              </div>
            ))}
          </div>
        )}

        {elements && elements.length > 0 && (
          <div className="generic-fields-table">
            <div className="field-table-title">Elements</div>
            <div className="flex flex-wrap gap-1">
              {elements.map((elem, idx) => (
                <span key={idx} className="chip">
                  {typeof elem === 'object' && elem !== null ? elem.$ref || JSON.stringify(elem) : String(elem)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
