// src/components/InsightModal.jsx
import React, { useState, useMemo } from "react";

/**
 * Props:
 * - onClose(): close modal
 * - addNode(node): function to add node to graph (must accept node object)
 * - currentNodes: array of nodes (so we can present domain options)
 */
export default function InsightModal({ onClose, addNode, currentNodes = [] }) {
  const domainNodes = useMemo(() => currentNodes.filter(n => n.type === "domain"), [currentNodes]);
  const lensNodes = useMemo(() => currentNodes.filter(n => n.type === "lens"), [currentNodes]);

  const [title, setTitle] = useState("");
  const [domainId, setDomainId] = useState(domainNodes.length ? domainNodes[0].data.domainId : "");
  const [selectedLensIds, setSelectedLensIds] = useState([]);
  const [mode, setMode] = useState("reflect");
  const [felt, setFelt] = useState("");
  const [body, setBody] = useState("");
  const [provisional, setProvisional] = useState(true);

  function toggleLens(lid) {
    setSelectedLensIds(prev => prev.includes(lid) ? prev.filter(x => x !== lid) : [...prev, lid]);
  }

  function submit() {
    // place node roughly at domain center if domain selected
    let position = { x: 340, y: 200 };
    if (domainId) {
      const dn = domainNodes.find(d => d.data && d.data.domainId === domainId);
      if (dn && dn.position && dn.style) {
        const left = dn.position.x;
        const top = dn.position.y;
        const width = Number(String(dn.style.width || 600).replace("px", ""));
        const height = Number(String(dn.style.height || 400).replace("px", ""));
        position = { x: left + width / 2 - 40, y: top + height / 2 - 40 };
      }
    }

    const node = {
      id: `n-${Date.now()}`,
      type: "default",
      position,
      data: {
        label: title || (felt ? felt : "Insight"),
        felt,
        body,
        lensIds: selectedLensIds,
        domainIds: domainId ? [domainId] : [],
        mode,
        provisional
      },
      style: { padding: 12, borderRadius: 8 }
    };

    addNode(node);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(7,10,20,0.6)", zIndex: 1600
    }}>
      <div style={{ width: 720, maxHeight: "84vh", overflowY: "auto", background: "#071022", padding: 18, borderRadius: 12, boxShadow: "0 12px 40px rgba(2,6,23,0.6)" }}>
        <h3 style={{ color: "#E6EEF8", marginBottom: 8 }}>Insight entry</h3>
        <div style={{ color: "#cfe7ff", marginBottom: 10, fontSize: 13 }}>Use this guided form to capture a perception. We'll create a provisional node you can edit later.</div>

        <label style={{ color: "#dbeafe", fontSize: 13 }}>Title (short)</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Short title" style={{ width: "100%", padding: 8, marginTop: 6, marginBottom: 10 }} />

        <label style={{ color: "#dbeafe", fontSize: 13 }}>Felt-sense (one sentence)</label>
        <input value={felt} onChange={e => setFelt(e.target.value)} placeholder="How does this feel?" style={{ width: "100%", padding: 8, marginTop: 6, marginBottom: 10 }} />

        <label style={{ color: "#dbeafe", fontSize: 13 }}>Details (optional)</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Notes, memory, context..." style={{ width: "100%", padding: 8, minHeight: 80, marginTop: 6, marginBottom: 10 }} />

        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: "#dbeafe", fontSize: 13 }}>Domain</label>
            <select value={domainId} onChange={e => setDomainId(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 6 }}>
              <option value="">(none)</option>
              {domainNodes.map(d => <option key={d.id} value={d.data.domainId}>{d.data.label || d.data.domainId}</option>)}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ color: "#dbeafe", fontSize: 13 }}>Mode</label>
            <select value={mode} onChange={e => setMode(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 6 }}>
              <option value="reflect">Reflect</option>
              <option value="capture">Capture</option>
              <option value="explore">Explore</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ color: "#dbeafe", fontSize: 13 }}>Lenses (click to toggle)</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {lensNodes.map(l => (
              <div key={l.id} onClick={() => toggleLens(l.data && l.data.lensId)} style={{
                padding: "6px 10px",
                borderRadius: 8,
                background: selectedLensIds.includes(l.data && l.data.lensId) ? "#6C63FF" : "#0b1220",
                color: "#cfe7ff",
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.04)"
              }}>
                {l.data && l.data.label}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <input id="prov" type="checkbox" checked={provisional} onChange={e => setProvisional(e.target.checked)} />
          <label htmlFor="prov" style={{ color: "#cfe7ff" }}>Mark as provisional (recommended)</label>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 12px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.06)", color: "#cfe7ff" }}>Cancel</button>
          <button onClick={submit} style={{ padding: "8px 12px", borderRadius: 8, background: "#6C63FF", color: "#fff" }}>Create node</button>
        </div>
      </div>
    </div>
  );
}
