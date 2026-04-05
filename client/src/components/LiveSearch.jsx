import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useDebounce from '../hooks/useDebounce.js';
import { useProducts } from '../hooks/useProducts.js';
import { formatPrice } from '../utils/currency.js';

export default function LiveSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const debouncedQ = useDebounce(query, 400);

  const { data } = useProducts(
    debouncedQ.length >= 2 ? { q: debouncedQ, limit: 5 } : null
  );

  const suggestions = data?.products || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/products?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-lg">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="Search sustainable products..."
        className="w-full border border-gray-300 rounded-full pl-10 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest/50 focus:border-forest"
      />
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white border rounded-xl shadow-lg z-50 py-2 max-h-64 overflow-y-auto">
          {suggestions.map((p) => (
            <button
              key={p._id}
              type="button"
              onMouseDown={() => {
                navigate(`/products/${p._id}`);
                setOpen(false);
                setQuery('');
              }}
              className="w-full text-left px-4 py-2 hover:bg-cream flex items-center gap-3"
            >
              <img
                src={p.images?.[0] || 'https://placehold.co/40x40/1A4A2E/F9F6F0?text=GC'}
                alt=""
                className="w-10 h-10 rounded object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-gray-500">{formatPrice(p.price)} · 🍃 {p.ecoScore}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
