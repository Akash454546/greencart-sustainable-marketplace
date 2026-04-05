import useCartStore from '../store/cartStore.js';
import useAuthStore from '../store/authStore.js';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../utils/currency.js';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, clearCart } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  const totalCarbon = items.reduce((sum, i) => sum + (i.product.carbonFootprint || 0) * i.qty, 0);
  // Approximate non-eco average: 3x carbon
  const carbonSaved = totalCarbon * 2;

  const handleCheckout = () => {
    closeCart();
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={closeCart} />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-heading text-xl font-bold text-forest">Your Cart</h2>
          <button onClick={closeCart} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 && (
            <p className="text-gray-400 text-center mt-12">Your cart is empty</p>
          )}
          {items.map(({ product, qty }) => (
            <div key={product._id} className="flex gap-4">
              <img
                src={product.images?.[0] || 'https://placehold.co/80x80/1A4A2E/F9F6F0?text=GC'}
                alt={product.name}
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{product.name}</h4>
                <p className="text-xs text-gray-500">🌿 {product.carbonFootprint} kg CO₂e</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => updateQty(product._id, qty - 1)}
                    className="w-7 h-7 rounded-full border flex items-center justify-center text-sm hover:bg-gray-100"
                  >
                    −
                  </button>
                  <span className="text-sm font-medium w-6 text-center">{qty}</span>
                  <button
                    onClick={() => updateQty(product._id, qty + 1)}
                    className="w-7 h-7 rounded-full border flex items-center justify-center text-sm hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="text-right flex flex-col justify-between">
                <span className="font-semibold text-sm">{formatPrice(product.price * qty)}</span>
                <button
                  onClick={() => removeItem(product._id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t px-6 py-4 space-y-3">
            <div className="bg-green-50 rounded-lg p-3 text-sm text-green-800">
              🌍 Carbon footprint: <strong>{totalCarbon.toFixed(1)} kg CO₂e</strong>
              <br />
              Estimated carbon saved vs. conventional: <strong>{carbonSaved.toFixed(1)} kg CO₂e</strong>
            </div>
            <div className="flex items-center justify-between font-heading text-lg font-bold">
              <span>Subtotal</span>
              <span className="text-forest">{formatPrice(subtotal)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-forest text-cream py-3 rounded-lg font-semibold hover:bg-forest-light transition-colors"
            >
              Proceed to Checkout
            </button>
            <button
              onClick={clearCart}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Clear cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
