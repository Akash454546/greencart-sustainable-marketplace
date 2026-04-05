import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDashboard, fetchSellerOrders, createProduct, updateProduct, deleteProduct, createCertification, updateOrderStatus } from '../api/index.js';
import EcoBadge from '../components/EcoBadge.jsx';
import BackButton from '../components/BackButton.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TABS = ['My Listings', 'Certifications', 'Orders', 'Analytics'];

export default function SellerDashboard() {
  const [tab, setTab] = useState(0);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });
  const { data: orders } = useQuery({ queryKey: ['sellerOrders'], queryFn: fetchSellerOrders });

  if (isLoading) {
    return <div className="max-w-6xl mx-auto px-4 py-12"><p className="text-gray-400">Loading dashboard...</p></div>;
  }

  const { seller, listings } = data || {};

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <BackButton />
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-forest flex items-center justify-center text-cream text-2xl font-bold">
          {seller?.businessName?.[0] || 'S'}
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-forest">{seller?.businessName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <EcoBadge score={seller?.ecoScore || 0} />
            {seller?.isVerified && <span className="text-green-600 text-xs font-medium">✓ Verified</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6 overflow-x-auto">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              tab === i ? 'text-forest border-b-2 border-forest' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && <ListingsTab listings={listings || []} />}
      {tab === 1 && <CertificationsTab certifications={seller?.certifications || []} />}
      {tab === 2 && <OrdersTab orders={orders || []} />}
      {tab === 3 && <AnalyticsTab listings={listings || []} />}
    </div>
  );
}

