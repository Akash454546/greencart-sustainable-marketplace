import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardSeller } from '../api/index.js';
import BackButton from '../components/BackButton.jsx';

export default function SellerOnboard() {
  const [form, setForm] = useState({ businessName: '', description: '', avatarUrl: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
        setForm({ ...form, avatarUrl: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.businessName.trim()) {
      setError('Business name is required');
      return;
    }

    setLoading(true);
    try {
      await onboardSeller(form);
      navigate('/seller/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Onboarding failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest/5 to-green-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <BackButton />
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-heading text-4xl font-bold text-forest mb-2">
              🌱 Start Selling Green
            </h1>
            <p className="text-gray-600 text-lg">Complete your seller profile and reach eco-conscious customers</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 text-red-700 text-sm flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Logo/Avatar */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Business Logo (Optional)</label>
              <div className="flex gap-6 items-end">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">🏢</span>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-2 border rounded-lg text-sm text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-forest file:text-cream file:cursor-pointer hover:file:bg-forest-light"
                  />
                  <p className="text-xs text-gray-500 mt-2">PNG or JPG (max 5MB)</p>
                </div>
              </div>
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Name *</label>
              <input
                type="text"
                required
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="e.g., EcoTech Solutions, Green Crafts Co."
                className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
              />
              <p className="text-xs text-gray-500 mt-1">This will appear on your products</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Tell us about your sustainable business, mission, and what makes your products eco-friendly..."
                rows={4}
                className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">Help customers understand your commitment to sustainability</p>
            </div>

            {/* Info Box */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-forest mb-2">✓ What happens next?</h3>
              <ul className="space-y-2 text-xs text-gray-700">
                <li>✓ Your profile becomes visible to all buyers</li>
                <li>✓ Start uploading your sustainable products</li>
                <li>✓ Build your eco reputation with certifications</li>
                <li>✓ Track orders and manage your inventory</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest text-cream py-3 rounded-lg font-semibold text-lg hover:bg-forest-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-forest/50"
            >
              {loading ? 'Setting up your store...' : '🚀 Complete Setup'}
            </button>
          </form>

          {/* Footer Note */}
          <p className="text-center text-xs text-gray-500 mt-6">
            By onboarding, you agree to our seller terms and sustainability guidelines
          </p>
        </div>
      </div>
    </div>
  );
}
