// src/App.jsx
import React, { useState } from "react";
import CanvasView from "./components/CanvasView";
import TopBar from "./components/TopBar";
import QuickCaptureModal from "./components/QuickCaptureModal";
import InsightModal from "./components/InsightModal";

import { seedNodes as initialSeedNodes, seedEdges as initialSeedEdges } from "./seedData";

export default function App()  {
  // central graph state (lifted)
  const [nodes, setNodes] = useState(() => initialSeedNodes.map(n => ({ ...n })));
  const [edges, setEdges] = useState(() => initialSeedEdges.map(e => ({ ...e })));
  const [activeLensIds, setActiveLensIds] = useState([]);

  // modal state
  const [showQuick, setShowQuick] = useState(false);
  const [showInsight, setShowInsight] = useState(false);

  function addNode(node) {
    // ensure unique id and default fields
    const id = node.id || `n-${Date.now()}`;
    const toAdd = {
      id,
      position: node.position || { x: 320, y: 200 },
      data: node.data || { label: node.label || "Untitled" },
      type: node.type || "default",
      style: node.style || { padding: 12, borderRadius: 8 },
    };
    setNodes(n => [...n, toAdd]);
    return toAdd;
  }

  return (
    <div className="app-root">
      <div style={{ position: "absolute", top: 18, left: 18, zIndex: 1200 }}>
        <TopBar
          onQuickCapture={() => setShowQuick(true)}
          onOpenInsight={() => setShowInsight(true)}
        />
      </div>

      <div className="canvas-shell">
        <CanvasView
          nodes={nodes}
          edges={edges}
          setNodes={setNodes}
          setEdges={setEdges}
          activeLensIds={activeLensIds}
          setActiveLensIds={setActiveLensIds}
        />
      </div>

      {showQuick && (
        <QuickCaptureModal
          onClose={() => setShowQuick(false)}
          addNode={(n) => { addNode(n); setShowQuick(false); }}
        />
      )}

      {showInsight && (
        <InsightModal
          onClose={() => setShowInsight(false)}
          addNode={(n) => { addNode(n); setShowInsight(false); }}
          currentNodes={nodes}
        />
      )}
    </div>
  );
}
