import React, { useState, useCallback, useEffect, useRef } from 'react';
import { seedNodes, seedEdges, domainColors } from '../seedData';
import NodeDetailPanel from './NodeDetailPanel';
import Node from './Node';

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