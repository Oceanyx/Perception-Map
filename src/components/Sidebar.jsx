import React from 'react';
import { useStore } from '../lib/store';

export default function Sidebar(){
  const lenses = useStore(state => state.lenses);
  const activeLensIds = useStore(state => state.activeLensIds);
  const toggleLens = useStore(state => state.toggleLens);

  return (
    <aside className="w-72 p-3 border-r">
      <section>
        <h4 className="font-semibold">Lenses</h4>
        <ul>
          {lenses.map(l => (
            <li key={l.id} className="flex items-center justify-between py-2">
              <div>{l.name}</div>
              <input type="checkbox" checked={activeLensIds.includes(l.id)} onChange={()=>toggleLens(l.id)} />
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
