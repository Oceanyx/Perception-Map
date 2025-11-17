// src/components/NodeDetailPanel.jsx
import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { domainColors } from '../seedData';

export default function NodeDetailPanel({ node, onClose, onUpdate, onDelete, lenses, edges, nodes, onDeleteEdge, onCreateEdge }) {
  const [formData, setFormData] = useState({
    title: node.data.title || '',
    body: node.data.body || '',
    mode: node.data.mode || 'capture',
    notes: node.data.notes || '',
    domainIds: node.data.domainIds || [],
    lensIds: node.data.lensIds || []
  });

  const [showAddConnection, setShowAddConnection] = useState(false);
  const [newConnection, setNewConnection] = useState({ targetId: '', label: '' });

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

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this node?')) {
      onDelete(node.id);
      onClose();
    }
  };

  const nodeEdges = edges.filter(e => e.source === node.id || e.target === node.id);
  const contentNodes = nodes.filter(n => n.type === 'content' && n.id !== node.id);

  const handleCreateConnection = () => {
    if (newConnection.targetId) {
      onCreateEdge({
        id: `e-${Date.now()}`,
        source: node.id,
        target: newConnection.targetId,
        label: newConnection.label || 'Connected to'
      });
      setNewConnection({ targetId: '', label: '' });
      setShowAddConnection(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: '60px',
      bottom: 0,
      width: '380px',
      background: '#0F1724',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.3)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      color: '#E6EEF8'
    }}>
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Node Details</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            onClick={handleDelete}
            style={{
              background: 'transparent',
              border: '1px solid #EF4444',
              borderRadius: '6px',
              color: '#EF4444',
              cursor: 'pointer',
              padding: '6px 10px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Trash2 size={14} /> Delete
          </button>
          <button onClick={onClose} style={{
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '0 8px'
          }}>×</button>
        </div>
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
              background: '#1E293B',
              border: '1px solid rgba(255,255,255,0.1)',
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
              background: '#1E293B',
              border: '1px solid rgba(255,255,255,0.1)',
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
              background: '#1E293B',
              border: '1px solid rgba(255,255,255,0.1)',
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
                  background: formData.domainIds.includes(domain.id) ? domainColors[domain.id] : '#1E293B',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: formData.domainIds.includes(domain.id) ? '#000' : '#E6EEF8',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: formData.domainIds.includes(domain.id) ? 600 : 400
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
            {lenses.map(lens => (
              <button
                key={lens.id}
                onClick={() => toggleLens(lens.id)}
                style={{
                  padding: '6px 12px',
                  background: formData.lensIds.includes(lens.id) ? lens.color : '#1E293B',
                  border: '1px solid rgba(255,255,255,0.1)',
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
              background: '#1E293B',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#E6EEF8',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <label style={{ fontSize: '13px', color: '#94A3B8' }}>
              Connections ({nodeEdges.length})
            </label>
            <button
              onClick={() => setShowAddConnection(!showAddConnection)}
              style={{
                padding: '4px 8px',
                background: '#6C63FF',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Plus size={14} /> Add
            </button>
          </div>

          {showAddConnection && (
            <div style={{
              padding: '12px',
              background: '#1E293B',
              borderRadius: '8px',
              marginBottom: '12px'
            }}>
              <select
                value={newConnection.targetId}
                onChange={e => setNewConnection(prev => ({ ...prev, targetId: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#0F1724',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#E6EEF8',
                  fontSize: '13px',
                  marginBottom: '8px'
                }}
              >
                <option value="">Select node...</option>
                {contentNodes.map(n => (
                  <option key={n.id} value={n.id}>{n.data.title || 'Untitled'}</option>
                ))}
              </select>
              <input
                value={newConnection.label}
                onChange={e => setNewConnection(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Connection label..."
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#0F1724',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#E6EEF8',
                  fontSize: '13px',
                  marginBottom: '8px'
                }}
              />
              <button
                onClick={handleCreateConnection}
                style={{
                  padding: '6px 12px',
                  background: '#10B981',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                  width: '100%'
                }}
              >
                Create Connection
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {nodeEdges.map(edge => {
              const isSource = edge.source === node.id;
              const otherId = isSource ? edge.target : edge.source;
              const otherNode = nodes.find(n => n.id === otherId);
              
              return (
                <div key={edge.id} style={{
                  padding: '10px',
                  background: '#1E293B',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                      {isSource ? '→' : '←'} {otherNode?.data.title || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      {edge.label}
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteEdge(edge.id)}
                    style={{
                      padding: '4px',
                      background: 'transparent',
                      border: 'none',
                      color: '#EF4444',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{
        padding: '20px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: '10px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
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