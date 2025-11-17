// ============ NODE COMPONENT ============
import React from 'react';
import { domainColors } from '../seedData';

export default function Node({ node, onDragStart, onDragEnd, onClick, isDragging, activeLensIds, blendColors }) {
  const lensColors = {
    empathy: '#EC4899',
    systems: '#3B82F6',
    aesthetic: '#8B5CF6'
  };

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
          borderRadius: node.data.domainId === 'abstract' ? '30%' : '50%',
          background: color,
          opacity: 0.12,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
          fontWeight: 700,
          color: color,
          userSelect: 'none'
        }}
      >
        <span style={{ opacity: 0.3 }}>{node.data.label}</span>
      </div>
    );
  }

  if (node.type === 'lens') {
    return (
      <div
        onClick={() => onClick(node)}
        style={{
          position: 'absolute',
          left: node.position.x,
          top: node.position.y,
          padding: '8px 14px',
          background: activeLensIds.includes(node.data.lensId) ? node.data.color : '#0B1220',
          border: `2px solid ${activeLensIds.includes(node.data.lensId) ? node.data.color : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '20px',
          color: '#E6EEF8',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          transition: 'all 0.2s',
          userSelect: 'none',
          boxShadow: activeLensIds.includes(node.data.lensId) ? '0 4px 12px rgba(0,0,0,0.3)' : 'none'
        }}
      >
        {node.data.label}
      </div>
    );
  }

  // Content node
  const domainIds = node.data?.domainIds || [];
  const lensIds = node.data?.lensIds || [];
  const matches = lensIds.filter(l => activeLensIds.includes(l)).length;

  let background = blendColors(domainIds);
  let border = '1px solid rgba(255,255,255,0.08)';
  let boxShadow = '0 2px 8px rgba(0,0,0,0.1)';

  if (matches === 1) {
    border = '2px solid #6C63FF';
    boxShadow = '0 6px 20px rgba(108,99,255,0.2)';
  } else if (matches > 1) {
    border = '3px solid #00BFA6';
    boxShadow = '0 10px 30px rgba(0,191,166,0.25)';
  } else if (activeLensIds.length > 0) {
    background = 'rgba(7,16,34,0.5)';
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
        borderRadius: '10px',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 1000 : 10
      }}
    >
      {/* Badges */}
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
            background: '#0F172A',
            borderRadius: '4px',
            fontSize: '11px',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '3px'
          }}>
            <span>{modeIcons[node.data.mode]}</span>
            <span style={{ color: '#94A3B8', textTransform: 'capitalize' }}>{node.data.mode}</span>
          </div>
        )}
        
        {lensIds?.map(lensId => (
          <div
            key={lensId}
            style={{
              padding: '2px 6px',
              background: lensColors[lensId] || '#6C63FF',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#fff',
              fontWeight: 500,
              textTransform: 'capitalize'
            }}
          >
            {lensId}
          </div>
        ))}
      </div>

      {/* Content */}
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