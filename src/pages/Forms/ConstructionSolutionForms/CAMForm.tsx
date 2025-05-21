import React from 'react';

export default function CAMForm({ nodeId }: { nodeId?: string }) {
  return (
    <div>
      <h2>Formulario CAM</h2>
      <p>ID del nodo: {nodeId}</p>
      <p>Aquí irá el formulario específico para CAM.</p>
    </div>
  );
} 