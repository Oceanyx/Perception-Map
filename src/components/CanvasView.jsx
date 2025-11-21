// src/components/CanvasView.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Filter, BarChart3, Edit2, ZoomIn, ZoomOut, Maximize2, Hand, MousePointer } from 'lucide-react';
import NodeDetailPanel from './NodeDetailPanel';
import Node from './Node';
import AnalyticsPanel from './AnalyticsPanel';
import LensManager from './LensManager';
import { domainColors, defaultLenses, modes, predefinedMetaTags } from '../seedData';
import { 
  db, 
  initializeDB, 
  getAllNodes, 
  getAllEdges, 
  getAllLenses,
  addNode,
  updateNode as dbUpdateNode,
  deleteNode as dbDeleteNode,
  addEdge,
  deleteEdge as dbDeleteEdge,
  updateLenses as dbUpdateLenses
} from '../lib/db';

export default function CanvasView() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [lenses, setLenses] = useState(defaultLenses);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [activeLensIds, setActiveLensIds] = useState([]);
  const [activeFilters, setActiveFilters] = useState({ domains: [], modes: [] });
  const [draggingNode, setDraggingNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLensManager, setShowLensManager] = useState(false);
  const [viewMode, setViewMode] = useState('all');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState('select'); // 'select' or 'hand'
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Shared recent meta-tags (persisted to localStorage)
  const [recentMetaTags, setRecentMetaTags] = useState(() => {
    try {
      const raw = localStorage.getItem('recentMetaTags');
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    // a small default slice to help first-time users
    return predefinedMetaTags.slice(0, 6);
  });

  const addRecentMetaTag = useCallback((tag) => {
    setRecentMetaTags(prev => {
      const next = [tag, ...prev.filter(t => t !== tag)].slice(0, 30);
      try { localStorage.setItem('recentMetaTags', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }, []);

  // Initialize database and load data
  useEffect(() => {
    async function loadData() {
      await initializeDB();
      const loadedNodes = await getAllNodes();
      const loadedEdges = await getAllEdges();
      const loadedLenses = await getAllLenses();
      
      setNodes(loadedNodes);
      setEdges(loadedEdges);
      if (loadedLenses.length > 0) {
        setLenses(loadedLenses);
      }
    }
    loadData();
  }, []);

  // Keyboard shortcut for hand tool
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' && !e.repeat && tool === 'select') {
        e.preventDefault();
        setTool('hand');
      }
      if (e.key === 'v' || e.key === 'V') {
        setTool('select');
      }
      if (e.key === 'h' || e.key === 'H') {
        setTool('hand');
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === ' ' && tool === 'hand') {
        setTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [tool]);

  // Zoom with mouse wheel
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.min(Math.max(0.3, prev + delta), 3));
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, []);

  const blendColors = useCallback((domainIds) => {
    if (!domainIds || domainIds.length === 0) return '#1E293B';
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
    const radius = domainNode.width / 2;
    const centerX = domainNode.position.x + radius;
    const centerY = domainNode.position.y + radius;
    
    return {
      centerX,
      centerY,
      radius,
      left: domainNode.position.x,
      top: domainNode.position.y,
      right: domainNode.position.x + domainNode.width,
      bottom: domainNode.position.y + domainNode.width
    };
  }, []);

  const getDomainsAtPosition = useCallback((pos) => {
    const domainNodes = nodes.filter(n => n.type === 'domain');
    const hits = [];
    for (const d of domainNodes) {
      const bounds = getDomainBounds(d);
      const dx = pos.x - bounds.centerX;
      const dy = pos.y - bounds.centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= bounds.radius) {
        hits.push(d.data.domainId);
      }
    }
    return hits;
  }, [nodes, getDomainBounds]);

  const handleDragStart = (e, node) => {
    if (node.type === 'content' && tool === 'select') {
      e.stopPropagation();
      setDraggingNode(node.id);
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleDragEnd = async (e, node) => {
    if (node.type === 'content' && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const newX = (e.clientX - canvasRect.left - dragOffset.x - pan.x) / zoom;
      const newY = (e.clientY - canvasRect.top - dragOffset.y - pan.y) / zoom;
      
      const newPos = { x: newX, y: newY };
      const domainIds = getDomainsAtPosition(newPos);

      await dbUpdateNode(node.id, { position: newPos, data: { ...node.data, domainIds } });
      
      setNodes(current => current.map(n => 
        n.id === node.id
          ? { ...n, position: newPos, data: { ...n.data, domainIds } }
          : n
      ));
    }
    setDraggingNode(null);
  };

  const handleNodeClick = (node, e) => {
    e.stopPropagation();
    if (node.type === 'content' && tool === 'select') {
      const freshNode = nodes.find(n => n.id === node.id);
      setSelectedNode(freshNode ? { ...freshNode } : node);
    }
  };

  const handleNodeHover = (node) => {
    if (node.type === 'content') {
      setHoveredNode(node.id);
    }
  };

  const handleNodeLeave = () => {
    setHoveredNode(null);
  };

  const handleUpdateNode = useCallback(async (nodeId, newData) => {
    await dbUpdateNode(nodeId, { data: newData });
    setNodes(current => current.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...newData } }
        : node
    ));
    setSelectedNode(current => {
      if (current && current.id === nodeId) {
        return { ...current, data: { ...current.data, ...newData } };
      }
      return current;
    });
  }, []);

  const handleDeleteNode = useCallback(async (nodeId) => {
    await dbDeleteNode(nodeId);
    setNodes(current => current.filter(n => n.id !== nodeId));
    setEdges(current => current.filter(e => e.source !== nodeId && e.target !== nodeId));
  }, []);

  const handleCreateEdge = useCallback(async (newEdge) => {
    await addEdge(newEdge);
    setEdges(current => [...current, newEdge]);
  }, []);

  const handleDeleteEdge = useCallback(async (edgeId) => {
    await dbDeleteEdge(edgeId);
    setEdges(current => current.filter(e => e.id !== edgeId));
  }, []);

  const handleUpdateLenses = useCallback(async (newLenses) => {
    await dbUpdateLenses(newLenses);
    setLenses(newLenses);
  }, []);

  const handleCreateNode = async () => {
    const centerX = (window.innerWidth / 2 - pan.x) / zoom;
    const centerY = (window.innerHeight / 2 - pan.y) / zoom;
    
    const newNode = {
      type: 'content',
      position: { x: centerX, y: centerY },
      data: {
        title: 'New Node',
        perceivedPattern: '',
        interpretation: '',
        activeQuestions: '',
        feltSense: '',
        agencyOrientation: 'curious',
        metaTags: [],
        patternType: 'trigger',
        beforeState: '',
        afterState: '',
        refinesNodeId: null,
        lensIds: [lenses[0]?.id || 'empathy'],
        domainIds: [],
        mode: 'field-first',
        notes: '',
        createdAt: new Date().toISOString()
      }
    };
    
    const id = await addNode(newNode);
    const nodeWithId = { ...newNode, id };
    setNodes(current => [...current, nodeWithId]);
    setSelectedNode(nodeWithId);
  };
  

  const getNodeCenter = (node) => {
    const width = node.type === 'content' ? 210 : 100;
    const height = node.type === 'content' ? 80 : 40;
    return {
      x: node.position.x + width / 2,
      y: node.position.y + height / 2
    };
  };

  const toggleFilter = (type, value) => {
    setActiveFilters(prev => {
      const current = prev[type];
      return {
        ...prev,
        [type]: current.includes(value) 
          ? current.filter(v => v !== value)
          : [...current, value]
      };
    });
  };

  const filteredNodes = nodes.filter(node => {
    if (node.type !== 'content') return true;
    
    if (viewMode !== 'all' && !node.data.domainIds?.includes(viewMode)) {
      return false;
    }

    if (activeFilters.domains.length > 0) {
      const hasMatchingDomain = activeFilters.domains.some(d => 
        node.data.domainIds?.includes(d)
      );
      if (!hasMatchingDomain) return false;
    }

    if (activeFilters.modes.length > 0) {
      if (!activeFilters.modes.includes(node.data.mode)) return false;
    }

    return true;
  });

  // Pan controls - works with hand tool OR space key
  const handleCanvasMouseDown = (e) => {
    if (tool === 'hand' || e.target === containerRef.current || e.target === canvasRef.current || e.target.tagName === 'svg') {
      if (tool === 'hand' || (e.target !== containerRef.current && e.target !== canvasRef.current && e.target.tagName !== 'svg')) {
        return; // Let hand tool work anywhere
      }
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isPanning || tool === 'hand') {
      if (tool === 'hand' && e.buttons === 1) {
        if (!isPanning) {
          setIsPanning(true);
          setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
      }
      if (isPanning) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.3));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Get cursor based on tool
  const getCursor = () => {
    if (tool === 'hand') return isPanning ? 'grabbing' : 'grab';
    return isPanning ? 'grabbing' : 'default';
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      background: '#0F1724',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Navigation Bar */}
      <div style={{
        height: '60px',
        background: '#1E293B',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'private', 'public', 'abstract'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '8px 16px',
                background: viewMode === mode ? '#6C63FF' : 'transparent',
                border: viewMode === mode ? 'none' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#E6EEF8',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: viewMode === mode ? 600 : 400,
                textTransform: 'capitalize'
              }}
            >
              {mode === 'all' ? 'All Domains' : mode}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {lenses.map(lens => (
            <button
              key={lens.id}
              onClick={() => setActiveLensIds(prev => 
                prev.includes(lens.id) ? prev.filter(id => id !== lens.id) : [...prev, lens.id]
              )}
              style={{
                padding: '6px 12px',
                background: activeLensIds.includes(lens.id) ? lens.color : 'transparent',
                border: `1px solid ${activeLensIds.includes(lens.id) ? lens.color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '6px',
                color: '#E6EEF8',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              {lens.name}
            </button>
          ))}

          <button
            onClick={() => setShowLensManager(true)}
            style={{
              padding: '8px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Edit2 size={16} />
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '8px 12px',
              background: showFilters ? '#6C63FF' : 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#E6EEF8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px'
            }}
          >
            <Filter size={16} /> Filter
          </button>

          <button
            onClick={() => setShowAnalytics(true)}
            style={{
              padding: '8px 12px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#E6EEF8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px'
            }}
          >
            <BarChart3 size={16} /> Analytics
          </button>

          <button
            onClick={handleCreateNode}
            style={{
              padding: '8px 12px',
              background: '#10B981',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            <Plus size={16} /> New Node
          </button>
        </div>
      </div>

      {/* Filters Dropdown */}
      {showFilters && (
        <div style={{
          position: 'absolute',
          top: '70px',
          right: '20px',
          width: '300px',
          background: '#1E293B',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '16px',
          zIndex: 1001,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '8px', fontWeight: 600 }}>
              Domains
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['private', 'public', 'abstract'].map(domain => (
                <button
                  key={domain}
                  onClick={() => toggleFilter('domains', domain)}
                  style={{
                    padding: '6px 12px',
                    background: activeFilters.domains.includes(domain) ? domainColors[domain] : '#0F1724',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: activeFilters.domains.includes(domain) ? '#000' : '#E6EEF8',
                    cursor: 'pointer',
                    fontSize: '13px',
                    textTransform: 'capitalize'
                  }}
                >
                  {domain}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '8px', fontWeight: 600 }}>
              Modes
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {modes.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => toggleFilter('modes', mode.id)}
                  style={{
                    padding: '6px 12px',
                    background: activeFilters.modes.includes(mode.id) ? '#6C63FF' : '#0F1724',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#E6EEF8',
                    cursor: 'pointer',
                    fontSize: '13px',
                    textTransform: 'capitalize'
                  }}
                >
                  {mode.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveFilters({ domains: [], modes: [] })}
            style={{
              width: '100%',
              padding: '8px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#94A3B8',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Tool Selector - Bottom Left */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 100
      }}>
        <button
          onClick={() => setTool('select')}
          style={{
            padding: '10px',
            background: tool === 'select' ? '#6C63FF' : '#1E293B',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#E6EEF8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Select Tool (V)"
        >
          <MousePointer size={20} />
        </button>
        <button
          onClick={() => setTool('hand')}
          style={{
            padding: '10px',
            background: tool === 'hand' ? '#6C63FF' : '#1E293B',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#E6EEF8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Hand Tool (H or Space)"
        >
          <Hand size={20} />
        </button>
      </div>

      {/* Zoom Controls - Bottom Right */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 100
      }}>
        <button
          onClick={handleZoomIn}
          style={{
            padding: '10px',
            background: '#1E293B',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#E6EEF8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Zoom In"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={handleResetView}
          style={{
            padding: '10px',
            background: '#1E293B',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#E6EEF8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Reset View"
        >
          <Maximize2 size={20} />
        </button>
        <button
          onClick={handleZoomOut}
          style={{
            padding: '10px',
            background: '#1E293B',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#E6EEF8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Zoom Out"
        >
          <ZoomOut size={20} />
        </button>
        <div style={{
          padding: '8px',
          background: '#1E293B',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          color: '#94A3B8',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={containerRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        style={{ 
          flex: 1,
          position: 'relative',
          cursor: getCursor(),
          overflow: 'hidden',
          userSelect: 'none'
        }}
      >
        <div 
          ref={canvasRef}
          style={{ 
            width: '100%',
            height: '100%',
            position: 'relative',
            backgroundImage: `
              radial-gradient(circle, rgba(30, 41, 59, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`
          }}
        >
          <div style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: '10000px',
            height: '10000px',
            position: 'absolute',
            left: '-5000px',
            top: '-5000px'
          }}>
            <svg style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%',
              pointerEvents: 'none',
              zIndex: 1,
              overflow: 'visible'
            }}>
              {edges.map(edge => {
                const source = filteredNodes.find(n => n.id === edge.source);
                const target = filteredNodes.find(n => n.id === edge.target);
                if (!source || !target) return null;
                
                const start = getNodeCenter(source);
                const end = getNodeCenter(target);
                
                const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target;
                
                return (
                  <g key={edge.id}>
                    <line
                      x1={start.x + 5000}
                      y1={start.y + 5000}
                      x2={end.x + 5000}
                      y2={end.y + 5000}
                      stroke={isHighlighted ? '#FFFFFF' : '#475569'}
                      strokeWidth={isHighlighted ? 3 : 2}
                      opacity={isHighlighted ? 0.8 : 0.4}
                      style={{ transition: 'all 0.2s' }}
                    />
                    {edge.label && (
                      <text
                        x={(start.x + end.x) / 2 + 5000}
                        y={(start.y + end.y) / 2 + 5000}
                        fill={isHighlighted ? '#FFFFFF' : '#94A3B8'}
                        fontSize="11px"
                        textAnchor="middle"
                        style={{ pointerEvents: 'none' }}
                      >
                        {edge.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {filteredNodes.map(node => (
              <div
                key={node.id}
                style={{
                  position: 'absolute',
                  left: node.position.x + 5000,
                  top: node.position.y + 5000,
                  pointerEvents: tool === 'hand' ? 'none' : 'auto'
                }}
              >
                <Node
                  node={{ ...node, position: { x: 0, y: 0 } }}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onClick={handleNodeClick}
                  onHover={handleNodeHover}
                  onLeave={handleNodeLeave}
                  isDragging={draggingNode === node.id}
                  isHovered={hoveredNode === node.id}
                  activeLensIds={activeLensIds}
                  blendColors={blendColors}
                  lenses={lenses}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedNode && (
        <NodeDetailPanel
          key={selectedNode.id}
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdate={handleUpdateNode}
          onDelete={handleDeleteNode}
          lenses={lenses}
          edges={edges}
          nodes={nodes}
          onDeleteEdge={handleDeleteEdge}
          onCreateEdge={handleCreateEdge}
          recentMetaTags={recentMetaTags}
          onAddRecentMetaTag={addRecentMetaTag}
        />
      )}

      {showAnalytics && (
        <AnalyticsPanel
          nodes={nodes}
          lenses={lenses}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {showLensManager && (
        <LensManager
          lenses={lenses}
          onClose={() => setShowLensManager(false)}
          onUpdate={handleUpdateLenses}
        />
        )}
    </div>
  );
}
