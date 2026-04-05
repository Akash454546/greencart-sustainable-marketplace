import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAddresses, addAddress, createOrder } from '../api/index.js';
import useCartStore from '../store/cartStore.js';
import useAuthStore from '../store/authStore.js';
import BackButton from '../components/BackButton.jsx';
import { formatPrice, convertToINR } from '../utils/currency.js';

const STEPS = ['Address', 'Summary', 'Confirmation'];

export default function Checkout() {
  const [step, setStep] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [orderResult, setOrderResult] = useState(null);
  const [error, setError] = useState('');
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const { data: addresses = [], isLoading: loadingAddr } = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,    // 10 minutes
  });

  const addAddrMut = useMutation({
    mutationFn: addAddress,
    onSuccess: (newAddress) => {
      // Invalidate addresses list so it refetches
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      // Set the newly created address as selected
      setSelectedAddress(newAddress);
      setStep(1);
      setError('');
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.message || 'Failed to add address';
      setError(errorMsg);
      console.error('Address error:', err);
    },
  });

  const orderMut = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      setOrderResult(data);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setStep(2);
      setError('');
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.message || 'Failed to place order. Please try again.';
      setError(errorMsg);
      console.error('Order error:', err);
    },
  });

  if (!user) {
    return null;
  }

  if (items.length === 0 && step !== 2) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Your cart is empty.</p>
        <button onClick={() => navigate('/')} className="text-forest font-medium hover:underline">Continue shopping →</button>
      </div>
    );
  }

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  const ecoDiscount = subtotal * 0.05;
  const total = subtotal - ecoDiscount;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <BackButton />

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                i <= step ? 'bg-forest text-cream' : 'bg-gray-200 text-gray-500'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs mt-1 ${i <= step ? 'text-forest font-medium' : 'text-gray-400'}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${i < step ? 'bg-forest' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <AddressStep
          addresses={addresses}
          loading={loadingAddr}
          selectedAddress={selectedAddress}
          onSelect={(addr) => { setSelectedAddress(addr); setStep(1); setError(''); }}
          onAdd={(addr) => addAddrMut.mutate(addr)}
          addPending={addAddrMut.isPending}
          error={error}
        />
      )}

      {step === 1 && (
        <SummaryStep
          items={items}
          address={selectedAddress}
          subtotal={subtotal}
          ecoDiscount={ecoDiscount}
          total={total}
          onBack={() => setStep(0)}
          onConfirm={() => {
            setError('');
            orderMut.mutate({
              items: items.map((i) => ({ product: i.product._id, qty: i.qty })),
              shippingAddress: selectedAddress,
            });
          }}
          isPending={orderMut.isPending}
          error={error}
        />
      )}

      {step === 2 && (
        <ConfirmationStep order={orderResult} onContinue={() => navigate('/my-orders')} />
      )}
    </div>
  );
}

