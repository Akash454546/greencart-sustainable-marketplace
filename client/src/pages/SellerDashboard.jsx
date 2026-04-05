import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDashboard, fetchSellerOrders, createProduct, updateProduct, deleteProduct, createCertification, updateOrderStatus } from '../api/index.js';
import EcoBadge from '../components/EcoBadge.jsx';
import BackButton from '../components/BackButton.jsx';
import { formatPrice } from '../utils/currency.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TABS = ['My Listings', 'Certifications', 'Orders', 'Analytics'];

export default function SellerDashboard() {
  const [tab, setTab] = useState(0);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ 
    queryKey: ['dashboard'], 
    queryFn: fetchDashboard,
    staleTime: 3 * 60 * 1000,  // 3 minutes
    gcTime: 10 * 60 * 1000,    // 10 minutes
  });
  const { data: orders } = useQuery({ 
    queryKey: ['sellerOrders'], 
    queryFn: fetchSellerOrders,
    staleTime: 2 * 60 * 1000,  // 2 minutes
    gcTime: 5 * 60 * 1000,     // 5 minutes
  });

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
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const deleteMut = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to delete product');
    },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }) => updateProduct(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to update product');
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-heading text-lg font-semibold text-forest">My Products</h3>
          <p className="text-xs text-gray-500 mt-1">{listings.length} active listings</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); }}
          className="bg-forest text-cream px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-forest-light transition-colors shadow-sm"
        >
          + Add Product
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {showForm && (
        <ProductForm
          editId={editId}
          existing={editId ? listings.find((l) => l._id === editId) : null}
          onClose={() => { setShowForm(false); setEditId(null); setError(''); }}
          onError={(msg) => setError(msg)}
        />
      )}

      {listings.length === 0 ? (
        <div className="bg-cream rounded-xl p-8 text-center">
          <p className="text-gray-500 mb-4">No products yet. Start by adding your first sustainable product!</p>
          <button
            onClick={() => { setShowForm(true); setEditId(null); }}
            className="bg-forest text-cream px-4 py-2 rounded-lg text-sm font-medium hover:bg-forest-light"
          >
            Add First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((p) => (
            <div key={p._id} className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              {/* Product Image */}
              <div className="w-full h-40 bg-gray-100 overflow-hidden">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                )}
              </div>
              
              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm text-gray-900 line-clamp-2">{p.name}</h4>
                  <EcoBadge score={p.ecoScore} />
                </div>
                
                <p className="text-xs text-gray-500 mb-3">{p.category}</p>
                
                <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                  <div className="bg-gray-50 p-2 rounded text-center">
                    <div className="font-semibold text-forest">{formatPrice(p.price)}</div>
                    <div className="text-gray-500">Price</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded text-center">
                    <div className="font-semibold text-gray-900">{p.stock}</div>
                    <div className="text-gray-500">Stock</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded text-center">
                    <div className="font-semibold">{p.carbonFootprint}kg</div>
                    <div className="text-gray-500">Carbon</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-3 pt-3 border-t">
                  <button
                    onClick={() => toggleMut.mutate({ id: p._id, isActive: !p.isActive })}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                      p.isActive 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {p.isActive ? '✓ Active' : '✗ Inactive'}
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditId(p._id); setShowForm(true); }}
                    className="flex-1 text-forest hover:bg-green-50 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this product?')) {
                        deleteMut.mutate(p._id);
                      }
                    }}
                    className="flex-1 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============ Product Form ============ */
