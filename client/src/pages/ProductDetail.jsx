import { useParams } from 'react-router-dom';
import { useProduct } from '../hooks/useProducts.js';
import EcoBadge from '../components/EcoBadge.jsx';
import useCartStore from '../store/cartStore.js';
import BackButton from '../components/BackButton.jsx';

const FALLBACK_IMG = 'https://placehold.co/600x600/1A4A2E/F9F6F0?text=GreenCart';

export default function ProductDetail() {
  const { id } = useParams();
  const { data: product, isLoading, error } = useProduct(id);
  const addItem = useCartStore((s) => s.addItem);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="skeleton aspect-square rounded-xl" />
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-12 w-40" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-500 mt-12">Failed to load product.</p>;
  }

  if (!product) return null;

  const image = product.images?.[0] || FALLBACK_IMG;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <BackButton />
      <div className="grid md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="rounded-xl overflow-hidden bg-white shadow-sm">
          <img src={image} alt={product.name} className="w-full aspect-square object-cover" onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} />
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <p className="text-sm text-gray-500 mb-1">{product.seller?.businessName}</p>
            <h1 className="font-heading text-3xl font-bold text-forest">{product.name}</h1>
          </div>

          <div className="flex items-center gap-3">
            <EcoBadge score={product.ecoScore} />
            <span className="text-sm text-gray-500">🌿 {product.carbonFootprint} kg CO₂e per unit</span>
          </div>

          <p className="text-2xl font-bold text-forest">${product.price.toFixed(2)}</p>

          <p className="text-gray-600 leading-relaxed">{product.description}</p>

          <div className="flex flex-wrap gap-2">
            {product.tags?.map((tag) => (
              <span key={tag} className="bg-cream text-forest text-xs px-3 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Category: <strong className="capitalize">{product.category}</strong></span>
            <span>Stock: <strong>{product.stock}</strong></span>
          </div>

          <button
            onClick={() => addItem(product)}
            disabled={product.stock === 0}
            className="bg-forest text-cream px-8 py-3 rounded-lg font-semibold text-lg hover:bg-forest-light transition-colors disabled:opacity-50"
          >
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