/* ── Address Step ── */
function AddressStep({ addresses, loading, selectedAddress, onSelect, onAdd, addPending, error }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fullName: '', mobile: '', pincode: '', addressLine1: '', addressLine2: '',
    city: '', state: '', addressType: 'home',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting address:', form);
    onAdd(form);
  };

  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-forest mb-4">Select Delivery Address</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6 text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading && <p className="text-gray-400">Loading addresses...</p>}

      <div className="space-y-3 mb-4">
        {addresses.map((addr) => (
          <div
            key={addr._id}
            onClick={() => onSelect(addr)}
            className={`border rounded-xl p-4 cursor-pointer transition-colors hover:border-forest ${
              selectedAddress?._id === addr._id ? 'border-forest bg-green-50' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm">{addr.fullName}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase">{addr.addressType}</span>
            </div>
            <p className="text-sm text-gray-600">{addr.addressLine1}{addr.addressLine2 && `, ${addr.addressLine2}`}</p>
            <p className="text-sm text-gray-600">{addr.city}, {addr.state} — {addr.pincode}</p>
            <p className="text-xs text-gray-500 mt-1">Mobile: {addr.mobile}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => { setShowForm(!showForm); if (showForm) setError(''); }}
        className="text-sm text-forest font-medium hover:underline mb-4"
      >
        {showForm ? '✕ Cancel' : '+ Add new address'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-cream rounded-xl p-5 space-y-3 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder="Full Name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Mobile (10 digits)" required pattern="\d{10}" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Address Line 1" required value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} className="border rounded-lg px-3 py-2 text-sm md:col-span-2" />
            <input placeholder="Address Line 2 (optional)" value={form.addressLine2} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} className="border rounded-lg px-3 py-2 text-sm md:col-span-2" />
            <input placeholder="City" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="State" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Pincode (6 digits)" required pattern="\d{6}" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            <select value={form.addressType} onChange={(e) => setForm({ ...form, addressType: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
              <option value="home">Home</option>
              <option value="work">Work</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={addPending} className="flex-1 bg-forest text-cream px-5 py-2 rounded-lg text-sm font-medium hover:bg-forest-light transition-colors disabled:opacity-50">
              {addPending ? 'Saving...' : 'Save & Use This Address'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="border px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
          </div>
        </form>
      )}

      {selectedAddress && !showForm && (
        <div className="flex gap-3 mt-6">
          <button
            disabled={!selectedAddress}
            className="flex-1 bg-forest text-cream py-3 rounded-lg font-semibold hover:bg-forest-light transition-colors disabled:opacity-50"
            onClick={() => {
              // This is handled by parent component on address select
              // Just here as visual confirmation
            }}
          >
            ✓ Address Selected - Continue to Summary
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Summary Step ── */
function SummaryStep({ items, address, subtotal, ecoDiscount, total, onBack, onConfirm, isPending, error }) {
  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-forest mb-4">Order Summary</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6 text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Shipping address */}
      <div className="bg-cream rounded-xl p-4 mb-6">
        <h3 className="text-sm font-medium text-forest mb-1">Delivering to</h3>
        <p className="text-sm">{address.fullName} — {address.mobile}</p>
        <p className="text-sm text-gray-600">{address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}, {address.city}, {address.state} — {address.pincode}</p>
      </div>

      {/* Items */}
      <div className="divide-y mb-6">
        {items.map(({ product, qty }) => (
          <div key={product._id} className="flex items-center gap-4 py-3">
            <img
              src={product.images?.[0] || 'https://placehold.co/60x60/1A4A2E/F9F6F0?text=GC'}
              alt={product.name}
              className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{product.name}</p>
              <p className="text-xs text-gray-500">Qty: {qty} · {formatPrice(product.price)} each</p>
            </div>
            <p className="font-medium text-sm">{formatPrice(product.price * qty)}</p>
          </div>
        ))}
      </div>

      {/* Price breakdown */}
      <div className="border-t pt-4 space-y-2 mb-6">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-green-600">
          <span>🌿 Eco Discount (5%)</span>
          <span>-{formatPrice(ecoDiscount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Delivery</span>
          <span className="text-green-600">Free</span>
        </div>
        <div className="flex justify-between font-heading text-lg font-bold text-forest pt-2 border-t">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="border border-gray-300 px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
          Change Address
        </button>
        <button onClick={onConfirm} disabled={isPending} className="flex-1 bg-forest text-cream py-3 rounded-lg font-semibold hover:bg-forest-light transition-colors disabled:opacity-50">
          {isPending ? 'Placing order...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}

/* ── Confirmation Step ── */
function ConfirmationStep({ order, onContinue }) {
  return (
    <div className="text-center py-12">
      {/* Animated checkmark */}
      <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="font-heading text-2xl font-bold text-forest mb-2">Order Placed!</h2>
      <p className="text-gray-500 mb-2">
        Your order <strong>#{order?._id?.slice(-6)}</strong> has been placed successfully.
      </p>
      {order?.ecoDiscount > 0 && (
        <p className="text-green-600 text-sm mb-6">🌿 You saved {formatPrice(order.ecoDiscount)} with eco discount!</p>
      )}
      <button
        onClick={onContinue}
        className="bg-forest text-cream px-8 py-3 rounded-lg font-semibold hover:bg-forest-light transition-colors"
      >
        View My Orders
      </button>
    </div>
  );
}