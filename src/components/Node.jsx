// src/components/Node.jsx
import React from 'react';
import { domainColors } from '../seedData';

export default function Node({ node, onDragStart, onDragEnd, onClick, isDragging, activeLensIds, blendColors, lenses }) {
  const modeIcons = {
    capture: '📝',
    reflect: '🤔',
    explore: '🔍'
  };

  if (node.type === 'domain') {
    const color = domainColors[node.data.domainId];
    
    return (
      <div
        style={{
          position: 'absolute',
          left: node.position.x,
          top: node.position.y,
          width: node.width,
          height: node.height,
          borderRadius: '50%',
          background: `${color}18`,
          border: `2px dashed ${color}40`,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '30px'
        }}
      >
        <span style={{ 
          fontSize: '18px', 
          fontWeight: 700, 
          color: color,
          opacity: 0.6,
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          {node.data.label}
        </span>
      </div>
    );
  }

  const domainIds = node.data?.domainIds || [];
  const lensIds = node.data?.lensIds || [];
  const matches = lensIds.filter(l => activeLensIds.includes(l)).length;

  let background = blendColors(domainIds);
  let border = '1px solid rgba(255,255,255,0.15)';
  let boxShadow = '0 2px 8px rgba(0,0,0,0.2)';

  if (matches === 1) {
    const activeLens = lenses.find(l => activeLensIds.includes(l.id) && lensIds.includes(l.id));
    border = activeLens ? `2px solid ${activeLens.color}` : '2px solid #6C63FF';
    boxShadow = `0 6px 20px ${activeLens?.color}40`;
  } else if (matches > 1) {
    border = '3px solid #00BFA6';
    boxShadow = '0 10px 30px rgba(0,191,166,0.3)';
  } else if (activeLensIds.length > 0) {
    background = 'rgba(15,23,36,0.7)';
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, node)}
      onDragEnd={(e) => onDragEnd(e, node)}
      onClick={() => onClick(node)}
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        minWidth: '180px',
        maxWidth: '240px',
        background,
        border,
        boxShadow,
        borderRadius: '12px',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 1000 : 10,
        transition: 'all 0.2s'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '-8px',
        left: '8px',
        display: 'flex',
        gap: '4px',
        zIndex: 10
      }}>
        {node.data.mode && (
          <div style={{
            padding: '2px 6px',
            background: '#1E293B',
            borderRadius: '4px',
            fontSize: '11px',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '3px'
          }}>
            <span>{modeIcons[node.data.mode]}</span>
            <span style={{ color: '#94A3B8', textTransform: 'capitalize' }}>{node.data.mode}</span>
          </div>
        )}
        
        {lensIds?.map(lensId => {
          const lens = lenses.find(l => l.id === lensId);
          return lens ? (
            <div
              key={lensId}
              style={{
                padding: '2px 6px',
                background: lens.color,
                borderRadius: '4px',
                fontSize: '11px',
                color: '#fff',
                fontWeight: 500,
                textTransform: 'capitalize'
              }}
            >
              {lens.name}
            </div>
          ) : null;
        })}
      </div>

      <div style={{ 
        padding: '16px 12px 12px 12px',
        color: '#E6EEF8'
      }}>
        <div style={{ 
          fontWeight: 600, 
          marginBottom: '6px',
          fontSize: '14px',
          lineHeight: '1.4'
        }}>
          {node.data.title || 'Untitled'}
        </div>
        
        {node.data.body && (
          <div style={{ 
            fontSize: '12px', 
            color: '#94A3B8',
            lineHeight: '1.4',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {node.data.body}
          </div>
        )}
      </div>
    </div>
  );
}