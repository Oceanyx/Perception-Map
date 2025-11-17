// src/App.jsx
import React, { useState } from "react";
import CanvasView from "./components/CanvasView";

export default function App()  {

  return (
    <div className="app-root">
      <div className="canvas-shell">
        <CanvasView/>
      </div>
    </div>
  );
}
