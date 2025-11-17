import React, { useState, useCallback, useEffect, useRef } from 'react';
import { seedNodes, seedEdges, domainColors } from '../seedData';
import NodeDetailPanel from './NodeDetailPanel';
// ============ NODE COMPONENT ============
export function Node({ node, onDragStart, onDragEnd, onClick, isDragging, activeLensIds, blendColors }) {
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

// ============ MAIN APP ============
export default function PerceptionMap() {
  const [nodes, setNodes] = useState(seedNodes);
  const [edges] = useState(seedEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeLensIds, setActiveLensIds] = useState([]);
  const [draggingNode, setDraggingNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  const blendColors = useCallback((domainIds) => {
    if (!domainIds || domainIds.length === 0) return '#071022';
    if (domainIds.length === 1) {
      const color = domainColors[domainIds[0]];
      return `linear-gradient(180deg, ${color}25, ${color}15)`;
    }
    if (domainIds.length === 2) {
      const c1 = domainColors[domainIds[0]];
      const c2 = domainColors[domainIds[1]];
      return `linear-gradient(135deg, ${c1}25 0%, ${c2}25 100%)`;
    }
    const c1 = domainColors[domainIds[0]];
    const c2 = domainColors[domainIds[1]];
    const c3 = domainColors[domainIds[2]];
    return `linear-gradient(135deg, ${c1}20 0%, ${c2}20 50%, ${c3}20 100%)`;
  }, []);

  const getDomainBounds = useCallback((domainNode) => {
    return {
      left: domainNode.position.x,
      top: domainNode.position.y,
      right: domainNode.position.x + domainNode.width,
      bottom: domainNode.position.y + domainNode.height
    };
  }, []);

  const getDomainsAtPosition = useCallback((pos) => {
    const domainNodes = nodes.filter(n => n.type === 'domain');
    const hits = [];
    for (const d of domainNodes) {
      const bounds = getDomainBounds(d);
      if (pos.x >= bounds.left && pos.x <= bounds.right && 
          pos.y >= bounds.top && pos.y <= bounds.bottom) {
        hits.push(d.data.domainId);
      }
    }
    return hits;
  }, [nodes, getDomainBounds]);

  const handleDragStart = (e, node) => {
    if (node.type === 'content') {
      setDraggingNode(node.id);
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleDragEnd = (e, node) => {
    if (node.type === 'content' && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - canvasRect.left - dragOffset.x;
      const newY = e.clientY - canvasRect.top - dragOffset.y;
      
      const newPos = { x: newX, y: newY };
      const domainIds = getDomainsAtPosition(newPos);

      setNodes(current => current.map(n => 
        n.id === node.id
          ? { ...n, position: newPos, data: { ...n.data, domainIds } }
          : n
      ));
    }
    setDraggingNode(null);
  };

  const handleNodeClick = (node) => {
    if (node.type === 'lens') {
      const lensId = node.data.lensId;
      setActiveLensIds(prev => 
        prev.includes(lensId) ? prev.filter(id => id !== lensId) : [...prev, lensId]
      );
    } else if (node.type === 'content') {
      setSelectedNode(node);
    }
  };

  const handleUpdateNode = useCallback((nodeId, newData) => {
    setNodes(current => current.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...newData } }
        : node
    ));
  }, []);

  // Get node center position
  const getNodeCenter = (node) => {
    const width = node.type === 'content' ? 210 : 100;
    const height = node.type === 'content' ? 80 : 40;
    return {
      x: node.position.x + width / 2,
      y: node.position.y + height / 2
    };
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#0F1724',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <div 
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '100%', 
          position: 'relative',
          backgroundImage: `
            radial-gradient(circle, rgba(30, 41, 59, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      >
        {/* SVG for connections */}
        <svg style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          {edges.map(edge => {
            const source = nodes.find(n => n.id === edge.source);
            const target = nodes.find(n => n.id === edge.target);
            if (!source || !target) return null;
            
            const start = getNodeCenter(source);
            const end = getNodeCenter(target);
            
            return (
              <line
                key={edge.id}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={edge.animated ? '#6C63FF' : '#334155'}
                strokeWidth={edge.animated ? 2 : 1}
                strokeDasharray={edge.animated ? '5,5' : 'none'}
                opacity={0.6}
              />
            );
          })}
        </svg>

        {/* Render all nodes */}
        {nodes.map(node => (
          <Node
            key={node.id}
            node={node}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={handleNodeClick}
            isDragging={draggingNode === node.id}
            activeLensIds={activeLensIds}
            blendColors={blendColors}
          />
        ))}
      </div>

      {/* Active Lenses Indicator */}
      {activeLensIds.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.1)',
          zIndex: 1000
        }}>
          <div style={{ color: '#94A3B8', fontSize: '11px', marginBottom: '6px' }}>
            Active Lenses
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {activeLensIds.map(id => (
              <div key={id} style={{
                padding: '4px 8px',
                background: '#6C63FF',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#fff',
                textTransform: 'capitalize'
              }}>
                {id}
              </div>
            ))}
            <button
              onClick={() => setActiveLensIds([])}
              style={{
                padding: '4px 8px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                color: '#94A3B8',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Node Detail Panel */}
      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdate={handleUpdateNode}
        />
      )}
    </div>
  );
}