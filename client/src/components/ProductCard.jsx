import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EcoBadge from './EcoBadge.jsx';
import useCartStore from '../store/cartStore.js';

export default function ProductCard({ product }) {
  const addItem = useCartStore((s) => s.addItem);
  const cardRef = useRef(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const sellerName = product.seller?.businessName || 'Unknown Seller';
  const image = product.images?.[0] || 'https://placehold.co/400x300/1A4A2E/F9F6F0?text=GreenCart';
  const fallback = 'https://placehold.co/400x300/1A4A2E/F9F6F0?text=GreenCart';

  return (
    <div ref={cardRef} className="fade-up bg-white rounded-xl shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
      <Link to={`/products/${product._id}`} className="block relative overflow-hidden aspect-[4/3]">
        <img
          src={image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.onerror = null; e.target.src = fallback; }}
        />
        <div className="absolute top-3 left-3">
          <EcoBadge score={product.ecoScore} />
        </div>
      </Link>
      <div className="p-4 space-y-2">
        <p className="text-xs text-gray-500">{sellerName}</p>
        <Link to={`/products/${product._id}`}>
          <h3 className="font-heading font-semibold text-forest truncate">{product.name}</h3>
        </Link>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-forest">${product.price.toFixed(2)}</span>
          <span className="text-xs text-gray-500">🌿 {product.carbonFootprint} kg CO₂e</span>
        </div>
        <button
          onClick={() => addItem(product)}
          className="w-full bg-forest text-cream py-2 rounded-lg font-medium text-sm hover:bg-forest-light transition-colors"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