function ProductForm({ editId, existing, onClose, onError }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(existing?.images?.[0] || '');
  const [form, setForm] = useState(
    existing
      ? { 
          name: existing.name, 
          description: existing.description,
          price: existing.price, 
          category: existing.category,
          carbonFootprint: existing.carbonFootprint, 
          ecoScore: existing.ecoScore, 
          stock: existing.stock, 
          tags: existing.tags?.join(', ') || '' 
        }
      : {
          name: '', description: '', price: '', category: 'food',
          carbonFootprint: '', ecoScore: '', stock: '', tags: '',
        }
  );

  const mutation = useMutation({
    mutationFn: (data) => editId ? updateProduct(editId, data) : createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
      setError('');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Operation failed';
      setError(msg);
      if (onError) onError(msg);
    },
  });

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Product name is required');
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category,
      carbonFootprint: form.carbonFootprint ? Number(form.carbonFootprint) : 0,
      ecoScore: form.ecoScore ? Number(form.ecoScore) : 0,
      stock: form.stock ? Number(form.stock) : 0,
      images: imagePreview ? [imagePreview] : [],
      tags: form.tags
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    };

    mutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h2 className="font-heading text-xl font-bold text-forest">
            {editId ? '✎ Edit Product' : '+ Add New Product'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Product Image</label>
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">📷</span>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-forest file:text-cream file:cursor-pointer hover:file:bg-forest-light"
                />
                <p className="text-xs text-gray-500 mt-2">PNG, JPG or GIF (max 5MB)</p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Organic Bamboo Toothbrush"
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50">
                {['food', 'fashion', 'home', 'beauty', 'tech', 'other'].map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="0"
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carbon Footprint (kg CO₂)</label>
              <input
                type="number"
                step="0.1"
                value={form.carbonFootprint}
                onChange={(e) => setForm({ ...form, carbonFootprint: e.target.value })}
                placeholder="0.0"
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
              />
            </div>
          </div>

          {/* Eco Score & Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eco Score (0–100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.ecoScore}
                onChange={(e) => setForm({ ...form, ecoScore: e.target.value })}
                placeholder="0"
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="e.g., organic, eco-friendly, natural"
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your product and its sustainability features..."
              rows={4}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50 resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-6 py-3 bg-forest text-cream rounded-lg font-semibold hover:bg-forest-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? (editId ? 'Updating...' : 'Creating...') : (editId ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============ Certifications Tab ============ */
function CertificationsTab({ certifications }) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createCertification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowForm(false);
      setError('');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to upload certificate';
      setError(msg);
    },
  });

  const [form, setForm] = useState({ name: '', issuingBody: '', issueDate: '', expiryDate: '', documentUrl: '' });
  const [documPreview, setDocumPreview] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setDocumPreview(event.target.result);
        setForm({ ...form, documentUrl: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Certificate name is required');
      return;
    }
    if (!form.issuingBody.trim()) {
      setError('Issuing body is required');
      return;
    }
    if (!form.issueDate) {
      setError('Issue date is required');
      return;
    }
    if (!form.documentUrl) {
      setError('Certificate image is required');
      return;
    }

    mutation.mutate(form);
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <div>
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-sm text-blue-900 mb-2">📋 What are certifications?</h4>
        <p className="text-xs text-blue-800">
          Upload sustainability certifications (ISO 14001, Organic, Fair Trade, B-Corp, etc.) to build trust with buyers. 
          Each <strong>approved certification</strong> increases your Eco Score by 20 points (max 100). Buyers see your 
          certifications as proof of your sustainability commitment.
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h3 className="font-heading text-lg font-semibold text-forest">Certifications ({certifications.length})</h3>
        <button 
          onClick={() => { setShowForm(!showForm); setError(''); }} 
          className="bg-forest text-cream px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-forest-light transition-colors shadow-sm"
        >
          + Upload Certification
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h4 className="font-heading font-semibold text-forest mb-4">Upload Certification Documents</h4>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-red-700 text-sm flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Certificate File Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Certificate Image</label>
              <div className="flex gap-4">
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                  {documPreview ? (
                    <img src={documPreview} alt="Certificate" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">📄</span>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border rounded-lg text-sm text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-forest file:text-cream file:cursor-pointer hover:file:bg-forest-light"
                  />
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF, or PDF (max 5MB)</p>
                </div>
              </div>
            </div>

            {/* Certificate Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Name *</label>
                <input 
                  placeholder="e.g., ISO 14001, Organic Certified, Fair Trade" 
                  required 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Body *</label>
                <input 
                  placeholder="e.g., International Standards Organization" 
                  required 
                  value={form.issuingBody} 
                  onChange={(e) => setForm({ ...form, issuingBody: e.target.value })} 
                  className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date *</label>
                <input 
                  type="date" 
                  required 
                  value={form.issueDate} 
                  onChange={(e) => setForm({ ...form, issueDate: e.target.value })} 
                  className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
                <input 
                  type="date" 
                  value={form.expiryDate} 
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} 
                  className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button 
                type="button" 
                onClick={() => { setShowForm(false); setError(''); }} 
                className="flex-1 px-4 py-3 border rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={mutation.isPending} 
                className="flex-1 px-4 py-3 bg-forest text-cream rounded-lg font-semibold hover:bg-forest-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mutation.isPending ? 'Uploading...' : 'Upload Certificate'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Certifications List */}
      <div className="space-y-3">
        {certifications.length === 0 ? (
          <div className="bg-cream rounded-xl p-8 text-center">
            <p className="text-gray-500">No certifications yet. Build buyer trust by uploading your sustainability certifications!</p>
          </div>
        ) : (
          certifications.map((c) => (
            <div key={c._id} className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                {/* Certificate Image */}
                {c.documentUrl && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    <img src={c.documentUrl} alt={c.name} className="w-full h-full object-cover" />
                  </div>
                )}
                
                {/* Certificate Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h4 className="font-semibold text-gray-900">{c.name}</h4>
                      <p className="text-xs text-gray-500">{c.issuingBody}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${statusColors[c.status]}`}>
                      {c.status === 'pending' && '⏳ Pending'}
                      {c.status === 'approved' && '✓ Approved'}
                      {c.status === 'rejected' && '✕ Rejected'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <p>Issued: {new Date(c.issueDate).toLocaleDateString()}</p>
                    {c.expiryDate && <p>Expires: {new Date(c.expiryDate).toLocaleDateString()}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
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

function OrdersTab({ orders }) {
  const queryClient = useQueryClient();
  const statusMut = useMutation({
    mutationFn: ({ id, status }) => updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellerOrders'] });
    },
    onError: (err) => {
      console.error('Status update error:', err);
    },
  });

  const NEXT_STATUS = {
    pending: 'confirmed',
    confirmed: 'shipped',
    shipped: 'delivered',
    delivered: null,
    cancelled: null,
  };

  return (
    <div>
      <h3 className="font-heading text-lg font-semibold text-forest mb-6">Incoming Orders</h3>
      {orders.length === 0 ? (
        <div className="bg-cream rounded-xl p-8 text-center">
          <p className="text-gray-500">No orders yet. Your products will appear here when customers purchase them.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const nextStatus = NEXT_STATUS[order.status];
            return (
              <div key={order._id} className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                {/* Order Header */}
                <div className="bg-gradient-to-r from-forest/5 to-green-50 px-5 py-4 flex items-center justify-between border-b">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold text-gray-900">Order #{order._id.slice(-8).toUpperCase()}</p>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString()}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-forest">{formatPrice(order.total)}</div>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Buyer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-2">👤 Buyer</h4>
                      <div className="text-sm space-y-1">
                        <p className="font-medium text-gray-900">{order.buyerName}</p>
                        <p className="text-gray-600">{order.buyerEmail}</p>
                        {order.buyerMobile && <p className="text-gray-600">{order.buyerMobile}</p>}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-2">📦 Shipping Address</h4>
                      <div className="text-sm text-gray-700 space-y-0.5">
                        <p className="font-medium">{order.shippingAddress?.fullName}</p>
                        <p>{order.shippingAddress?.addressLine1}</p>
                        {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                        <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t pt-4">
                    <h4 className="text-xs font-semibold text-gray-700 mb-3">📋 Items</h4>
                    <div className="space-y-2">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg text-sm">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{item.product?.name || 'Product'}</p>
                              <p className="text-xs text-gray-500">Qty: {item.qty} • Eco Score: {item.product?.ecoScore || 0}</p>
                            </div>
                            <p className="font-semibold text-forest">{formatPrice(item.priceAtPurchase * item.qty)}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No items in order</p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t">
                    {nextStatus && (
                      <button
                        onClick={() => statusMut.mutate({ id: order._id, status: nextStatus })}
                        disabled={statusMut.isPending}
                        className="flex-1 text-sm bg-forest text-cream px-4 py-2.5 rounded-lg font-semibold hover:bg-forest-light transition-colors disabled:opacity-50 capitalize"
                      >
                        {statusMut.isPending ? 'Updating...' : `Mark ${nextStatus}`}
                      </button>
                    )}
                    {order.status !== 'cancelled' && order.status !== 'delivered' && (
                      <button
                        onClick={() => {
                          if (confirm('Cancel this order? This action cannot be undone.')) {
                            statusMut.mutate({ id: order._id, status: 'cancelled' });
                          }
                        }}
                        disabled={statusMut.isPending}
                        className="flex-1 text-sm bg-red-50 text-red-600 px-4 py-2.5 rounded-lg font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
