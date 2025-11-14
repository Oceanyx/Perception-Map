// src/components/CanvasView.jsx
import React, { useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "reactflow";
import "reactflow/dist/style.css";

import { domainColors } from "../seedData";

export default function CanvasView({
  nodes,
  edges,
  setNodes,
  setEdges,
  activeLensIds,
  setActiveLensIds,
}) {
  const [domainHoverIds, setDomainHoverIds] = React.useState([]);

  // helper: compute bounds for domain node (left/top + width/height)
  function getDomainBounds(domainNode) {
    const left = domainNode.position.x || 0;
    const top = domainNode.position.y || 0;
    // Accept style.width/height as numbers or strings; handle both
    const width = domainNode.style && domainNode.style.width
      ? Number(String(domainNode.style.width).replace("px", ""))
      : 600;
    const height = domainNode.style && domainNode.style.height
      ? Number(String(domainNode.style.height).replace("px", ""))
      : 400;
    return { left, top, right: left + width, bottom: top + height, width, height };
  }

  function getDomainsAtPosition(pos) {
    const domainNodes = nodes.filter(n => n.type === "domain");
    const hits = [];
    for (const d of domainNodes) {
      const bounds = getDomainBounds(d);
      // We'll use the node center for tests: treat pos as center
      const x = pos.x, y = pos.y;
      if (x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom) {
        if (d.data && d.data.domainId) hits.push({ domainId: d.data.domainId, nodeId: d.id, bounds });
      }
    }
    return hits;
  }

  // on dragging, compute hovered domains and set highlight
  const onNodeDrag = useCallback((event, node) => {
    const pos = node.position || { x: 0, y: 0 };
    const hits = getDomainsAtPosition(pos);
    setDomainHoverIds(hits.map(h => h.domainId));
  }, [nodes]);

  // on drag stop: compute domains, update node position and domainIds, snap to center if single domain
  const onNodeDragStop = useCallback((event, node) => {
    const pos = node.position || { x: 0, y: 0 };
    const hits = getDomainsAtPosition(pos);
    const domainIds = hits.map(h => h.domainId);

    setNodes(current => current.map(n => {
      if (n.id !== node.id) return n;
      let newPos = { ...node.position };
      // if exactly one domain hit, snap to that domain's center
      if (hits.length === 1) {
        const b = hits[0].bounds;
        newPos = { x: b.left + b.width / 2 - 40, y: b.top + b.height / 2 - 40 }; // offset so node isn't exactly centered under minimap
      }
      const newData = { ...(n.data || {}), domainIds, provisional: (domainIds.length > 0) ? true : (n.data && n.data.provisional) };
      return { ...n, position: newPos, data: newData };
    }));

    setDomainHoverIds([]);
  }, [nodes]);

  // reactflow handlers
  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);
  const onConnect = useCallback((connection) => setEdges((eds) => addEdge(connection, eds)), [setEdges]);

  // lens toggle from clicking lens nodes
  const toggleLens = useCallback((lid) => {
    setActiveLensIds(prev => prev.includes(lid) ? prev.filter(x => x !== lid) : [...prev, lid]);
  }, [setActiveLensIds]);

  const onNodeClick = useCallback((evt, node) => {
    if (node.type === "lens" && node.data && node.data.lensId) {
      toggleLens(node.data.lensId);
    }
  }, [toggleLens]);

  // compute styles for nodes based on lenses and domain hover
  useEffect(() => {
    setNodes(curr => curr.map(node => {
      if (node.type === "domain") {
        const hovered = domainHoverIds.includes(node.data && node.data.domainId);
        const base = { ...(node.style || {}) };
        return { ...node, style: { ...base, opacity: hovered ? 0.20 : (base.opacity ?? 0.10), boxShadow: hovered ? "0 10px 30px rgba(108,99,255,0.08)" : "none", transition: "opacity 120ms ease" } };
      }

      const nodeLensIds = (node.data && node.data.lensIds) || [];
      const matches = nodeLensIds.filter(l => activeLensIds.includes(l)).length;
      const domainIds = (node.data && node.data.domainIds) || [];

      // background by domains
      let background = "#071022";
      if (domainIds.length === 1) {
        const c = domainColors[domainIds[0]] || "#ffffff";
        background = `linear-gradient(180deg, ${c}20, ${c}10)`;
      } else if (domainIds.length > 1) {
        const c1 = domainColors[domainIds[0]] || "#ffffff";
        const c2 = domainColors[domainIds[1]] || "#ffffff";
        background = `linear-gradient(90deg, ${c1}20 0%, ${c2}20 100%)`;
      }

      let border = "1px solid rgba(255,255,255,0.03)";
      let boxShadow = "none";
      if (matches === 1) { border = "2px solid #6C63FF"; boxShadow = "0 6px 20px rgba(108,99,255,0.12)"; }
      else if (matches > 1) { border = "3px solid #00BFA6"; boxShadow = "0 10px 30px rgba(0,191,166,0.14)"; }
      else if (activeLensIds.length > 0) { background = "linear-gradient(180deg, rgba(7,16,34,0.6), rgba(7,16,34,0.6))"; }

      if (node.type === "lens") {
        const lid = node.data && node.data.lensId;
        const active = activeLensIds.includes(lid);
        background = active ? "#6C63FF" : "#0f1724";
        border = active ? "2px solid rgba(108,99,255,0.22)" : border;
        boxShadow = active ? "0 6px 20px rgba(108,99,255,0.12)" : boxShadow;
        return { ...node, style: { padding: 8, borderRadius: 8, minWidth: 120, background, border, boxShadow, color: "#e6eef8" } };
      }

      return { ...node, style: { padding: 12, borderRadius: 8, minWidth: 160, background, border, boxShadow, color: "#e6eef8" } };
    }));
  }, [activeLensIds, domainHoverIds, setNodes]);

  // Active lenses overlay
  const ActiveLensOverlay = () => {
    if (!activeLensIds || activeLensIds.length === 0) return null;
    return (
      <div style={{ position: "absolute", left: 14, top: 14, zIndex: 1000 }}>
        <div style={{ background: "rgba(0,0,0,0.45)", padding: 8, borderRadius: 8 }}>
          <strong style={{ color: "#fff", fontSize: 12 }}>Active lenses</strong>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            {activeLensIds.map(l => (
              <div key={l}
                   onClick={() => toggleLens(l)}
                   style={{ padding: "4px 8px", background: "#0b1220", borderRadius: 6, border: "1px solid rgba(255,255,255,0.04)", color: "#cfe7ff", cursor: "pointer", fontSize: 12 }}>
                {l}
              </div>
            ))}
            <button onClick={() => setActiveLensIds([])} style={{ marginLeft: 6, padding: "4px 8px", borderRadius: 6, background: "#6C63FF", color: "#fff", border: "none" }}>Clear</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <ActiveLensOverlay />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        fitView
        style={{ width: "100%", height: "100%" }}
      >
        <Background color="#0b1220" gap={18} />
        <MiniMap nodeColor={(node) => node.type === "domain" ? "#111827" : (node.type === "lens" ? "#9f7aea" : "#60a5fa")} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
