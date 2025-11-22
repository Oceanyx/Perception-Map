// src/components/CanvasView.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Filter, BarChart3, Edit2, ZoomIn, ZoomOut, Maximize2, Hand, MousePointer } from 'lucide-react';
import NodeDetailPanel from './NodeDetailPanel';
import Node from './Node';
import AnalyticsPanel from './AnalyticsPanel';
import LensManager from './LensManager';
import LeftSidebar from './LeftSidebar';
import PurposeModal from './PurposeModal';
import LegendModal from './LegendModal';
import { domainColors, defaultLenses, modes, predefinedMetaTags, connectionTypes} from '../seedData';
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
  updateEdge,
  deleteEdge as dbDeleteEdge,
  updateLenses as dbUpdateLenses
} from '../lib/db';

export default function CanvasView({purposeData}) {
  const [focusedDomain, setFocusedDomain] = useState(null);
  const [showLegend, setShowLegend] = useState(false);
  const [showPurposeModal, setShowPurposeModal] = useState(false);
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
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 400, y: 200 });
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
    
    /*console.log('Loaded nodes:', loadedNodes);
    console.log('Loaded edges:', loadedEdges);
    console.log('Loaded lenses:', loadedLenses);
    */
    
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

const handleUpdateEdge = useCallback(async (edgeId, updates) => {
    // If updating type, clear the label so it uses the connection type name
    if (updates.type) {
      const connType = connectionTypes.find(c => c.id === updates.type);
      updates.label = connType?.name || updates.label;
    }
    await updateEdge(edgeId, updates);
    setEdges(current => current.map(e => e.id === edgeId ? { ...e, ...updates } : e));
  }, []);
  
  const handleUpdateLenses = useCallback(async (newLenses) => {
    await dbUpdateLenses(newLenses);
    setLenses(newLenses);
  }, []);

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (!data.nodes || !data.edges) {
          alert('Invalid map file format');
          return;
        }
        
        if (!window.confirm('This will replace your current map. Continue?')) {
          return;
        }
        
        // Clear existing data
        await db.nodes.clear();
        await db.edges.clear();
        
        // Import new data
        await db.nodes.bulkAdd(data.nodes);
        await db.edges.bulkAdd(data.edges);
        
        if (data.lenses) {
          await db.lenses.clear();
          await db.lenses.bulkAdd(data.lenses);
          setLenses(data.lenses);
        }
        
        // Reload
        const loadedNodes = await getAllNodes();
        const loadedEdges = await getAllEdges();
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        
        alert('Map imported successfully!');
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import map. Please check the file format.');
      }
    };
    input.click();
  };

  const handleExportJSON = () => {
    const data = {
      nodes,
      edges,
      lenses,
      purposeData,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `perception-map-${purposeData?.title.replace(/\s+/g, '-').toLowerCase() || 'untitled'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // const handleExportPNG = () => {
  //   const originalText = 'Export PNG';
  //   const container = containerRef.current;
  //   const canvas = canvasRef.current;
  //   if (!container || !canvas) return;

  //   // Create offscreen canvas
  //   const exportCanvas = document.createElement('canvas');
  //   const ctx = exportCanvas.getContext('2d');
    
  //   // Set canvas size to viewport
  //   exportCanvas.width = container.offsetWidth;
  //   exportCanvas.height = container.offsetHeight;
    
  //   // Fill background
  //   ctx.fillStyle = '#0F1724';
  //   ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    
  //   // Draw grid pattern
  //   ctx.save();
  //   const gridSize = 20 * zoom;
  //   const offsetX = pan.x % gridSize;
  //   const offsetY = pan.y % gridSize;
    
  //   ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
  //   for (let x = offsetX; x < exportCanvas.width; x += gridSize) {
  //     for (let y = offsetY; y < exportCanvas.height; y += gridSize) {
  //       ctx.beginPath();
  //       ctx.arc(x, y, 1, 0, Math.PI * 2);
  //       ctx.fill();
  //     }
  //   }
  //   ctx.restore();
    
  //   // Draw edges
  //   ctx.save();
  //   edges.forEach(edge => {
  //     const source = filteredNodes.find(n => n.id === edge.source);
  //     const target = filteredNodes.find(n => n.id === edge.target);
  //     if (!source || !target) return;
      
  //     const start = getNodeCenter(source);
  //     const end = getNodeCenter(target);
  //     const connType = connectionTypes.find(c => c.id === edge.type) || connectionTypes[0];
      
  //     const screenStartX = start.x * zoom + pan.x;
  //     const screenStartY = start.y * zoom + pan.y;
  //     const screenEndX = end.x * zoom + pan.x;
  //     const screenEndY = end.y * zoom + pan.y;
      
  //     ctx.strokeStyle = connType.color;
  //     ctx.lineWidth = 2;
  //     ctx.globalAlpha = 0.8;
      
  //     if (connType.strokeDasharray && connType.strokeDasharray !== 'none') {
  //       const dashArray = connType.strokeDasharray.split(',').map(n => parseInt(n));
  //       ctx.setLineDash(dashArray);
  //     } else {
  //       ctx.setLineDash([]);
  //     }
      
  //     ctx.beginPath();
  //     ctx.moveTo(screenStartX, screenStartY);
  //     ctx.lineTo(screenEndX, screenEndY);
  //     ctx.stroke();
      
  //     // Draw arrow if needed
  //     if (connType.arrow) {
  //       const angle = Math.atan2(screenEndY - screenStartY, screenEndX - screenStartX);
  //       const arrowSize = 8;
  //       ctx.fillStyle = connType.color;
  //       ctx.beginPath();
  //       ctx.moveTo(screenEndX, screenEndY);
  //       ctx.lineTo(
  //         screenEndX - arrowSize * Math.cos(angle - Math.PI / 6),
  //         screenEndY - arrowSize * Math.sin(angle - Math.PI / 6)
  //       );
  //       ctx.lineTo(
  //         screenEndX - arrowSize * Math.cos(angle + Math.PI / 6),
  //         screenEndY - arrowSize * Math.sin(angle + Math.PI / 6)
  //       );
  //       ctx.closePath();
  //       ctx.fill();
  //     }
      
  //     // Draw label
  //     if (edge.label || connType.name) {
  //       const label = edge.label && edge.label !== connType.name ? edge.label : connType.name;
  //       const midX = (screenStartX + screenEndX) / 2;
  //       const midY = (screenStartY + screenEndY) / 2;
        
  //       ctx.font = '14px Inter, sans-serif';
  //       ctx.fillStyle = connType.color;
  //       ctx.textAlign = 'center';
  //       ctx.textBaseline = 'bottom';
  //       ctx.fillText(label, midX, midY - 5);
  //     }
  //   });
  //   ctx.restore();
  //   // Reset alpha for nodes
  //   ctx.globalAlpha = 1;
  //   ctx.setLineDash([]);

  //   // Draw nodes
  //   ctx.globalAlpha = 1;
  //   filteredNodes.forEach(node => {
  //     ctx.globalAlpha = 1; // Reset for each node
  //     const screenX = node.position.x * zoom + pan.x;
  //     const screenY = node.position.y * zoom + pan.y;
      
  //     if (node.type === 'domain') {
  //       // Draw domain circle
  //       const radius = (node.width / 2) * zoom;
  //       const color = domainColors[node.data.domainId];
        
  //       ctx.save();
  //       ctx.globalAlpha = 0.18;
  //       ctx.fillStyle = color;
  //       ctx.beginPath();
  //       ctx.arc(screenX + radius, screenY + radius, radius, 0, Math.PI * 2);
  //       ctx.fill();
  //       ctx.restore();
        
  //       ctx.strokeStyle = color;
  //       ctx.lineWidth = 2;
  //       ctx.globalAlpha = 0.4;
  //       ctx.setLineDash([5, 5]);
  //       ctx.beginPath();
  //       ctx.arc(screenX + radius, screenY + radius, radius, 0, Math.PI * 2);
  //       ctx.stroke();
  //       ctx.setLineDash([]);
        
  //       // Draw domain label
  //       ctx.globalAlpha = 1;
  //       ctx.font = `bold ${18 * zoom}px Inter, sans-serif`;
  //       ctx.fillStyle = color;
  //       ctx.textAlign = 'center';
  //       ctx.textBaseline = 'middle';
  //       ctx.fillText(node.data.label.toUpperCase(), screenX + radius, screenY + radius);
  //     } else {
  //       // Draw content node
  //       const width = 210 * zoom;
  //       const height = 80 * zoom;
        
  //       // Background with gradient
  //       const domainIds = node.data?.domainIds || [];
  //       if (domainIds.length > 0) {
  //         const gradient = ctx.createLinearGradient(screenX, screenY, screenX + width, screenY + height);
  //         if (domainIds.length === 1) {
  //           const color = domainColors[domainIds[0]];
  //           gradient.addColorStop(0, `${color}25`);
  //           gradient.addColorStop(1, `${color}15`);
  //         } else if (domainIds.length >= 2) {
  //           gradient.addColorStop(0, `${domainColors[domainIds[0]]}25`);
  //           gradient.addColorStop(1, `${domainColors[domainIds[1]]}25`);
  //         }
  //         ctx.fillStyle = gradient;
  //       } else {
  //         ctx.fillStyle = '#1E293B';
  //       }
        
  //       ctx.beginRadius = 12 * zoom;
  //       roundRect(ctx, screenX, screenY, width, height, 12 * zoom);
  //       ctx.fill();
        
  //       // Border
  //       ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  //       ctx.lineWidth = 1;
  //       roundRect(ctx, screenX, screenY, width, height, 12 * zoom);
  //       ctx.stroke();
        
  //       // Lens badges
  //       const lensIds = node.data?.lensIds || [];
  //       let badgeX = screenX + 8 * zoom;
  //       const badgeY = screenY - 8 * zoom;
  //       lensIds.forEach(lensId => {
  //         const lens = lenses.find(l => l.id === lensId);
  //         if (lens) {
  //           ctx.fillStyle = lens.color;
  //           roundRect(ctx, badgeX, badgeY, 60 * zoom, 16 * zoom, 4 * zoom);
  //           ctx.fill();
            
  //           ctx.font = `${11 * zoom}px Inter, sans-serif`;
  //           ctx.fillStyle = '#fff';
  //           ctx.textAlign = 'left';
  //           ctx.textBaseline = 'top';
  //           ctx.fillText(lens.name, badgeX + 6 * zoom, badgeY + 3 * zoom);
            
  //           badgeX += 65 * zoom;
  //         }
  //       });
        
  //       // Title
  //       ctx.font = `${14 * zoom}px Inter, sans-serif`;
  //       ctx.fillStyle = '#E6EEF8';
  //       ctx.textAlign = 'left';
  //       ctx.textBaseline = 'top';
  //       const title = node.data.title || 'Untitled';
  //       ctx.fillText(title, screenX + 12 * zoom, screenY + 16 * zoom);
        
  //       // Body preview (if exists)
  //       if (node.data.perceivedPattern) {
  //         ctx.font = `${12 * zoom}px Inter, sans-serif`;
  //         ctx.fillStyle = '#94A3B8';
  //         const preview = node.data.perceivedPattern.substring(0, 40) + '...';
  //         ctx.fillText(preview, screenX + 12 * zoom, screenY + 40 * zoom);
  //       }
  //     }
  //   });
    
  //   // Helper function for rounded rectangles
  //   function roundRect(ctx, x, y, width, height, radius) {
  //     ctx.beginPath();
  //     ctx.moveTo(x + radius, y);
  //     ctx.lineTo(x + width - radius, y);
  //     ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  //     ctx.lineTo(x + width, y + height - radius);
  //     ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  //     ctx.lineTo(x + radius, y + height);
  //     ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  //     ctx.lineTo(x, y + radius);
  //     ctx.quadraticCurveTo(x, y, x + radius, y);
  //     ctx.closePath();
  //   }
    
  //   // Export as PNG
  //   exportCanvas.toBlob((blob) => {
  //     if (!blob) {
  //       alert('Failed to create image');
  //       return;
  //     }
      
  //     const url = URL.createObjectURL(blob);
  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = `perception-map-${purposeData?.title.replace(/\s+/g, '-').toLowerCase() || 'untitled'}-${Date.now()}.png`;
  //     document.body.appendChild(a); // Add to DOM
  //     a.click();
  //     document.body.removeChild(a); // Remove from DOM
      
  //     // Clean up after a delay
  //     setTimeout(() => URL.revokeObjectURL(url), 100);
  //   }, 'image/png', 0.95); // 95% quality
  // };
  const handleExportPNG = async () => {
    // Load html2canvas dynamically
    if (!window.html2canvas) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      document.head.appendChild(script);
      await new Promise(resolve => script.onload = resolve);
    }

    // Temporarily hide UI elements
    setSelectedNode(null); // Close detail panel
    setShowAnalytics(false);
    setShowLensManager(false);
    setShowFilters(false);
    
    // Wait a moment for React to re-render
    await new Promise(resolve => setTimeout(resolve, 100));

    const container = containerRef.current;
    if (!container) return;

    try {
      const canvas = await window.html2canvas(container, {
        backgroundColor: '#0F1724',
        scale: 2,
        logging: false
      });

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chroma-${purposeData?.title.replace(/\s+/g, '-').toLowerCase() || 'untitled'}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export PNG. Please try again.');
    }
  };

  const handleCreateNode = async () => {
    const centerX = (window.innerWidth / 2 - pan.x) / zoom;
    const centerY = (window.innerHeight / 2 - pan.y - 60) / zoom; // -60 for nav bar
    
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
    setZoom(0.8);
    setPan({ x: 400, y: 200 });
  };

  const handleDomainFocus = (domainId) => {
    if (focusedDomain === domainId) {
      // Exit focus mode
      setFocusedDomain(null);
      handleResetView();
      return;
    }

    // Find the domain node
    const domainNode = nodes.find(n => n.type === 'domain' && n.data.domainId === domainId);
    if (!domainNode) return;

    // Calculate center of domain
    const bounds = getDomainBounds(domainNode);
    const targetZoom = 1.2;
    
    // Center the domain circle on screen
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = (window.innerHeight - 60) / 2 + 60; // -60 for top nav
    
    const targetPanX = viewportCenterX - bounds.centerX * targetZoom;
    const targetPanY = viewportCenterY - bounds.centerY * targetZoom;

    // Animate to focus
    setZoom(targetZoom);
    setPan({ x: targetPanX, y: targetPanY });
    setFocusedDomain(domainId);
  };

  // Exit focus mode with ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && focusedDomain) {
        setFocusedDomain(null);
        handleResetView();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [focusedDomain]);
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
              onClick={() => {
                setViewMode(mode);
                if (mode !== 'all') {
                  handleDomainFocus(mode);
                } else {
                  setFocusedDomain(null);
                  handleResetView();
                }
              }}
              style={{
                padding: '8px 16px',
                background: focusedDomain === mode || (viewMode === mode && !focusedDomain) ? '#6C63FF' : 'transparent',
                border: focusedDomain === mode || (viewMode === mode && !focusedDomain) ? 'none' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#E6EEF8',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: focusedDomain === mode || (viewMode === mode && !focusedDomain) ? 600 : 400,
                textTransform: 'capitalize',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {mode === 'all' ? 'All Domains' : `${focusedDomain === mode ? '◀ ' : ''}${mode}`}
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

      {/* Left Sidebar */}
      <LeftSidebar
        onImport={handleImportJSON}
        onExportJSON={handleExportJSON}
        onExportPNG={handleExportPNG}
        onShowPurpose={() => setShowPurposeModal(true)}
        onShowLegend={() => setShowLegend(true)}
        tool={tool}
        onToolChange={setTool}
      />
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
            left: '0px',
            top: '0px'
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
              <defs>
                {/* Gradient for refines connection */}
                <linearGradient id="refinesGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#F59E0B', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#FBBF24', stopOpacity: 1 }} />
                </linearGradient>
                {/* Arrow markers */}
                <marker id="arrowInfluences" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L9,3 z" fill="#6C63FF" />
                </marker>
                <marker id="arrowRefines" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L9,3 z" fill="#F59E0B" />
                </marker>
              </defs>
              {edges.map(edge => {
                const source = filteredNodes.find(n => n.id === edge.source);
                const target = filteredNodes.find(n => n.id === edge.target);
                if (!source || !target) return null;
                
                const start = getNodeCenter(source);
                const end = getNodeCenter(target);
                
                const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target;
                const connType = connectionTypes.find(c => c.id === edge.type) || connectionTypes[0];
                
                // Fade edges in focus mode
                let edgeOpacity = isHighlighted ? 0.8 : 0.6;
                if (focusedDomain) {
                  const sourceInFocus = source.type === 'content' && source.data.domainIds?.includes(focusedDomain);
                  const targetInFocus = target.type === 'content' && target.data.domainIds?.includes(focusedDomain);
                  if (!sourceInFocus && !targetInFocus) {
                    edgeOpacity = 0.1;
                  }
                }

                // Calculate curved path for contradicts
                const midX = (start.x + end.x) / 2;
                const midY = (start.y + end.y) / 2;
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const perpX = -dy * 0.1;
                const perpY = dx * 0.1;
                
                // Determine what label to show
                const displayLabel = edge.label && edge.label !== connType.name ? edge.label : connType.name;
                
                return (
                  <g key={edge.id}>
                    {edge.type === 'contradicts' ? (
                      <path
                        d={`M ${start.x} ${start.y} Q ${midX + perpX} ${midY + perpY} ${end.x} ${end.y}`}
                        stroke={isHighlighted ? '#FFFFFF' : connType.color}
                        strokeWidth={isHighlighted ? 3 : 2}
                        opacity={edgeOpacity}
                        fill="none"
                        strokeDasharray={connType.strokeDasharray}
                        style={{ transition: 'all 0.2s' }}
                      />
                    ) : (
                      <line
                        x1={start.x}
                        y1={start.y}
                        x2={end.x}
                        y2={end.y}
                        stroke={connType.gradient ? 'url(#refinesGradient)' : (isHighlighted ? '#FFFFFF' : connType.color)}
                        strokeWidth={isHighlighted ? 3 : 2}
                        opacity={edgeOpacity}
                        strokeDasharray={connType.strokeDasharray}
                        markerEnd={connType.arrow ? (edge.type === 'refines' ? 'url(#arrowRefines)' : 'url(#arrowInfluences)') : 'none'}
                        style={{ transition: 'all 0.2s' }}
                      />
                    )}
                    <text
                      x={(start.x + end.x) / 2}
                      y={(start.y + end.y) / 2 - 5}
                      fill={isHighlighted ? '#FFFFFF' : connType.color}
                      fontSize="14px"
                      fontWeight="500"
                      textAnchor="middle"
                      style={{ pointerEvents: 'none' }}
                    >
                      {displayLabel}
                    </text>
                  </g>
                );
              })}
            </svg>

            {console.log('Filtered nodes:', filteredNodes.map(n => ({ id: n.id, type: n.type, position: n.position })))}
            {filteredNodes.map(node => {
              // Calculate opacity based on focus mode
              let opacity = 1;
              if (focusedDomain) {
                if (node.type === 'domain') {
                  opacity = node.data.domainId === focusedDomain ? 1 : 0.15;
                } else if (node.type === 'content') {
                  opacity = node.data.domainIds?.includes(focusedDomain) ? 1 : 0.2;
                }
              }

              return (
                <div
                  key={node.id}
                  style={{
                    position: 'absolute',
                    left: node.position.x,
                    top: node.position.y,
                    pointerEvents: tool === 'hand' ? 'none' : 'auto',
                    opacity: opacity,
                    transition: 'opacity 0.3s ease'
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
            )})}
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
          onUpdateEdge={handleUpdateEdge}
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
      {showPurposeModal && purposeData && (
        <PurposeModal
          purposeData={purposeData}
          onClose={() => setShowPurposeModal(false)}
          onEdit={() => {
            setShowPurposeModal(false);
            // TODO: Re-open purpose screen for editing
            alert('Edit purpose: Coming soon!');
          }}
        />
      )}
      {showLegend && (
        <LegendModal
          lenses={lenses}
          onClose={() => setShowLegend(false)}
        />
      )}
    </div>
  );
}
