// src/components/LeftSidebar.jsx
import React, { useState } from 'react';
import { Upload, FileJson, Camera, Target, Map, MousePointer, Hand } from 'lucide-react';

export default function LeftSidebar({ 
  onImport, 
  onExportJSON, 
  onExportPNG, 
  onShowPurpose, 
  onShowLegend,
  tool,
  onToolChange
}) {
  const [hoveredIcon, setHoveredIcon] = useState(null);

  const iconButtons = [
    { id: 'import', icon: Upload, label: 'Import Map', action: onImport, color: '#10B981' },
    { id: 'export-json', icon: FileJson, label: 'Export JSON', action: onExportJSON, color: '#6C63FF' },
    { id: 'export-png', icon: Camera, label: 'Export PNG', action: onExportPNG, color: '#A78BFA' },
    { id: 'purpose', icon: Target, label: 'View Purpose', action: onShowPurpose, color: '#F59E0B' },
    { id: 'legend', icon: Map, label: 'Legend', action: onShowLegend, color: '#4D9FFF' }
  ];

  const toolButtons = [
    { id: 'select', icon: MousePointer, label: 'Select Tool (V)' },
    { id: 'hand', icon: Hand, label: 'Hand Tool (H)' }
  ];

return (
    <>
      {/* Action buttons - top left */}
      <div style={{
        position: 'absolute',
        top: '80px',
        left: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 100
      }}>
        {iconButtons.map(btn => {
          const Icon = btn.icon;
          const isHovered = hoveredIcon === btn.id;
          
          return (
            <div key={btn.id} style={{ position: 'relative' }}>
              <button
                onClick={btn.action}
                onMouseEnter={() => setHoveredIcon(btn.id)}
                onMouseLeave={() => setHoveredIcon(null)}
                style={{
                  padding: '10px',
                  background: '#1E293B',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#E6EEF8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={20} color={isHovered ? btn.color : '#E6EEF8'} />
              </button>
              
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  left: '52px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: '#1E293B',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  whiteSpace: 'nowrap',
                  fontSize: '13px',
                  color: '#E6EEF8',
                  pointerEvents: 'none',
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}>
                  {btn.label}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tool selector - bottom left */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 100
      }}>
        {toolButtons.map(btn => {
          const Icon = btn.icon;
          const isActive = tool === btn.id;
          const isHovered = hoveredIcon === btn.id;
          
          return (
            <div key={btn.id} style={{ position: 'relative' }}>
              <button
                onClick={() => onToolChange(btn.id)}
                onMouseEnter={() => setHoveredIcon(btn.id)}
                onMouseLeave={() => setHoveredIcon(null)}
                style={{
                  padding: '10px',
                  background: isActive ? '#6C63FF' : '#1E293B',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#E6EEF8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={20} />
              </button>
              
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  left: '52px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: '#1E293B',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  whiteSpace: 'nowrap',
                  fontSize: '13px',
                  color: '#E6EEF8',
                  pointerEvents: 'none',
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}>
                  {btn.label}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}