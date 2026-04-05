import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';
import useCartStore from '../store/cartStore.js';
import LiveSearch from './LiveSearch.jsx';

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const toggleCart = useCartStore((s) => s.toggleCart);
  const itemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.qty, 0));

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-2xl">🌿</span>
          <span className="font-heading text-xl font-bold text-forest">GreenCart</span>
        </Link>

        {/* Search */}
        <div className="hidden md:block flex-1 max-w-lg mx-4">
          <LiveSearch />
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {user.role === 'seller' && (
                <Link to="/seller/dashboard" className="text-sm text-forest hover:underline hidden sm:inline">
                  Dashboard
                </Link>
              )}
              <Link to="/my-orders" className="text-sm text-forest hover:underline hidden sm:inline">
                Orders
              </Link>
              <span className="text-sm text-gray-500 hidden sm:inline">Hi, {user.name}</span>
              <button onClick={logout} className="text-sm text-red-500 hover:underline">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-forest hover:underline">
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm bg-forest text-cream px-4 py-2 rounded-lg font-medium hover:bg-forest-light transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}

          {/* Cart */}
          <button onClick={toggleCart} className="relative p-2">
            <svg className="h-6 w-6 text-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-4 pb-3">
        <LiveSearch />
      </div>
    </header>
  );
}
