// src/components/PurposeScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
// Add custom scrollbar styles to document head once
if (typeof document !== 'undefined' && !document.getElementById('purpose-scrollbar-style')) {
  const style = document.createElement('style');
  style.id = 'purpose-scrollbar-style';
  style.textContent = `
    [data-purpose-scrollable]::-webkit-scrollbar {
      width: 8px;
    }
    [data-purpose-scrollable]::-webkit-scrollbar-track {
      background: rgba(30, 41, 59, 0.4);
      border-radius: 10px;
    }
    [data-purpose-scrollable]::-webkit-scrollbar-thumb {
      background: rgba(108, 99, 255, 0.5);
      border-radius: 10px;
    }
    [data-purpose-scrollable]::-webkit-scrollbar-thumb:hover {
      background: rgba(108, 99, 255, 0.7);
    }
  `;
  document.head.appendChild(style);
}

export default function PurposeScreen({ onComplete, onSkip }) {
  const [formData, setFormData] = useState({
    title: '',
    purpose: '',
    currentState: '',
    orientationQuestion: ''
  });
  const canvasRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const creatures = useRef([]);

  // Interactive background animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create simple creatures that follow the mouse
    class Creature {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 20 + 10;
        this.vx = 0;
        this.vy = 0;
        this.hue = Math.random() * 60 + 180; // Blue-green range
        this.pulsePhase = Math.random() * Math.PI * 2;
      }

      update(mouseX, mouseY) {
        // Gentle attraction to mouse
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 50) {
          this.vx += (dx / dist) * 0.05;
          this.vy += (dy / dist) * 0.05;
        }

        // Damping
        this.vx *= 0.95;
        this.vy *= 0.95;

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around edges
        if (this.x < -50) this.x = canvas.width + 50;
        if (this.x > canvas.width + 50) this.x = -50;
        if (this.y < -50) this.y = canvas.height + 50;
        if (this.y > canvas.height + 50) this.y = -50;

        this.pulsePhase += 0.05;
      }

      draw(ctx) {
        const pulse = Math.sin(this.pulsePhase) * 0.3 + 1;
        const currentSize = this.size * pulse;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Glow effect
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, currentSize * 2);
        gradient.addColorStop(0, `hsla(${this.hue}, 70%, 60%, 0.4)`);
        gradient.addColorStop(0.5, `hsla(${this.hue}, 70%, 50%, 0.2)`);
        gradient.addColorStop(1, `hsla(${this.hue}, 70%, 40%, 0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(-currentSize * 2, -currentSize * 2, currentSize * 4, currentSize * 4);

        // Core body
        ctx.fillStyle = `hsla(${this.hue}, 70%, 60%, 0.6)`;
        ctx.beginPath();
        ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = `hsla(${this.hue}, 70%, 80%, 0.4)`;
        ctx.beginPath();
        ctx.arc(-currentSize * 0.3, -currentSize * 0.3, currentSize * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    // Initialize creatures
    for (let i = 0; i < 15; i++) {
      creatures.current.push(new Creature());
    }

    // Animation loop
    let animationId;
    const animate = () => {
      ctx.fillStyle = 'rgba(10, 15, 30, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      creatures.current.forEach(creature => {
        creature.update(mousePos.current.x, mousePos.current.y);
        creature.draw(ctx);
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Mouse tracking
    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please give your perception map a title');
      return;
    }
    onComplete(formData);
  };

  const handleSkip = () => {
    onSkip({
      title: 'Untitled Perception Map',
      purpose: '',
      currentState: '',
      orientationQuestion: ''
    });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#0A0F1E',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      {/* Animated background */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      />

      {/* Form card */}
      <div 
        data-purpose-scrollable="true"
        style={{
        position: 'relative',
        zIndex: 1,
        width: '600px',
        maxWidth: '90vw',
        background: 'rgba(15, 23, 36, 0.9)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(108, 99, 255, 0.3)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        padding: '48px 48px 24px 48px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '36px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #6C63FF 0%, #A78BFA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.5px'
          }}>
            Chroma
          </h1>
          <p style={{
            margin: '0 0 24px 0',
            fontSize: '15px',
            color: '#94A3B8',
            fontWeight: 500,
            letterSpacing: '0.5px'
          }}>
            Your Perception, Amplified
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            justifyContent: 'center'
          }}>
            <Sparkles size={24} color="#6C63FF" />
            <h2 style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: 600,
              color: '#E6EEF8'
            }}>
              Begin Your Journey
            </h2>
          </div>
        </div>

        <p style={{
          textAlign: 'center',
          color: '#94A3B8',
          fontSize: '16px',
          marginBottom: '48px',
          lineHeight: '1.6'
        }}>
          Take a moment to set your intention. What brings you here today?
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: '#E6EEF8',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '8px'
            }}>
              Map Title <span style={{ color: '#6C63FF' }}>*</span>
            </label>
            <input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Morning Reflection, Work Tensions, Creative Block..."
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '10px',
                color: '#E6EEF8',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6C63FF';
                e.target.style.boxShadow = '0 0 0 3px rgba(108, 99, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: '#E6EEF8',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '8px'
            }}>
              What's the purpose of this session?
            </label>
            <textarea
              value={formData.purpose}
              onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
              placeholder="What are you hoping to understand or explore?"
              rows={3}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '10px',
                color: '#E6EEF8',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6C63FF';
                e.target.style.boxShadow = '0 0 0 3px rgba(108, 99, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: '#E6EEF8',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '8px'
            }}>
              What's your current state?
            </label>
            <textarea
              value={formData.currentState}
              onChange={(e) => setFormData(prev => ({ ...prev, currentState: e.target.value }))}
              placeholder="How are you feeling right now? What's alive in you?"
              rows={3}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '10px',
                color: '#E6EEF8',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6C63FF';
                e.target.style.boxShadow = '0 0 0 3px rgba(108, 99, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              color: '#E6EEF8',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '8px'
            }}>
              What question are you holding?
            </label>
            <textarea
              value={formData.orientationQuestion}
              onChange={(e) => setFormData(prev => ({ ...prev, orientationQuestion: e.target.value }))}
              placeholder="What do you want to be curious about today?"
              rows={2}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '10px',
                color: '#E6EEF8',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6C63FF';
                e.target.style.boxShadow = '0 0 0 3px rgba(108, 99, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #6C63FF 0%, #A78BFA 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(108, 99, 255, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(108, 99, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(108, 99, 255, 0.3)';
            }}
          >
            Begin Mapping <ArrowRight size={20} />
          </button>

          <button
            type="button"
            onClick={handleSkip}
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '8px',
              background: 'transparent',
              border: 'none',
              color: '#64748B',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#94A3B8'}
            onMouseLeave={(e) => e.target.style.color = '#64748B'}
          >
            Skip for now
          </button>
          <div style={{ height: '24px' }} /> {/* Spacer at bottom */}
        </form>
      </div>
    </div>
  );
}