import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts.js';
import ProductCard from '../components/ProductCard.jsx';
import FilterSidebar from '../components/FilterSidebar.jsx';
import { ProductCardSkeleton } from '../components/Skeleton.jsx';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'ecoScore_desc', label: 'Eco Score ↓' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
];

export default function Home() {
  const [searchParams] = useSearchParams();
  const qFromUrl = searchParams.get('q') || '';

  const [filters, setFilters] = useState({
    q: qFromUrl,
    category: '',
    minEcoScore: 0,
    maxCarbon: 50,
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
    page: 1,
    limit: 12,
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Build query params — omit empty/default values
  const params = {};
  if (filters.q) params.q = filters.q;
  if (filters.category) params.category = filters.category;
  if (filters.minEcoScore > 0) params.minEcoScore = filters.minEcoScore;
  if (filters.maxCarbon < 50) params.maxCarbon = filters.maxCarbon;
  if (filters.minPrice) params.minPrice = filters.minPrice;
  if (filters.maxPrice) params.maxPrice = filters.maxPrice;
  params.sort = filters.sort;
  params.page = filters.page;
  params.limit = filters.limit;

  const { data, isLoading, isFetching } = useProducts(params);

  const products = data?.products || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <section className="text-center mb-10">
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-forest mb-3">
          Shop Sustainably
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          Discover eco-friendly products from verified green sellers. Every purchase makes a difference.
        </p>
      </section>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <FilterSidebar
            filters={filters}
            onChange={(f) => setFilters((prev) => ({ ...prev, ...f, page: 1 }))}
          />
        </div>

        {/* Main area */}
        <div className="flex-1">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500">
              {data?.total ?? '...'} products found
            </p>
            <div className="flex items-center gap-3">
              <select
                value={filters.sort}
                onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value, page: 1 }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-forest"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                className="lg:hidden text-sm text-forest border border-forest px-3 py-2 rounded-lg"
                onClick={() => setShowMobileFilters((v) => !v)}
              >
                Filters
              </button>
            </div>
          </div>

          {/* Mobile filters bottom sheet */}
          {showMobileFilters && (
            <div className="lg:hidden bg-white border rounded-xl p-6 mb-6 shadow-md">
              <FilterSidebar
                filters={filters}
                onChange={(f) => setFilters((prev) => ({ ...prev, ...f, page: 1 }))}
              />
            </div>
          )}

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${isFetching ? 'opacity-60' : ''}`}>
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>

              {products.length === 0 && (
                <p className="text-center text-gray-400 mt-12">No products match your filters.</p>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setFilters((prev) => ({ ...prev, page: p }))}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        p === filters.page
                          ? 'bg-forest text-cream'
                          : 'bg-white border hover:bg-cream'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
