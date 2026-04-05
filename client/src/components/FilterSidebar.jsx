import { useState, useMemo } from 'react';
import useDebounce from '../hooks/useDebounce.js';

const CATEGORIES = ['food', 'fashion', 'home', 'beauty', 'tech', 'other'];

export default function FilterSidebar({ filters, onChange }) {
  const [local, setLocal] = useState(filters);

  const debounced = useDebounce(local, 300);

  // Sync debounced value to parent
  useMemo(() => {
    onChange(debounced);
  }, [debounced]);

  const update = (key, value) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <aside className="space-y-6">
      <div>
        <h4 className="font-heading font-semibold text-forest mb-3">Category</h4>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={local.category === cat}
                onChange={() => update('category', local.category === cat ? '' : cat)}
                className="rounded border-gray-300 text-forest focus:ring-forest"
              />
              <span className="text-sm capitalize">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-heading font-semibold text-forest mb-3">Eco Score ({local.minEcoScore || 0}+)</h4>
        <input
          type="range"
          min={0}
          max={100}
          value={local.minEcoScore || 0}
          onChange={(e) => update('minEcoScore', Number(e.target.value))}
          className="w-full accent-forest"
        />
      </div>

      <div>
        <h4 className="font-heading font-semibold text-forest mb-3">Max Carbon ({local.maxCarbon || 50} kg)</h4>
        <input
          type="range"
          min={0}
          max={50}
          value={local.maxCarbon || 50}
          onChange={(e) => update('maxCarbon', Number(e.target.value))}
          className="w-full accent-forest"
        />
      </div>

      <div>
        <h4 className="font-heading font-semibold text-forest mb-3">Price Range</h4>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={local.minPrice || ''}
            onChange={(e) => update('minPrice', e.target.value)}
            className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-forest"
          />
          <input
            type="number"
            placeholder="Max"
            value={local.maxPrice || ''}
            onChange={(e) => update('maxPrice', e.target.value)}
            className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-forest"
          />
        </div>
      </div>
    </aside>
  );
}
