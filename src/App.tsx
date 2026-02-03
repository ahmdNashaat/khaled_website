import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/sonner';

// Public Pages
import HomePage from '@/pages/HomePage';
import ProductsPage from '@/pages/ProductsPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import CartPage from '@/pages/CartPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import AuthPage from '@/pages/AuthPage';
import NotFound from '@/pages/NotFound';

// User Pages
import MyOrdersPage from '@/pages/MyOrdersPage';
import OrderConfirmationPage from '@/pages/OrderConfirmationPage';
import ProfilePage from '@/pages/ProfilePage'; // ⭐ جديد

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminOffers from '@/pages/admin/AdminOffers';
import AdminDeliveryAreas from '@/pages/admin/AdminDeliveryAreas';
import AdminHeroBanners from '@/pages/admin/AdminHeroBanners'; // ⭐ جديد

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/auth" element={<AuthPage />} />

          {/* User Routes */}
          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/orders/:id" element={<OrderConfirmationPage />} />
          <Route path="/profile" element={<ProfilePage />} /> {/* ⭐ جديد */}

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/offers" element={<AdminOffers />} />
          <Route path="/admin/delivery-areas" element={<AdminDeliveryAreas />} />
          <Route path="/admin/hero-banners" element={<AdminHeroBanners />} /> {/* ⭐ جديد */}

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

// ═══════════════════════════════════════════════════════════════
// ملاحظات
// ═══════════════════════════════════════════════════════════════

// ✅ تأكد من:
// 1. استيراد الصفحات الجديدة
// 2. إضافة الـ Routes في المكان الصحيح
// 3. الـ Toaster موجود في نهاية App component