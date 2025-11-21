// src/components/NodeDetailPanel.jsx
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, HelpCircle, MessageSquare } from 'lucide-react';
import { domainColors, patternTypes, agencyStates, predefinedMetaTags, metaPatternHints, metaPatternLibrary, modes } from '../seedData';

// NodeDetailPanel now accepts two optional props related to meta-tag UX:
// - recentMetaTags: array of recent tags (shared across canvas)
// - onAddRecentMetaTag(tag): callback to add a tag to the shared recent list
export default function NodeDetailPanel({
  node,
  onClose,
  onUpdate,
  onDelete,
  lenses,
  edges,
  nodes,
  onDeleteEdge,
  onCreateEdge,
  recentMetaTags = [],
  onAddRecentMetaTag = () => {}
}) {
  const [formData, setFormData] = useState({
    title: node.data.title || '',
    perceivedPattern: node.data.perceivedPattern || '',
    interpretation: node.data.interpretation || '',
    activeQuestions: node.data.activeQuestions || '',
    feltSense: node.data.feltSense || '',
    agencyOrientation: node.data.agencyOrientation || 'curious',
    metaTags: node.data.metaTags || [],
    patternType: node.data.patternType || 'trigger',
    beforeState: node.data.beforeState || '',
    afterState: node.data.afterState || '',
    refinesNodeId: node.data.refinesNodeId || null,
    mode: node.data.mode || 'field-first',
    notes: node.data.notes || '',
    domainIds: node.data.domainIds || [],
    lensIds: node.data.lensIds || []
  });

  const [showAddConnection, setShowAddConnection] = useState(false);
  const [newConnection, setNewConnection] = useState({ targetId: '', label: '', type: 'influences' });
  const [customTagInput, setCustomTagInput] = useState('');
  const [showHelp, setShowHelp] = useState({});
  const [showGuidance, setShowGuidance] = useState(false);

  // Allow a small local suggestion list for session-scope suggestions in addition to shared recent
  const [localSuggestedTags, setLocalSuggestedTags] = useState(() => predefinedMetaTags.slice(0, 20));

  const feltPresets = [
    'Tightness in chest',
    'Floating / dissociated',
    'Warm clarity',
    'Fog / confusion',
    'Restless energy',
    'Calm / grounded'
  ];

  const domainQuestions = useMemo(() => ({
    private: [
      'What am I feeling internally right now?',
      'What part of me is activated?',
      'What unmet need or fear might be underneath this?'
    ],
    public: [
      "What behavior am I reacting to?",
      'What might the other person be perceiving?',
      'Where are the communication gaps?'
    ],
    abstract: [
      'What framework am I using to interpret this?',
      'Is this conceptual understanding or embodied experience?',
      'What blind spots might this lens create?'
    ]
  }), []);

  const availableDomains = [
    { id: 'private', name: 'Private' },
    { id: 'public', name: 'Public' },
    { id: 'abstract', name: 'Abstract' }
  ];

  const toggleHelp = (field) => setShowHelp(prev => ({ ...prev, [field]: !prev[field] }));
  const toggleLens = (lensId) => setFormData(prev => ({ ...prev, lensIds: prev.lensIds.includes(lensId) ? prev.lensIds.filter(id => id !== lensId) : [...prev.lensIds, lensId] }));

  // enforce min 1, max 2 domain membership
  const toggleDomain = (domainId) => setFormData(prev => {
    const has = prev.domainIds.includes(domainId);
    if (has) return { ...prev, domainIds: prev.domainIds.filter(id => id !== domainId) };
    if (prev.domainIds.length >= 2) {
      alert('Maximum 2 domains per node. Consider linking across nodes if you need broader cross-domain context.');
      return prev;
    }
    return { ...prev, domainIds: [...prev.domainIds, domainId] };
  });

  const addMetaTag = (tag) => {
    if (!formData.metaTags.includes(tag)) {
      setFormData(prev => ({ ...prev, metaTags: [...prev.metaTags, tag] }));
      // promote to recent list for convenience
      onAddRecentMetaTag(tag);
    }
  };
  const removeMetaTag = (tag) => setFormData(prev => ({ ...prev, metaTags: prev.metaTags.filter(t => t !== tag) }));

  // create custom tag; optionally add to shared recent and local suggestions
  const addCustomTag = (addToSuggestions = false) => {
    const t = customTagInput.trim();
    if (!t) return;
    if (!formData.metaTags.includes(t)) addMetaTag(t);
    if (addToSuggestions && !localSuggestedTags.includes(t)) {
      setLocalSuggestedTags(prev => [t, ...prev]);
      onAddRecentMetaTag(t);
    }
    setCustomTagInput('');
  };

  const handleSave = () => {
    if (formData.lensIds.length === 0) { alert('Please select at least one lens'); return; }
    if (formData.domainIds.length === 0) { alert('Please select at least one domain'); return; }
    if (formData.domainIds.length > 2) { alert('Please limit domains to a maximum of two.'); return; }
    if (!formData.title.trim()) {
      if (!window.confirm('Save without a title? (recommended to add one)')) return;
    }
    onUpdate(node.id, formData); onClose();
  };

  const handleDelete = () => { if (window.confirm('Are you sure you want to delete this node?')) { onDelete(node.id); onClose(); } };
  const nodeEdges = edges.filter(e => e.source === node.id || e.target === node.id);
  const contentNodes = nodes.filter(n => n.type === 'content' && n.id !== node.id);

  const handleCreateConnection = () => {
    if (newConnection.targetId) {
      onCreateEdge({ id: `e-${Date.now()}`, source: node.id, target: newConnection.targetId, label: newConnection.label || 'Connected to', type: newConnection.type || 'influences' });
      setNewConnection({ targetId: '', label: '', type: 'influences' }); setShowAddConnection(false);
    }
  };

  const HelpTooltip = ({ field, children }) => (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" onClick={() => toggleHelp(field)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0 4px', marginLeft: '4px' }}>
        <HelpCircle size={14} />
      </button>
      {showHelp[field] && (
        <div style={{ position: 'absolute', top: '26px', left: '0', background: '#1E293B', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', color: '#CBD5E1', width: '300px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          {children}
        </div>
      )}
    </div>
  );

  const currentMode = modes.find(m => m.id === formData.mode);

  // === Suggestion engine (non-blocking lightweight) ===
  // Combine: recentMetaTags (shared), localSuggestedTags, semantic matches
  const computeSuggested = () => {
    const collected = [];
    const pushUnique = (t) => { if (!collected.includes(t) && !formData.metaTags.includes(t)) collected.push(t); };

    // 1) recent tags first
    if (Array.isArray(recentMetaTags)) {
      recentMetaTags.forEach(t => pushUnique(t));
    }

    // 2) local suggested
    localSuggestedTags.forEach(t => pushUnique(t));

    // 3) semantic hints matching against feltSense, interpretation, patternType, agencyOrientation, mode, domains
    const haystack = `${formData.feltSense || ''} ${formData.interpretation || ''} ${formData.perceivedPattern || ''} ${formData.activeQuestions || ''} ${formData.patternType || ''} ${formData.agencyOrientation || ''} ${formData.mode || ''} ${formData.domainIds?.join(' ') || ''}`.toLowerCase();

    (metaPatternHints || []).forEach(h => {
      const hit = (h.keywords || []).some(kw => haystack.includes(kw.toLowerCase()));
      if (hit) pushUnique(h.tag);
    });

    // 4) fill from top of predefined if still short (but avoid overwhelming)
    predefinedMetaTags.slice(0, 12).forEach(t => pushUnique(t));

    return collected.slice(0, 12);
  };

  const suggestedMetaTags = useMemo(computeSuggested, [
    formData.feltSense,
    formData.interpretation,
    formData.perceivedPattern,
    formData.activeQuestions,
    formData.patternType,
    formData.agencyOrientation,
    formData.mode,
    JSON.stringify(formData.domainIds || []),
    JSON.stringify(recentMetaTags),
    JSON.stringify(localSuggestedTags)
  ]);

  return (
    <div style={{ position: 'fixed', right: 0, top: '60px', bottom: 0, width: '480px', background: '#0F1724', boxShadow: '-4px 0 24px rgba(0,0,0,0.3)', zIndex: 2000, display: 'flex', flexDirection: 'column', color: '#E6EEF8' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{formData.title || 'Node Details'}</h2>
          {currentMode && (
            <div title={currentMode.description} style={{ padding: '6px 10px', background: '#111827', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '999px', fontSize: '12px', color: '#C7D2FE' }}>
              {currentMode.name}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setShowGuidance(prev => !prev)} title="Toggle guidance prompts" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', color: '#94A3B8', padding: '6px', cursor: 'pointer' }}>
            <MessageSquare size={16} /> Guidance
          </button>
          <button onClick={handleDelete} style={{ background: 'transparent', border: '1px solid #EF4444', borderRadius: '6px', color: '#EF4444', cursor: 'pointer', padding: '6px 10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Trash2 size={14} /> Delete
          </button>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer', padding: '0 8px' }}>×</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
        {/* Guidance panel (toggleable) */}
        {showGuidance && (
          <div style={{ marginBottom: '14px', padding: '12px', background: '#0B1220', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <strong style={{ fontSize: '13px' }}>Guidance Prompts</strong>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>Domain-specific questions to help you fill the node</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {availableDomains.map(d => (
                <div key={d.id} style={{ flex: 1, padding: '8px', background: '#071024', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>{d.name}</div>
                  <ul style={{ margin: 0, paddingLeft: '16px', color: '#CBD5E1', fontSize: '12px' }}>
                    {domainQuestions[d.id].map((q, i) => (<li key={i} style={{ marginBottom: '6px' }}>{q}</li>))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Title */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#94A3B8' }}>Title</label>
          <input value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="Brief title..." style={{ width: '100%', padding: '10px 12px', background: '#111827', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', color: '#E6EEF8', fontSize: '14px', boxSizing: 'border-box' }} />
        </div>

        {/* Core Content */}
        <div style={{ marginBottom: '16px', padding: '14px', background: '#0B1220', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 600, color: '#E6EEF8' }}>Core Content</h3>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', fontSize: '13px', color: '#94A3B8' }}>Perceived Pattern<HelpTooltip field="perceivedPattern">What did you notice? What actually happened or what pattern emerged?</HelpTooltip></label>
            <textarea value={formData.perceivedPattern} onChange={e => setFormData(prev => ({ ...prev, perceivedPattern: e.target.value }))} rows={3} placeholder="What I notice happening..." style={{ width: '100%', padding: '10px 12px', background: '#071021', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', color: '#E6EEF8', fontSize: '13px', resize: 'vertical' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', fontSize: '13px', color: '#94A3B8' }}>Interpretation<HelpTooltip field="interpretation">How are you making meaning of this? What story are you telling yourself?</HelpTooltip></label>
            <textarea value={formData.interpretation} onChange={e => setFormData(prev => ({ ...prev, interpretation: e.target.value }))} rows={3} placeholder="How I'm interpreting this..." style={{ width: '100%', padding: '10px 12px', background: '#071021', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', color: '#E6EEF8', fontSize: '13px', resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', fontSize: '13px', color: '#94A3B8' }}>Active Questions / Uncertainties<HelpTooltip field="activeQuestions">What are you still wondering about? What remains unclear or unresolved?</HelpTooltip></label>
            <textarea value={formData.activeQuestions} onChange={e => setFormData(prev => ({ ...prev, activeQuestions: e.target.value }))} rows={2} placeholder="What I'm wondering..." style={{ width: '100%', padding: '10px 12px', background: '#071021', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', color: '#E6EEF8', fontSize: '13px', resize: 'vertical' }} />
          </div>
        </div>

        {/* Embodied / Affective Layer */}
        <div style={{ marginBottom: '16px', padding: '14px', background: '#0B1220', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 600, color: '#E6EEF8' }}>Embodied / Affective Layer</h3>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', fontSize: '13px', color: '#94A3B8' }}>Felt Sense<HelpTooltip field="feltSense">What are you feeling in your body? Temperature, tension, energy, sensations?</HelpTooltip></label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {feltPresets.map(p => (
                <button key={p} onClick={() => setFormData(prev => ({ ...prev, feltSense: p }))} style={{ padding: '6px 10px', background: formData.feltSense === p ? '#6C63FF' : '#071021', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', color: '#E6EEF8', cursor: 'pointer', fontSize: '12px' }}>{p}</button>
              ))}
            </div>
            <textarea value={formData.feltSense} onChange={e => setFormData(prev => ({ ...prev, feltSense: e.target.value }))} rows={2} placeholder="Physical sensations, energy..." style={{ width: '100%', padding: '10px 12px', background: '#071021', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', color: '#E6EEF8', fontSize: '13px', resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', fontSize: '13px', color: '#94A3B8' }}>Agency Orientation<HelpTooltip field="agencyOrientation">How are you relating to this pattern right now?</HelpTooltip></label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {agencyStates.map(state => (
                <button key={state.id} onClick={() => setFormData(prev => ({ ...prev, agencyOrientation: state.id }))} title={state.description} style={{ padding: '8px 12px', background: formData.agencyOrientation === state.id ? '#6C63FF' : '#071021', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', color: '#E6EEF8', cursor: 'pointer', fontSize: '12px', fontWeight: formData.agencyOrientation === state.id ? 600 : 400 }}>{state.name}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Meta-Pattern Hooks */}
        <div style={{ marginBottom: '16px', padding: '14px', background: '#0B1220', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 600, color: '#E6EEF8' }}>Meta-Pattern Hooks</h3>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', fontSize: '13px', color: '#94A3B8' }}>Pattern Type</label>
            <select value={formData.patternType} onChange={e => setFormData(prev => ({ ...prev, patternType: e.target.value }))} style={{ width: '100%', padding: '10px 12px', background: '#071021', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', color: '#E6EEF8', fontSize: '13px' }}>
              {patternTypes.map(type => (<option key={type.id} value={type.id}>{type.name} — {type.description}</option>))}
            </select>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', fontSize: '13px', color: '#94A3B8' }}>Meta Tags<HelpTooltip field="metaTags">What recurring patterns does this belong to? Use Suggested or Recent, or create a custom tag.</HelpTooltip></label>

            {formData.metaTags.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {formData.metaTags.map(tag => (
                  <div key={tag} style={{ padding: '4px 8px', background: '#6C63FF', borderRadius: '4px', fontSize: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>{tag}
                    <button onClick={() => removeMetaTag(tag)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '0', fontSize: '14px', lineHeight: '1' }}>×</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <select onChange={e => { if (e.target.value) { addMetaTag(e.target.value); e.target.value = ''; } }} style={{ flex: 1, padding: '8px 10px', background: '#071021', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', color: '#94A3B8', fontSize: '12px' }}>
                <option value="">+ Add predefined tag...</option>
                {/* show a small curated slice in dropdown */}
                {predefinedMetaTags.slice(0, 20).filter(tag => !formData.metaTags.includes(tag)).map(tag => (<option key={tag} value={tag}>{tag}</option>))}
              </select>
              <input value={customTagInput} onChange={e => setCustomTagInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && addCustomTag(true)} placeholder="+ Custom tag..." style={{ padding: '8px 10px', background: '#071021', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', color: '#E6EEF8', fontSize: '12px', boxSizing: 'border-box' }} />
              <button onClick={() => addCustomTag(true)} title="Create custom tag and add to suggestions" style={{ padding: '8px 10px', background: '#10B981', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>+</button>
            </div>

            {/* Suggested row (semantic + recent) */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {suggestedMetaTags.map(tag => (
                <button key={tag} onClick={() => addMetaTag(tag)} style={{ padding: '6px 10px', background: '#071021', border: '1px solid rgba(255,255,255,0.02)', borderRadius: '6px', color: '#C7D2FE', cursor: 'pointer', fontSize: '12px' }}>{tag}</button>
              ))}
            </div>

            {/* Browse groups (collapsed by default) */}
            <div style={{ marginTop: '8px' }}>
              <details style={{ color: '#94A3B8' }}>
                <summary style={{ cursor: 'pointer', outline: 'none', padding: '6px 8px', borderRadius: '6px', background: '#071021' }}>Browse all groups</summary>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                  {Object.entries(metaPatternLibrary).map(([groupKey, arr]) => (
                    <div key={groupKey} style={{ padding: '8px', background: '#071021', borderRadius: '6px' }}>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '8px', textTransform: 'capitalize' }}>{groupKey.replace(/([A-Z])/g, ' $1')}</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {arr.slice(0, 8).map(tag => (
                          <button key={tag} onClick={() => addMetaTag(tag)} style={{ padding: '6px 8px', background: '#071021', border: '1px solid rgba(255,255,255,0.02)', borderRadius: '6px', color: '#C7D2FE', cursor: 'pointer', fontSize: '12px' }}>{tag}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Temporal Layer */}
        <div style={{ marginBottom: '16px', padding: '14px', background: '#0B1220', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 600, color: '#E6EEF8' }}>Temporal Layer</h3>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#94A3B8' }}>Before State<HelpTooltip field="beforeState">What was happening before this perception/pattern emerged?</HelpTooltip></label>
            <input value={formData.beforeState} onChange={e => setFormData(prev => ({ ...prev, beforeState: e.target.value }))} placeholder="State before..." style={{ width: '100%', padding: '10px 12px', background: '#071021', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', color: '#E6EEF8', fontSize: '13px' }} />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#94A3B8' }}>After State<HelpTooltip field="afterState">What changed after this perception/pattern?</HelpTooltip></label>
            <input value={formData.afterState} onChange={e => setFormData(prev => ({ ...prev, afterState: e.target.value }))} placeholder="State after..." style={{ width: '100%', padding: '10px 12px', background: '#071021', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', color: '#E6EEF8', fontSize: '13px' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#94A3B8' }}>Refines Previous Node<HelpTooltip field="refinesNodeId">Does this node refine or evolve a previous perception?</HelpTooltip></label>
            <select value={formData.refinesNodeId || ''} onChange={e => setFormData(prev => ({ ...prev, refinesNodeId: e.target.value || null }))} style={{ width: '100%', padding: '10px 12px', background: '#071021', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', color: '#E6EEF8', fontSize: '13px' }}>
              <option value="">None</option>
              {contentNodes.map(n => (<option key={n.id} value={n.id}>{n.data.title || 'Untitled'}</option>))}
            </select>
          </div>
        </div>

        {/* Configuration Section */}
        <div style={{ marginBottom: '16px', padding: '14px', background: '#0B1220', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 600, color: '#E6EEF8' }}>Configuration</h3>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', fontSize: '13px', color: '#94A3B8' }}>Mode</label>
            <select value={formData.mode} onChange={e => setFormData(prev => ({ ...prev, mode: e.target.value }))} style={{ width: '100%', padding: '10px 12px', background: '#071021', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', color: '#E6EEF8', fontSize: '13px' }}>
              {modes.map(mode => (<option key={mode.id} value={mode.id}>{mode.name} — {mode.description}</option>))}
            </select>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#94A3B8' }}>Domains</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {availableDomains.map(domain => (
                <button key={domain.id} onClick={() => toggleDomain(domain.id)} style={{ padding: '8px 14px', background: formData.domainIds.includes(domain.id) ? domainColors[domain.id] : '#071021', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', color: formData.domainIds.includes(domain.id) ? '#000' : '#E6EEF8', cursor: 'pointer', fontSize: '13px', fontWeight: formData.domainIds.includes(domain.id) ? 600 : 400 }}>{domain.name}</button>
              ))}
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#94A3B8' }}>Select 1–2 domains. Use connections for cross-domain relationships.</div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#94A3B8' }}>Lenses {formData.lensIds.length === 0 && <span style={{ color: '#EF4444' }}>*Required</span>}</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {lenses.map(lens => (
                <button key={lens.id} onClick={() => toggleLens(lens.id)} style={{ padding: '8px 14px', background: formData.lensIds.includes(lens.id) ? lens.color : '#071021', border: `1px solid ${formData.lensIds.includes(lens.id) ? lens.color : 'rgba(255,255,255,0.03)'}`, borderRadius: '6px', color: '#E6EEF8', cursor: 'pointer', fontSize: '13px', fontWeight: formData.lensIds.includes(lens.id) ? 600 : 400 }}>{lens.name}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#94A3B8' }}>Additional Notes</label>
          <textarea value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={3} placeholder="Any other observations..." style={{ width: '100%', padding: '10px 12px', background: '#071021', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px', color: '#E6EEF8', fontSize: '14px', resize: 'vertical' }} />
        </div>

        {/* Connections */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '13px', color: '#94A3B8' }}>Connections ({nodeEdges.length})</label>
            <button onClick={() => setShowAddConnection(!showAddConnection)} style={{ padding: '6px 10px', background: '#6C63FF', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={14} /> Add</button>
          </div>
          {showAddConnection && (
            <div style={{ padding: '12px', background: '#071021', borderRadius: '8px', marginBottom: '12px' }}>
              <select value={newConnection.targetId} onChange={e => setNewConnection(prev => ({ ...prev, targetId: e.target.value }))} style={{ width: '100%', padding: '8px', background: '#071021', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', color: '#E6EEF8', fontSize: '13px', marginBottom: '8px' }}>
                <option value="">Select node...</option>
                {contentNodes.map(n => (<option key={n.id} value={n.id}>{n.data.title || 'Untitled'}</option>))}
              </select>
              <input value={newConnection.label} onChange={e => setNewConnection(prev => ({ ...prev, label: e.target.value }))} placeholder="Connection label..." style={{ width: '100%', padding: '8px', background: '#071021', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', color: '#E6EEF8', fontSize: '13px', marginBottom: '8px' }} />
              <select value={newConnection.type} onChange={e => setNewConnection(prev => ({ ...prev, type: e.target.value }))} style={{ width: '100%', padding: '8px', background: '#071021', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', color: '#E6EEF8', fontSize: '13px', marginBottom: '8px' }}>
                <option value="influences">Influences</option>
                <option value="mirrors">Mirrors</option>
                <option value="contradicts">Contradicts</option>
                <option value="refines">Refines</option>
                <option value="meta-pattern">Shares Meta Pattern</option>
              </select>
              <button onClick={handleCreateConnection} style={{ padding: '8px 12px', background: '#10B981', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '13px', width: '100%' }}>Create Connection</button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {nodeEdges.map(edge => {
              const isSource = edge.source === node.id;
              const otherId = isSource ? edge.target : edge.source;
              const otherNode = nodes.find(n => n.id === otherId);
              return (
                <div key={edge.id} style={{ padding: '10px', background: '#071021', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>{isSource ? '→' : '←'} {otherNode?.data.title || 'Unknown'}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>{edge.label} {edge.type && `(${edge.type})`}</div>
                  </div>
                  <button onClick={() => onDeleteEdge(edge.id)} style={{ padding: '6px', background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <div style={{ padding: '16px 18px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '12px' }}>
        <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', color: '#94A3B8', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
        <button onClick={handleSave} style={{ flex: 1, padding: '12px', background: '#6C63FF', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>Save Changes</button>
      </div>
    </div>
  );
}
