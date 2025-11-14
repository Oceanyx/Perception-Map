// src/components/QuickCaptureModal.jsx
import React, { useState } from "react";

export default function QuickCaptureModal({ onClose, addNode }) {
  const [title, setTitle] = useState("");

  function save() {
    const newNode = {
      id: `n-${Date.now()}`,
      type: "default",
      position: { x: 320 + Math.random() * 120, y: 200 + Math.random() * 80 },
      data: { label: title || "Quick note", lensIds: [], domainIds: [], provisional: true },
      style: { padding: 12, borderRadius: 8 }
    };
    addNode(newNode);
  }

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(7,10,20,0.6)", zIndex: 1400 }}>
      <div style={{ width: 420, background: "#071022", padding: 16, borderRadius: 10 }}>
        <h4 style={{ color: "#E6EEF8" }}>Quick Capture</h4>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="One-line capture" style={{ width: "100%", padding: 8, marginTop: 8 }} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          <button onClick={onClose} style={{ padding: 8, borderRadius: 8, background: "transparent", color: "#cfe7ff", border: "1px solid rgba(255,255,255,0.06)" }}>Cancel</button>
          <button onClick={() => { save(); onClose(); }} style={{ padding: 8, borderRadius: 8, background: "#6C63FF", color: "#fff" }}>Save</button>
        </div>
      </div>
    </div>
  );
}
