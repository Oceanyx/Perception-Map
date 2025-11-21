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

// Pattern types for nodes
export const patternTypes = [
  { id: 'trigger', name: 'Trigger', description: 'Initial activation or stimulus' },
  { id: 'loop', name: 'Loop', description: 'Recurring pattern or cycle' },
  { id: 'reframe', name: 'Reframe', description: 'Shift in perspective' },
  { id: 'insight', name: 'Insight', description: 'New understanding' },
  { id: 'conflict', name: 'Conflict', description: 'Tension or contradiction' },
  { id: 'resolution', name: 'Resolution', description: 'Integration or settling' }
];

// Agency orientation states
export const agencyStates = [
  { id: 'fused', name: 'Fused', description: 'Identified with the pattern' },
  { id: 'defended', name: 'Defended', description: 'Protecting against the pattern' },
  { id: 'curious', name: 'Curious', description: 'Exploring the pattern' },
  { id: 'open', name: 'Open', description: 'Spacious awareness of pattern' }
];

/**
 * Meta-pattern library (grouped).
 * This is the canonical expanded list, grouped by high-level clusters.
 * UI will show only suggested/recent slices by default.
 */
export const metaPatternLibrary = {
  internal: [
    "Over-analysis",
    "Rumination spiral",
    "Self-abandonment",
    "Harsh inner critic",
    "Perfectionistic tightening",
    "Collapse response",
    "Freeze–dissociation arc",
    "Identity fusion",
    "Hypervigilant scanning",
    "Internal jury"
  ],
  relational: [
    "Belonging loop",
    "Approval seeking",
    "Conflict avoidance",
    "Pursuer–withdrawer",
    "Control loop",
    "Projection loop",
    "Deference pattern",
    "Role-locking",
    "Persona conflict",
    "Merging → resentment"
  ],
  meaningMaking: [
    "Narrative inflation",
    "Grand pattern projection",
    "Hyper-interpretation",
    "Epistemic spiraling",
    "Framework stacking",
    "Concept-grab",
    "Story reification"
  ],
  temporal: [
    "Old-script reactivation",
    "Repetition compulsion",
    "Inner child protector conflict",
    "Later insight reframing",
    "Scene re-entry loop",
    "Time-looping"
  ]
};

// Flattened predefined list (backwards compatible)
export const predefinedMetaTags = [
  ...metaPatternLibrary.internal,
  ...metaPatternLibrary.relational,
  ...metaPatternLibrary.meaningMaking,
  ...metaPatternLibrary.temporal
];

// Light-weight semantic hints to map keywords -> likely tags for suggestions.
// These are used to generate the 'Suggested' slice dynamically.
export const metaPatternHints = [
  { tag: "Perfectionistic tightening", keywords: ["tight", "perfection", "perfect", "pressure"] },
  { tag: "Control loop", keywords: ["control", "control loop", "controlling", "manage"] },
  { tag: "Over-analysis", keywords: ["over-analy", "overanalysis", "rumin", "think"] },
  { tag: "Belonging loop", keywords: ["belong", "fit in", "accepted", "approval"] },
  { tag: "Approval seeking", keywords: ["approval", "praise", "validation"] },
  { tag: "Rumination spiral", keywords: ["replay", "replaying", "ruminat", "can't stop thinking"] },
  { tag: "Identity fusion", keywords: ["identity", "who am i", "fused", "self"] },
  { tag: "Projection loop", keywords: ["project", "projecting", "assume", "assumption"] },
  { tag: "Hyper-interpretation", keywords: ["interpret", "meaning", "read into", "over-interpret"] },
  { tag: "Narrative inflation", keywords: ["story", "narrative", "grand pattern", "meaning inflation"] },
  { tag: "Repetition compulsion", keywords: ["repeat", "repeating", "again", "pattern repeats"] },
  { tag: "Freeze–dissociation arc", keywords: ["dissoc", "dissociated", "space out", "freeze"] },
  { tag: "Pursuer–withdrawer", keywords: ["pursuer", "withdraw", "avoid", "chase"] },
  { tag: "Framework stacking", keywords: ["framework", "model", "theory", "stack"] },
  { tag: "Scene re-entry loop", keywords: ["re-entry", "re-enter", "scenario replay", "imagine again"] }
];

