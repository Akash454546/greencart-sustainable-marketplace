import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import Home from './pages/Home.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import SellerDashboard from './pages/SellerDashboard.jsx';
import MyOrders from './pages/MyOrders.jsx';
import SellerOnboard from './pages/SellerOnboard.jsx';
import Checkout from './pages/Checkout.jsx';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <CartDrawer />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Home />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/seller/onboard" element={<SellerOnboard />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </main>
      <footer className="bg-forest text-cream py-8 text-center text-sm">
        © 2026 GreenCart — Sustainable Shopping for a Better Planet
      </footer>
    </div>
  );
}
