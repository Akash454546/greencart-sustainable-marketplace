import { useQuery } from '@tanstack/react-query';
import { fetchMyOrders } from '../api/index.js';
import useAuthStore from '../store/authStore.js';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton.jsx';

const STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];
const STEP_LABELS = ['Placed', 'Confirmed', 'Shipped', 'Delivered'];

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function StepTracker({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 font-medium">
        ✕ This order has been cancelled
      </div>
    );
  }

  const currentIdx = STEPS.indexOf(status);

  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, i) => {
        const isCompleted = i <= currentIdx;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isCompleted
                    ? 'bg-forest text-cream'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? '✓' : i + 1}
              </div>
              <span className={`text-xs mt-1 whitespace-nowrap ${isCompleted ? 'text-forest font-medium' : 'text-gray-400'}`}>
                {STEP_LABELS[i]}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-2 ${i < currentIdx ? 'bg-forest' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MyOrders() {
  const user = useAuthStore((s) => s.user);
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchMyOrders,
    enabled: !!user,
    refetchInterval: 30000,
  });

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">
          Please <Link to="/login" className="text-forest font-medium hover:underline">log in</Link> to view your orders.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="max-w-3xl mx-auto px-4 py-12"><p className="text-gray-400">Loading orders...</p></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <BackButton />
      <h1 className="font-heading text-2xl font-bold text-forest mb-6">My Orders</h1>

      {(!orders || orders.length === 0) && (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">You haven't placed any orders yet.</p>
          <Link to="/" className="text-forest font-medium hover:underline">Start shopping →</Link>
        </div>
      )}

      <div className="space-y-6">
        {orders?.map((order) => {
          const subtotal = order.items.reduce((s, i) => s + i.priceAtPurchase * i.qty, 0);
          return (
            <div key={order._id} className="bg-white border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Order #{order._id.slice(-6)}</p>
                  <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                  {order.status}
                </span>
              </div>

              {/* Step Tracker */}
              <StepTracker status={order.status} />

              {/* Items */}
              <div className="divide-y">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 py-3">
                    <img
                      src={item.product?.images?.[0] || 'https://placehold.co/60x60/1A4A2E/F9F6F0?text=GC'}
                      alt={item.product?.name}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/60x60/1A4A2E/F9F6F0?text=GC'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product?.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.qty} · ${item.priceAtPurchase.toFixed(2)} each</p>
                    </div>
                    <p className="font-medium text-sm">${(item.priceAtPurchase * item.qty).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t text-sm">
                <span className="text-gray-500">🌿 Carbon: {order.totalCarbon?.toFixed(1)} kg CO₂e</span>
                <div className="text-right">
                  {order.ecoDiscount > 0 && (
                    <p className="text-xs text-green-600">Eco discount: -${order.ecoDiscount.toFixed(2)}</p>
                  )}
                  <span className="font-heading font-bold text-forest">
                    Total: ${(subtotal - (order.ecoDiscount || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
