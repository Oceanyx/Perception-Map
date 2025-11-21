// src/components/NodeDetailPanel.jsx
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, HelpCircle, MessageSquare, Eye, Lightbulb, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { domainColors, patternTypes, agencyStates, predefinedMetaTags, metaPatternHints, metaPatternLibrary, modes, domainQuestionBanks, getMetaTagWithFraming, strengthMetaTags } from '../seedData';

export default function NodeDetailPanel({
  node, onClose, onUpdate, onDelete, lenses, edges, nodes, onDeleteEdge, onCreateEdge,
  recentMetaTags = [], onAddRecentMetaTag = () => {}
}) {
  const [formData, setFormData] = useState({
    title: node.data.title || '',
    perceivedPattern: node.data.perceivedPattern || '',
    interpretation: node.data.interpretation || '',
    activeQuestions: node.data.activeQuestions || '',
    feltSense: node.data.feltSense || '',
    agencyOrientation: node.data.agencyOrientation || 'curious',
    agencyIntensity: node.data.agencyIntensity || 5,
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
  const [guidanceLevel, setGuidanceLevel] = useState('quick'); // 'quick', 'deep', 'experiments'
  const [showGuidance, setShowGuidance] = useState(false);
  const [tagFramingView, setTagFramingView] = useState('diagnostic'); // 'diagnostic', 'strength', 'neutral'
  const [localSuggestedTags, setLocalSuggestedTags] = useState(() => predefinedMetaTags.slice(0, 20));

  const feltPresets = ['Tightness in chest', 'Floating / dissociated', 'Warm clarity', 'Fog / confusion', 'Restless energy', 'Calm / grounded'];

  const availableDomains = [
    { id: 'private', name: 'Private' },
    { id: 'public', name: 'Public' },
    { id: 'abstract', name: 'Abstract' }
  ];

  const toggleLens = (lensId) => setFormData(prev => ({ ...prev, lensIds: prev.lensIds.includes(lensId) ? prev.lensIds.filter(id => id !== lensId) : [...prev.lensIds, lensId] }));

  const toggleDomain = (domainId) => setFormData(prev => {
    const has = prev.domainIds.includes(domainId);
    if (has) return { ...prev, domainIds: prev.domainIds.filter(id => id !== domainId) };
    if (prev.domainIds.length >= 2) { alert('Maximum 2 domains per node.'); return prev; }
    return { ...prev, domainIds: [...prev.domainIds, domainId] };
  });

  const addMetaTag = (tag) => {
    if (!formData.metaTags.includes(tag)) {
      setFormData(prev => ({ ...prev, metaTags: [...prev.metaTags, tag] }));
      onAddRecentMetaTag(tag);
    }
  };
  const removeMetaTag = (tag) => setFormData(prev => ({ ...prev, metaTags: prev.metaTags.filter(t => t !== tag) }));

  const reframeTag = (oldTag, newTag) => {
    setFormData(prev => ({ ...prev, metaTags: prev.metaTags.map(t => t === oldTag ? newTag : t) }));
  };

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
    onUpdate(node.id, formData); onClose();
  };

  const handleDelete = () => { if (window.confirm('Delete this node?')) { onDelete(node.id); onClose(); } };
  const nodeEdges = edges.filter(e => e.source === node.id || e.target === node.id);
  const contentNodes = nodes.filter(n => n.type === 'content' && n.id !== node.id);

  const handleCreateConnection = () => {
    if (newConnection.targetId) {
      onCreateEdge({ id: `e-${Date.now()}`, source: node.id, target: newConnection.targetId, label: newConnection.label || 'Connected to', type: newConnection.type || 'influences' });
      setNewConnection({ targetId: '', label: '', type: 'influences' }); setShowAddConnection(false);
    }
  };

  const HelpTooltip = ({ children }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
      <div style={{ position: 'relative', display: 'inline-block' }} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <span style={{ color: '#64748B', cursor: 'help', padding: '0 4px', marginLeft: '4px', display: 'inline-flex', alignItems: 'center' }}>
          <HelpCircle size={14} />
        </span>
        {isHovered && (
          <div style={{ position: 'absolute', top: '24px', left: '0', background: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', color: '#CBD5E1', width: '260px', zIndex: 1000, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
            {children}
          </div>
        )}
      </div>
    );
  };

  const currentMode = modes.find(m => m.id === formData.mode);
  const currentAgency = agencyStates.find(a => a.id === formData.agencyOrientation);

  // Get guidance questions based on selected domains
  const getGuidanceQuestions = () => {
    const domains = formData.domainIds.length > 0 ? formData.domainIds : ['private'];
    const questions = { quick: [], deep: [], experiments: [] };
    domains.forEach(d => {
      if (domainQuestionBanks[d]) {
        questions.quick.push(...domainQuestionBanks[d].quick);
        questions.deep.push(...domainQuestionBanks[d].deep);
        questions.experiments.push(...domainQuestionBanks[d].experiments);
      }
    });
    return questions;
  };

  const guidanceQuestions = getGuidanceQuestions();

  // Suggestion engine
  const computeSuggested = () => {
    const collected = [];
    const pushUnique = (t) => { if (!collected.includes(t) && !formData.metaTags.includes(t)) collected.push(t); };
    if (Array.isArray(recentMetaTags)) recentMetaTags.forEach(t => pushUnique(t));
    localSuggestedTags.forEach(t => pushUnique(t));
    const haystack = `${formData.feltSense || ''} ${formData.interpretation || ''} ${formData.perceivedPattern || ''} ${formData.activeQuestions || ''} ${formData.patternType || ''} ${formData.agencyOrientation || ''} ${formData.mode || ''} ${formData.domainIds?.join(' ') || ''}`.toLowerCase();
    (metaPatternHints || []).forEach(h => {
      const hit = (h.keywords || []).some(kw => haystack.includes(kw.toLowerCase()));
      if (hit) pushUnique(h.tag);
    });
    predefinedMetaTags.slice(0, 12).forEach(t => pushUnique(t));
    return collected.slice(0, 12);
  };

  const suggestedMetaTags = useMemo(computeSuggested, [
    formData.feltSense, formData.interpretation, formData.perceivedPattern, formData.activeQuestions,
    formData.patternType, formData.agencyOrientation, formData.mode,
    JSON.stringify(formData.domainIds || []), JSON.stringify(recentMetaTags), JSON.stringify(localSuggestedTags)
  ]);

  // Styles
  const sectionStyle = { marginBottom: '16px', padding: '14px', borderRadius: '10px' };
  const observationBg = { ...sectionStyle, background: 'linear-gradient(135deg, #0B1220 0%, #0D1528 100%)', border: '1px solid rgba(79, 159, 255, 0.1)' };
  const interpretationBg = { ...sectionStyle, background: 'linear-gradient(135deg, #12101E 0%, #1A1428 100%)', border: '1px solid rgba(168, 139, 250, 0.1)' };
  const inputStyle = { width: '100%', padding: '10px 12px', background: '#0A0F1A', border: '1px solid rgba(148, 163, 184, 0.25)', borderRadius: '6px', color: '#E6EEF8', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' };
  const inputFocusProps = { onFocus: (e) => { e.target.style.borderColor = '#6C63FF'; e.target.style.boxShadow = '0 0 0 2px rgba(108, 99, 255, 0.2)'; }, onBlur: (e) => { e.target.style.borderColor = 'rgba(148, 163, 184, 0.25)'; e.target.style.boxShadow = 'none'; } };
  const labelStyle = { display: 'flex', alignItems: 'center', marginBottom: '6px', fontSize: '13px', color: '#94A3B8' };
  const btnStyle = { padding: '6px 10px', background: '#1E293B', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '6px', color: '#E6EEF8', cursor: 'pointer', fontSize: '11px', transition: 'all 0.15s' };
  const btnActiveStyle = { ...btnStyle, background: '#6C63FF', borderColor: '#6C63FF', fontWeight: 600 };
  const btnHoverProps = { onMouseEnter: (e) => { if (e.target.style.background !== 'rgb(108, 99, 255)') e.target.style.background = '#2D3A4F'; }, onMouseLeave: (e) => { if (e.target.style.background === 'rgb(45, 58, 79)') e.target.style.background = '#1E293B'; } };

  return (
    <div style={{ position: 'fixed', right: 0, top: '60px', bottom: 0, width: '480px', background: '#0F1724', boxShadow: '-4px 0 24px rgba(0,0,0,0.3)', zIndex: 2000, display: 'flex', flexDirection: 'column', color: '#E6EEF8' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="Node title..." style={{ fontSize: '16px', fontWeight: 600, background: 'transparent', border: 'none', color: '#E6EEF8', outline: 'none', minWidth: '120px' }} />
          {currentMode && (
            <select value={formData.mode} onChange={e => setFormData(prev => ({ ...prev, mode: e.target.value }))} style={{ padding: '4px 8px', background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '999px', fontSize: '11px', color: '#C7D2FE', cursor: 'pointer' }}>
              {modes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setShowGuidance(prev => !prev)} style={{ background: showGuidance ? '#6C63FF' : 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: showGuidance ? '#fff' : '#94A3B8', padding: '5px 8px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MessageSquare size={14} /> Guidance
          </button>
          <button onClick={handleDelete} style={{ background: 'transparent', border: '1px solid #EF4444', borderRadius: '6px', color: '#EF4444', cursor: 'pointer', padding: '5px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Trash2 size={14} />
          </button>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '18px', cursor: 'pointer', padding: '0 6px' }}>×</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* Guidance Panel */}
        {showGuidance && (
          <div style={{ marginBottom: '14px', padding: '12px', background: '#0B1220', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              {['quick', 'deep', 'experiments'].map(level => (
                <button key={level} onClick={() => setGuidanceLevel(level)} style={{ padding: '5px 10px', background: guidanceLevel === level ? '#6C63FF' : '#1E293B', border: `1px solid ${guidanceLevel === level ? '#6C63FF' : 'rgba(148, 163, 184, 0.2)'}`, borderRadius: '6px', color: '#E6EEF8', cursor: 'pointer', fontSize: '12px', textTransform: 'capitalize', transition: 'all 0.15s' }}>{level}</button>
              ))}
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', color: '#CBD5E1', fontSize: '12px', lineHeight: '1.6' }}>
              {guidanceQuestions[guidanceLevel]?.slice(0, 5).map((q, i) => <li key={i} style={{ marginBottom: '6px' }}>{q}</li>)}
            </ul>
          </div>
        )}

        {/* OBSERVATION SECTION */}
        <div style={observationBg}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Eye size={16} color="#4D9FFF" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#4D9FFF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>What I Notice</span>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={labelStyle}>Perceived Pattern<HelpTooltip>What did you notice? What actually happened?</HelpTooltip></label>
            <textarea value={formData.perceivedPattern} onChange={e => setFormData(prev => ({ ...prev, perceivedPattern: e.target.value }))} rows={3} placeholder="What I observe happening..." style={inputStyle} {...inputFocusProps} />
          </div>
          <div>
            <label style={labelStyle}>Felt Sense<HelpTooltip>Body sensations, energy, temperature, tension?</HelpTooltip></label>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {feltPresets.map(p => (
                <button key={p} onClick={() => setFormData(prev => ({ ...prev, feltSense: p }))} style={{ padding: '5px 9px', background: formData.feltSense === p ? '#6C63FF' : '#1E293B', border: `1px solid ${formData.feltSense === p ? '#6C63FF' : 'rgba(148, 163, 184, 0.2)'}`, borderRadius: '6px', color: '#E6EEF8', cursor: 'pointer', fontSize: '11px', transition: 'all 0.15s' }}>{p}</button>
              ))}
            </div>
            <textarea value={formData.feltSense} onChange={e => setFormData(prev => ({ ...prev, feltSense: e.target.value }))} rows={2} placeholder="Physical sensations..." style={inputStyle} {...inputFocusProps} />
          </div>
        </div>

        {/* INTERPRETATION SECTION */}
        <div style={interpretationBg}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Lightbulb size={16} color="#A78BFA" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.5px' }}>How I'm Making Sense</span>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={labelStyle}>Interpretation<HelpTooltip>How are you making meaning of this?</HelpTooltip></label>
            <textarea value={formData.interpretation} onChange={e => setFormData(prev => ({ ...prev, interpretation: e.target.value }))} rows={3} placeholder="The story I'm telling myself..." style={inputStyle} {...inputFocusProps} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={labelStyle}>Active Questions<HelpTooltip>What remains unclear or unresolved?</HelpTooltip></label>
            <textarea value={formData.activeQuestions} onChange={e => setFormData(prev => ({ ...prev, activeQuestions: e.target.value }))} rows={2} placeholder="What I'm still wondering..." style={inputStyle} {...inputFocusProps} />
          </div>

          {/* Meta Tags with reframing */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Meta Tags<HelpTooltip>Recurring patterns this belongs to</HelpTooltip></label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['diagnostic', 'strength'].map(view => (
                  <button key={view} onClick={() => setTagFramingView(view)} style={{ padding: '3px 7px', background: tagFramingView === view ? '#6C63FF' : '#1E293B', border: `1px solid ${tagFramingView === view ? '#6C63FF' : 'rgba(148, 163, 184, 0.15)'}`, borderRadius: '4px', color: tagFramingView === view ? '#fff' : '#94A3B8', cursor: 'pointer', fontSize: '10px', textTransform: 'capitalize', transition: 'all 0.15s' }}>{view}</button>
                ))}
              </div>
            </div>

            {formData.metaTags.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {formData.metaTags.map(tag => {
                  const info = getMetaTagWithFraming(tag);
                  return (
                    <div key={tag} style={{ padding: '4px 8px', background: info.framing === 'strength' ? '#10B981' : '#6C63FF', borderRadius: '4px', fontSize: '11px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {tag}
                      {info.alt && (
                        <button onClick={() => reframeTag(tag, info.alt)} title={`Reframe as: ${info.alt}`} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '3px', color: '#fff', cursor: 'pointer', padding: '1px 4px', fontSize: '10px', display: 'flex', alignItems: 'center' }}>
                          <RefreshCw size={10} />
                        </button>
                      )}
                      <button onClick={() => removeMetaTag(tag)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '0', fontSize: '14px', lineHeight: '1' }}>×</button>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <input value={customTagInput} onChange={e => setCustomTagInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && addCustomTag(true)} placeholder="+ Custom tag..." style={{ ...inputStyle, flex: 1, resize: 'none' }} {...inputFocusProps} />
              <button onClick={() => addCustomTag(true)} style={{ padding: '7px 10px', background: '#10B981', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>+</button>
            </div>

            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {(tagFramingView === 'strength' ? strengthMetaTags : suggestedMetaTags).slice(0, 10).filter(t => !formData.metaTags.includes(t)).map(tag => (
                <button key={tag} onClick={() => addMetaTag(tag)} style={{ padding: '5px 8px', background: '#1E293B', border: '1px solid rgba(148, 163, 184, 0.15)', borderRadius: '5px', color: '#C7D2FE', cursor: 'pointer', fontSize: '11px', transition: 'all 0.15s' }}>{tag}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Agency Orientation */}
        <div style={{ ...sectionStyle, background: '#0B1220', border: '1px solid rgba(255,255,255,0.02)' }}>
          <label style={{ ...labelStyle, marginBottom: '10px' }}>Agency Orientation<HelpTooltip>How are you relating to this pattern?</HelpTooltip></label>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {agencyStates.map(state => (
              <button key={state.id} onClick={() => setFormData(prev => ({ ...prev, agencyOrientation: state.id }))} title={state.description} style={{ padding: '6px 10px', background: formData.agencyOrientation === state.id ? '#6C63FF' : '#1E293B', border: `1px solid ${formData.agencyOrientation === state.id ? '#6C63FF' : 'rgba(148, 163, 184, 0.2)'}`, borderRadius: '6px', color: '#E6EEF8', cursor: 'pointer', fontSize: '11px', fontWeight: formData.agencyOrientation === state.id ? 600 : 400, transition: 'all 0.15s' }}>{state.name}</button>
            ))}
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>
              <span>Passive</span>
              <span>Intensity: {formData.agencyIntensity}</span>
              <span>Active</span>
            </div>
            <input type="range" min="0" max="10" value={formData.agencyIntensity} onChange={e => setFormData(prev => ({ ...prev, agencyIntensity: parseInt(e.target.value) }))} style={{ width: '100%', accentColor: '#6C63FF' }} />
          </div>
          {currentAgency && <div style={{ marginTop: '8px', fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>{currentAgency.description}</div>}
        </div>

        {/* Pattern Type & Temporal */}
        <div style={{ ...sectionStyle, background: '#0B1220', border: '1px solid rgba(255,255,255,0.02)' }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={labelStyle}>Pattern Type</label>
            <select value={formData.patternType} onChange={e => setFormData(prev => ({ ...prev, patternType: e.target.value }))} style={{ ...inputStyle, resize: 'none' }} {...inputFocusProps}>
              {patternTypes.map(type => <option key={type.id} value={type.id}>{type.name} — {type.description}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={labelStyle}>Before State</label>
              <input value={formData.beforeState} onChange={e => setFormData(prev => ({ ...prev, beforeState: e.target.value }))} placeholder="State before..." style={inputStyle} {...inputFocusProps} />
            </div>
            <div>
              <label style={labelStyle}>After State</label>
              <input value={formData.afterState} onChange={e => setFormData(prev => ({ ...prev, afterState: e.target.value }))} placeholder="State after..." style={inputStyle} {...inputFocusProps} />
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div style={{ ...sectionStyle, background: '#0B1220', border: '1px solid rgba(255,255,255,0.02)' }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={labelStyle}>Domains</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {availableDomains.map(domain => (
                <button key={domain.id} onClick={() => toggleDomain(domain.id)} style={{ padding: '7px 12px', background: formData.domainIds.includes(domain.id) ? domainColors[domain.id] : '#1E293B', border: `1px solid ${formData.domainIds.includes(domain.id) ? domainColors[domain.id] : 'rgba(148, 163, 184, 0.2)'}`, borderRadius: '6px', color: formData.domainIds.includes(domain.id) ? '#000' : '#E6EEF8', cursor: 'pointer', fontSize: '12px', fontWeight: formData.domainIds.includes(domain.id) ? 600 : 400, transition: 'all 0.15s' }}>{domain.name}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Lenses {formData.lensIds.length === 0 && <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>}</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {lenses.map(lens => (
                <button key={lens.id} onClick={() => toggleLens(lens.id)} style={{ padding: '7px 12px', background: formData.lensIds.includes(lens.id) ? lens.color : '#1E293B', border: `1px solid ${formData.lensIds.includes(lens.id) ? lens.color : 'rgba(148, 163, 184, 0.2)'}`, borderRadius: '6px', color: '#E6EEF8', cursor: 'pointer', fontSize: '12px', fontWeight: formData.lensIds.includes(lens.id) ? 600 : 400, transition: 'all 0.15s' }}>{lens.name}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Notes</label>
          <textarea value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={2} placeholder="Additional observations..." style={inputStyle} {...inputFocusProps} />
        </div>

        {/* Connections */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '13px', color: '#94A3B8' }}>Connections ({nodeEdges.length})</label>
            <button onClick={() => setShowAddConnection(!showAddConnection)} style={{ padding: '5px 9px', background: '#6C63FF', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={12} /> Add</button>
          </div>
          {showAddConnection && (
            <div style={{ padding: '10px', background: '#071021', borderRadius: '8px', marginBottom: '10px' }}>
              <select value={newConnection.targetId} onChange={e => setNewConnection(prev => ({ ...prev, targetId: e.target.value }))} style={{ ...inputStyle, marginBottom: '6px', resize: 'none' }} {...inputFocusProps}>
                <option value="">Select node...</option>
                {contentNodes.map(n => <option key={n.id} value={n.id}>{n.data.title || 'Untitled'}</option>)}
              </select>
              <input value={newConnection.label} onChange={e => setNewConnection(prev => ({ ...prev, label: e.target.value }))} placeholder="Label..." style={{ ...inputStyle, marginBottom: '6px', resize: 'none' }} {...inputFocusProps} />
              <button onClick={handleCreateConnection} style={{ padding: '7px', background: '#10B981', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px', width: '100%' }}>Create</button>
            </div>
          )}
          {nodeEdges.map(edge => {
            const isSource = edge.source === node.id;
            const otherId = isSource ? edge.target : edge.source;
            const otherNode = nodes.find(n => n.id === otherId);
            return (
              <div key={edge.id} style={{ padding: '8px', background: '#071021', borderRadius: '6px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#E6EEF8' }}>{isSource ? '→' : '←'} {otherNode?.data.title || 'Unknown'}</div>
                  <div style={{ fontSize: '10px', color: '#64748B' }}>{edge.label}</div>
                </div>
                <button onClick={() => onDeleteEdge(edge.id)} style={{ padding: '4px', background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={12} /></button>
              </div>
            );
          })}
        </div>

        {/* Timestamp */}
        <div style={{ fontSize: '11px', color: '#64748B', textAlign: 'center', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          Created: {node.data.createdAt ? new Date(node.data.createdAt).toLocaleString() : 'Unknown'}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '10px' }}>
        <button onClick={onClose} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', color: '#94A3B8', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
        <button onClick={handleSave} style={{ flex: 1, padding: '10px', background: '#6C63FF', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>Save Changes</button>
      </div>
    </div>
  );
}