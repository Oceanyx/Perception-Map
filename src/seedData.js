// src/seedData.js
export const domainColors = {
  private: "#FDE68A",   // warm yellow
  public:  "#BFDBFE",   // soft blue
  abstract:"#C7F9D9"    // soft green
};

export const seedNodes = [
  // --- Domains (large background shapes, render first so they are behind others) ---
  {
    id: "d-private",
    type: "domain",
    position: { x: 120, y: 120 },
    data: { label: "Private", domainId: "private" },
    // large style: width/height are used as style props in CanvasView
    style: { width: 700, height: 520, borderRadius: "50%", background: `${domainColors.private}`, opacity: 0.12 },
    draggable: false,
    selectable: false
  },
  {
    id: "d-public",
    type: "domain",
    position: { x: 540, y: 120 },
    data: { label: "Public", domainId: "public" },
    style: { width: 700, height: 520, borderRadius: "50%", background: `${domainColors.public}`, opacity: 0.12 },
    draggable: false,
    selectable: false
  },
  {
    id: "d-abstract",
    type: "domain",
    position: { x: 330, y: 380 },
    data: { label: "Abstract", domainId: "abstract" },
    style: { width: 720, height: 420, borderRadius: "30%", background: `${domainColors.abstract}`, opacity: 0.09 },
    draggable: false,
    selectable: false
  },

  // --- Lens nodes (click to toggle lens) ---
  { id: "l-empathy", position: { x: 200, y: 40 }, data: { label: "Lens: Empathy", lensId: "empathy" }, type: "lens" },
  { id: "l-systems", position: { x: 360, y: 40 }, data: { label: "Lens: Systems", lensId: "systems" }, type: "lens" },
  { id: "l-aesthetic", position: { x: 520, y: 40 }, data: { label: "Lens: Aesthetic", lensId: "aesthetic" }, type: "lens" },

  // --- Content nodes (regular) ---
  {
    id: "n-1",
    position: { x: 220, y: 180 },
    data: { label: "Argument with Sam", lensIds: ["empathy"], domainIds: ["private","public"] },
    style: { padding: 12 }
  },
  {
    id: "n-2",
    position: { x: 480, y: 180 },
    data: { label: "Manager expectations", lensIds: ["systems"], domainIds: ["public"] },
    style: { padding: 12 }
  },
  {
    id: "n-3",
    position: { x: 340, y: 320 },
    data: { label: "Late-night rumination", lensIds: ["aesthetic","empathy"], domainIds: ["private"] },
    style: { padding: 12}
  }
];

export const seedEdges = [
  { id: "e1", source: "n-1", target: "n-2", animated: false },
  { id: "e2", source: "n-2", target: "n-3", animated: false },
  { id: "e3", source: "n-1", target: "n-3", animated: true }
];