/* ============ Listings Tab ============ */
function ListingsTab({ listings }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const queryClient = useQueryClient();

  const deleteMut = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }) => updateProduct(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-heading text-lg font-semibold text-forest">Products ({listings.length})</h3>
        <button
          onClick={() => { setShowForm(true); setEditId(null); }}
          className="bg-forest text-cream px-4 py-2 rounded-lg text-sm font-medium hover:bg-forest-light transition-colors"
        >
          + Add Product
        </button>
      </div>

      {showForm && (
        <ProductForm
          editId={editId}
          existing={editId ? listings.find((l) => l._id === editId) : null}
          onClose={() => { setShowForm(false); setEditId(null); }}
        />
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2">Name</th>
              <th className="pb-2">Price</th>
              <th className="pb-2">Eco</th>
              <th className="pb-2">Stock</th>
              <th className="pb-2">Active</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((p) => (
              <tr key={p._id} className="border-b">
                <td className="py-3 font-medium">{p.name}</td>
                <td className="py-3">${p.price.toFixed(2)}</td>
                <td className="py-3"><EcoBadge score={p.ecoScore} /></td>
                <td className="py-3">{p.stock}</td>
                <td className="py-3">
                  <button
                    onClick={() => toggleMut.mutate({ id: p._id, isActive: !p.isActive })}
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {p.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="py-3 space-x-2">
                  <button
                    onClick={() => { setEditId(p._id); setShowForm(true); }}
                    className="text-forest hover:underline text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteMut.mutate(p._id)}
                    className="text-red-500 hover:underline text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============ Product Form ============ */
function ProductForm({ editId, existing, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(
    existing
      ? { ...existing, imageUrl: existing.images?.[0] || '' }
      : {
          name: '', description: '', price: '', category: 'food',
          carbonFootprint: '', ecoScore: '', stock: '', tags: '', imageUrl: '',
        }
  );

  const mutation = useMutation({
    mutationFn: (data) => editId ? updateProduct(editId, data) : createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      carbonFootprint: Number(form.carbonFootprint) || 0,
      ecoScore: Number(form.ecoScore) || 0,
      stock: Number(form.stock) || 0,
      images: form.imageUrl ? [form.imageUrl] : [],
      tags: typeof form.tags === 'string' ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : form.tags,
    };
    delete payload.imageUrl;
    mutation.mutate(payload);
  };

  return (
    <div className="bg-cream rounded-xl p-6 mb-6">
      <h4 className="font-heading font-semibold text-forest mb-4">{editId ? 'Edit Product' : 'New Product'}</h4>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
          {['food', 'fashion', 'home', 'beauty', 'tech', 'other'].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input placeholder="Price" type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        <input placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        <input placeholder="Carbon (kg CO₂e)" type="number" step="0.1" value={form.carbonFootprint} onChange={(e) => setForm({ ...form, carbonFootprint: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        <input placeholder="Eco Score (0–100)" type="number" value={form.ecoScore} onChange={(e) => setForm({ ...form, ecoScore: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        <input placeholder="Tags (comma-separated)" value={typeof form.tags === 'string' ? form.tags : form.tags?.join(', ')} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="border rounded-lg px-3 py-2 text-sm md:col-span-2" />
        <div className="md:col-span-2">
          <input placeholder="Image URL (https://...)" type="url" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" />
          {form.imageUrl && (
            <img src={form.imageUrl} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg border" onError={(e) => { e.target.style.display = 'none'; }} onLoad={(e) => { e.target.style.display = 'block'; }} />
          )}
        </div>
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border rounded-lg px-3 py-2 text-sm md:col-span-2" rows={2} />
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" disabled={mutation.isPending} className="bg-forest text-cream px-4 py-2 rounded-lg text-sm font-medium hover:bg-forest-light transition-colors disabled:opacity-50">
            {mutation.isPending ? 'Saving...' : editId ? 'Update' : 'Create'}
          </button>
          <button type="button" onClick={onClose} className="border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
        </div>
      </form>
    </div>
  );
}

/* ============ Certifications Tab ============ */
function CertificationsTab({ certifications }) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createCertification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowForm(false);
    },
  });

  const [form, setForm] = useState({ name: '', issuingBody: '', issueDate: '', expiryDate: '', documentUrl: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-heading text-lg font-semibold text-forest">Certifications ({certifications.length})</h3>
        <button onClick={() => setShowForm(!showForm)} className="bg-forest text-cream px-4 py-2 rounded-lg text-sm font-medium hover:bg-forest-light transition-colors">
          + Upload Certification
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-cream rounded-xl p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input placeholder="Certificate Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Issuing Body" required value={form.issuingBody} onChange={(e) => setForm({ ...form, issuingBody: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
          <input type="date" required value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
          <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Document URL" value={form.documentUrl} onChange={(e) => setForm({ ...form, documentUrl: e.target.value })} className="border rounded-lg px-3 py-2 text-sm md:col-span-2" />
          <div className="md:col-span-2">
            <button type="submit" disabled={mutation.isPending} className="bg-forest text-cream px-4 py-2 rounded-lg text-sm font-medium hover:bg-forest-light transition-colors disabled:opacity-50">
              {mutation.isPending ? 'Uploading...' : 'Submit'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {certifications.map((c) => (
          <div key={c._id} className="bg-white border rounded-xl p-4 flex items-center justify-between">
            <div>
              <h4 className="font-medium">{c.name}</h4>
              <p className="text-xs text-gray-500">{c.issuingBody} · Issued {new Date(c.issueDate).toLocaleDateString()}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColors[c.status]}`}>
              {c.status}
            </span>
          </div>
        ))}
        {certifications.length === 0 && <p className="text-gray-400 text-sm">No certifications yet.</p>}
      </div>
    </div>
  );
}

/* ============ Orders Tab ============ */
const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};
const NEXT_STATUS = {
  pending: 'confirmed',
  confirmed: 'shipped',
  shipped: 'delivered',
};

function OrdersTab({ orders }) {
  const queryClient = useQueryClient();
  const statusMut = useMutation({
    mutationFn: ({ id, status }) => updateOrderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sellerOrders'] }),
  });

  return (
    <div>
      <h3 className="font-heading text-lg font-semibold text-forest mb-4">Incoming Orders ({orders.length})</h3>
      <div className="space-y-4">
        {orders.map((order) => {
          const nextStatus = NEXT_STATUS[order.status];
          return (
            <div key={order._id} className="bg-white border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium">Order #{order._id.slice(-6)}</p>
                  <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()} · {order.buyer?.name}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                  {order.status}
                </span>
              </div>
              <div className="space-y-1">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.product?.name || 'Product'} × {item.qty}</span>
                    <span>${(item.priceAtPurchase * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <span className="text-xs text-gray-500">🌿 Total carbon: {order.totalCarbon?.toFixed(1)} kg CO₂e</span>
                <div className="flex gap-2">
                  {nextStatus && (
                    <button
                      onClick={() => statusMut.mutate({ id: order._id, status: nextStatus })}
                      disabled={statusMut.isPending}
                      className="text-xs bg-forest text-cream px-3 py-1.5 rounded-lg font-medium hover:bg-forest-light transition-colors disabled:opacity-50 capitalize"
                    >
                      Mark {nextStatus}
                    </button>
                  )}
                  {order.status !== 'cancelled' && order.status !== 'delivered' && (
                    <button
                      onClick={() => statusMut.mutate({ id: order._id, status: 'cancelled' })}
                      disabled={statusMut.isPending}
                      className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {orders.length === 0 && <p className="text-gray-400 text-sm">No orders yet.</p>}
      </div>
    </div>
  );
}

/* ============ Analytics Tab ============ */
function AnalyticsTab({ listings }) {
  const chartData = listings.map((p) => ({
    name: p.name.length > 15 ? p.name.slice(0, 15) + '…' : p.name,
    ecoScore: p.ecoScore,
    carbon: p.carbonFootprint,
  }));

  return (
    <div>
      <h3 className="font-heading text-lg font-semibold text-forest mb-4">Eco Score by Product</h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="ecoScore" fill="#1A4A2E" radius={[4, 4, 0, 0]} />
            <Bar dataKey="carbon" fill="#D4821A" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-gray-400 text-sm">Add products to see analytics.</p>
      )}
    </div>
  );
}
