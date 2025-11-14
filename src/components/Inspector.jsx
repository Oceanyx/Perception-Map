import React from 'react';

export default function Inspector({ selected }){
  if(!selected) return <div className="w-80 p-4">Select a node</div>;
  return (
    <div className="w-80 p-4">
      <h3 className="font-semibold">{selected.title}</h3>
      <div className="mt-2 text-sm text-gray-600">{selected.body}</div>
    </div>
  );
}
