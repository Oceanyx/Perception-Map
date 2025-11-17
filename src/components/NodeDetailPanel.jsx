// ============ NODE DETAIL PANEL ============
export default function NodeDetailPanel({ node, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    title: node.data.title || '',
    body: node.data.body || '',
    mode: node.data.mode || 'capture',
    notes: node.data.notes || '',
    domainIds: node.data.domainIds || [],
    lensIds: node.data.lensIds || []
  });

  const availableLenses = [
    { id: 'empathy', name: 'Empathy', color: '#EC4899' },
    { id: 'systems', name: 'Systems', color: '#3B82F6' },
    { id: 'aesthetic', name: 'Aesthetic', color: '#8B5CF6' }
  ];

  const availableDomains = [
    { id: 'private', name: 'Private' },
    { id: 'public', name: 'Public' },
    { id: 'abstract', name: 'Abstract' }
  ];

  const toggleLens = (lensId) => {
    setFormData(prev => ({
      ...prev,
      lensIds: prev.lensIds.includes(lensId) 
        ? prev.lensIds.filter(id => id !== lensId)
        : [...prev.lensIds, lensId]
    }));
  };

  const toggleDomain = (domainId) => {
    setFormData(prev => ({
      ...prev,
      domainIds: prev.domainIds.includes(domainId)
        ? prev.domainIds.filter(id => id !== domainId)
        : [...prev.domainIds, domainId]
    }));
  };

  const handleSave = () => {
    onUpdate(node.id, formData);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      bottom: 0,
      width: '420px',
      background: '#071022',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.3)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      color: '#E6EEF8'
    }}>
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Node Details</h2>
        <button onClick={onClose} style={{
          background: 'transparent',
          border: 'none',
          color: '#94A3B8',
          fontSize: '24px',
          cursor: 'pointer',
          padding: '0 8px'
        }}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#94A3B8' }}>
            Title
          </label>
          <input
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            style={{
              width: '100%',
              padding: '10px',
              background: '#0B1220',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              color: '#E6EEF8',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#94A3B8' }}>
            Description
          </label>
          <textarea
            value={formData.body}
            onChange={e => setFormData(prev => ({ ...prev, body: e.target.value }))}
            rows={4}
            style={{
              width: '100%',
              padding: '10px',
              background: '#0B1220',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              color: '#E6EEF8',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#94A3B8' }}>
            Mode
          </label>
          <select
            value={formData.mode}
            onChange={e => setFormData(prev => ({ ...prev, mode: e.target.value }))}
            style={{
              width: '100%',
              padding: '10px',
              background: '#0B1220',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              color: '#E6EEF8',
              fontSize: '14px'
            }}
          >
            <option value="capture">Capture</option>
            <option value="reflect">Reflect</option>
            <option value="explore">Explore</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#94A3B8' }}>
            Domains
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {availableDomains.map(domain => (
              <button
                key={domain.id}
                onClick={() => toggleDomain(domain.id)}
                style={{
                  padding: '6px 12px',
                  background: formData.domainIds.includes(domain.id) ? '#6C63FF' : '#0B1220',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '6px',
                  color: '#E6EEF8',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                {domain.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#94A3B8' }}>
            Lenses
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {availableLenses.map(lens => (
              <button
                key={lens.id}
                onClick={() => toggleLens(lens.id)}
                style={{
                  padding: '6px 12px',
                  background: formData.lensIds.includes(lens.id) ? lens.color : '#0B1220',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '6px',
                  color: '#E6EEF8',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                {lens.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#94A3B8' }}>
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            placeholder="Additional notes..."
            style={{
              width: '100%',
              padding: '10px',
              background: '#0B1220',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              color: '#E6EEF8',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#94A3B8' }}>
            History
          </label>
          <div style={{ 
            padding: '10px',
            background: '#0B1220',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#64748B'
          }}>
            Created: {node.data.createdAt ? new Date(node.data.createdAt).toLocaleDateString() : 'Unknown'}
          </div>
        </div>
      </div>

      <div style={{
        padding: '20px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: '10px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            color: '#94A3B8',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          style={{
            flex: 1,
            padding: '10px',
            background: '#6C63FF',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
