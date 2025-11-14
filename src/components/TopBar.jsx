import React from 'react';

export default function TopBar({ mode, setMode, onQuickCapture }){
  return (
    <div className="h-16 flex items-center justify-between px-4 shadow">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-primary-500" />
        <h3 className="text-lg font-semibold">Perception Map</h3>
      </div>
      <div className="flex items-center gap-2">
        <div className="btn-seg">
          <button onClick={()=>setMode('capture')}>Capture</button>
          <button onClick={()=>setMode('edit')}>Edit</button>
          <button onClick={()=>setMode('reflect')}>Reflect</button>
        </div>
        <button className="btn-primary" onClick={onQuickCapture}>Quick Capture</button>
      </div>
    </div>
  );
}
