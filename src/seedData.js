//src/seedData.js

const domainColors = {
  private: "#FDE68A",
  public: "#BFDBFE",
  abstract: "#C7F9D9"
};

const seedNodes = [
  {
    id: "d-private",
    type: "domain",
    position: { x: 120, y: 120 },
    width: 700,
    height: 520,
    data: { label: "Private", domainId: "private" }
  },
  {
    id: "d-public",
    type: "domain",
    position: { x: 540, y: 120 },
    width: 700,
    height: 520,
    data: { label: "Public", domainId: "public" }
  },
  {
    id: "d-abstract",
    type: "domain",
    position: { x: 330, y: 380 },
    width: 720,
    height: 420,
    data: { label: "Abstract", domainId: "abstract" }
  },
  { 
    id: "l-empathy", 
    type: "lens",
    position: { x: 200, y: 40 }, 
    data: { label: "Lens: Empathy", lensId: "empathy", color: "#EC4899" }
  },
  { 
    id: "l-systems", 
    type: "lens",
    position: { x: 360, y: 40 }, 
    data: { label: "Lens: Systems", lensId: "systems", color: "#3B82F6" }
  },
  { 
    id: "l-aesthetic", 
    type: "lens",
    position: { x: 520, y: 40 }, 
    data: { label: "Lens: Aesthetic", lensId: "aesthetic", color: "#8B5CF6" }
  },
  {
    id: "n-1",
    type: "content",
    position: { x: 320, y: 250 },
    data: { 
      title: "Argument with Sam",
      body: "Had a disagreement about project priorities. Felt unheard and frustrated.",
      lensIds: ["empathy"], 
      domainIds: ["private", "public"],
      mode: "reflect",
      notes: "Need to follow up tomorrow",
      createdAt: new Date().toISOString()
    }
  },
  {
    id: "n-2",
    type: "content",
    position: { x: 650, y: 280 },
    data: { 
      title: "Manager expectations",
      body: "Unclear deliverables for Q4. Need clarification on scope.",
      lensIds: ["systems"], 
      domainIds: ["public"],
      mode: "capture",
      createdAt: new Date().toISOString()
    }
  },
  {
    id: "n-3",
    type: "content",
    position: { x: 480, y: 450 },
    data: { 
      title: "Late-night rumination",
      body: "Why do I always worry about things I can't control?",
      lensIds: ["aesthetic", "empathy"], 
      domainIds: ["private", "abstract"],
      mode: "explore",
      createdAt: new Date().toISOString()
    }
  }
];

const seedEdges = [
  { id: "e1", source: "n-1", target: "n-2" },
  { id: "e2", source: "n-2", target: "n-3" },
  { id: "e3", source: "n-1", target: "n-3", animated: true }
];
