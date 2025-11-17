// src/seedData.js

export const domainColors = {
  private: "#FFB84D",
  public: "#4D9FFF",
  abstract: "#6EE7B7"
};

export const defaultLenses = [
  { id: 'empathy', name: 'Empathy', color: '#EC4899' },
  { id: 'systems', name: 'Systems', color: '#3B82F6' },
  { id: 'aesthetic', name: 'Aesthetic', color: '#8B5CF6' }
];

export const seedNodes = [
  {
    id: "d-private",
    type: "domain",
    position: { x: 150, y: 200 },
    width: 450,
    height: 450,
    data: { label: "Private", domainId: "private" }
  },
  {
    id: "d-public",
    type: "domain",
    position: { x: 400, y: 200 },
    width: 450,
    height: 450,
    data: { label: "Public", domainId: "public" }
  },
  {
    id: "d-abstract",
    type: "domain",
    position: { x: 275, y: 380 },
    width: 450,
    height: 450,
    data: { label: "Abstract", domainId: "abstract" }
  },
  {
    id: "n-1",
    type: "content",
    position: { x: 420, y: 340 },
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
    position: { x: 580, y: 320 },
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
    position: { x: 450, y: 520 },
    data: { 
      title: "Late-night rumination",
      body: "Why do I always worry about things I can't control?",
      lensIds: ["aesthetic", "empathy"], 
      domainIds: ["abstract", "private"],
      mode: "explore",
      createdAt: new Date().toISOString()
    }
  }
];

export const seedEdges = [
  { id: "e1", source: "n-1", target: "n-2", label: "Related to" },
  { id: "e2", source: "n-2", target: "n-3", label: "Triggers" },
  { id: "e3", source: "n-1", target: "n-3", label: "Connects to" }
];