// Mode definitions
export const modes = [
  { id: 'field-first', name: 'Field-first', description: 'Sensing the relational or energetic field' },
  { id: 'concept-first', name: 'Concept-first', description: 'Interpreting via frameworks' },
  { id: 'social-first', name: 'Social-first', description: 'Attuning to others\' reactions' },
  { id: 'narrative-first', name: 'Narrative-first', description: 'Understanding through story and meaning' }
];

export const seedNodes = [
  {
    id: "d-private",
    type: "domain",
    position: { x: 100, y: 150 },
    width: 600,
    height: 600,
    data: { label: "Private", domainId: "private" }
  },
  {
    id: "d-public",
    type: "domain",
    position: { x: 450, y: 150 },
    width: 600,
    height: 600,
    data: { label: "Public", domainId: "public" }
  },
  {
    id: "d-abstract",
    type: "domain",
    position: { x: 275, y: 430 },
    width: 600,
    height: 600,
    data: { label: "Abstract", domainId: "abstract" }
  },
  {
    id: "n-1",
    type: "content",
    position: { x: 420, y: 340 },
    data: { 
      title: "Argument with Sam",
      
      // Core Content
      perceivedPattern: "Had a disagreement about project priorities",
      interpretation: "Felt unheard and frustrated - maybe I'm not valued on the team",
      activeQuestions: "Why does this keep happening? Am I communicating poorly?",
      
      // Embodied/Affective Layer
      feltSense: "Tightness in chest, heat rising",
      agencyOrientation: "defended",
      
      // Meta-Pattern Hooks
      metaTags: ["Control loop", "Over-analysis"],
      patternType: "conflict",
      
      // Temporal Layer
      beforeState: "Felt confident about my ideas",
      afterState: "Doubting my place on the team",
      refinesNodeId: null,
      
      // Original fields
      lensIds: ["empathy"], 
      domainIds: ["private", "public"],
      mode: "social-first",
      notes: "Need to follow up tomorrow",
      createdAt: new Date().toISOString()
    }
  },
  {
    id: "n-2",
    type: "content",
    position: { x: 650, y: 320 },
    data: { 
      title: "Manager expectations",
      
      perceivedPattern: "Unclear deliverables for Q4",
      interpretation: "Management is disorganized or intentionally vague",
      activeQuestions: "What are they actually expecting from me?",
      
      feltSense: "Fog, confusion, slight anxiety",
      agencyOrientation: "curious",
      
      metaTags: ["Control loop"],
      patternType: "trigger",
      
      beforeState: "",
      afterState: "",
      refinesNodeId: null,
      
      lensIds: ["systems"], 
      domainIds: ["public"],
      mode: "concept-first",
      notes: "",
      createdAt: new Date().toISOString()
    }
  },
  {
    id: "n-3",
    type: "content",
    position: { x: 480, y: 580 },
    data: { 
      title: "Late-night rumination",
      
      perceivedPattern: "Replaying the day's interactions in my mind",
      interpretation: "I'm trying to control what I can't control",
      activeQuestions: "Why do I always worry about things I can't control?",
      
      feltSense: "Spinning thoughts, restless energy",
      agencyOrientation: "fused",
      
      metaTags: ["Over-analysis", "Control loop"],
      patternType: "loop",
      
      beforeState: "Relaxed evening",
      afterState: "Unable to settle",
      refinesNodeId: null,
      
      lensIds: ["aesthetic", "empathy"], 
      domainIds: ["abstract", "private"],
      mode: "narrative-first",
      notes: "",
      createdAt: new Date().toISOString()
    }
  }
];

export const seedEdges = [
  { id: "e1", source: "n-1", target: "n-2", label: "Related to", type: "influences" },
  { id: "e2", source: "n-2", target: "n-3", label: "Triggers", type: "influences" },
  { id: "e3", source: "n-1", target: "n-3", label: "Connects to", type: "mirrors" }
];
