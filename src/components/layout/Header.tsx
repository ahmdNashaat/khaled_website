import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Menu,
  X,
  Search,
  Settings,
  LogIn,
  Package,
  LogOut,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuth } from '@/hooks/useAuth';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const itemCount = useCartStore((state) => state.getItemCount());
  const { user, isAdmin, signOut } = useAuth();

  const navLinks = [
    { to: '/', label: 'الرئيسية' },
    { to: '/products', label: 'المنتجات' },
    { to: '/about', label: 'من نحن' },
    { to: '/contact', label: 'تواصل معنا' },
  ];

  const isActive = (path: string) => location.pathname === path;

  /* ================= TICKER ================= */
  const tickerItems = [
    { icon: '📞', text: '+20 127 616 6532', type: 'phone' as const },
    { icon: '🌙', text: 'رمضان كريم', type: 'text' as const },
    { icon: '🚚', text: 'توصيل مجاني للطلبات فوق ٥٠٠ جنيه', type: 'text' as const },
    { icon: '⏰', text: 'خدمة العملاء: 24/7', type: 'text' as const },
    { icon: '✨', text: 'منتجات طبيعية 100%', type: 'text' as const },
  ];

  const [currentTicker, setCurrentTicker] = useState(tickerItems[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTicker(
        tickerItems[Math.floor(Math.random() * tickerItems.length)]
      );
    }, 2500);

    return () => clearInterval(interval);
  }, []);
  /* ========================================== */

  return (
    <header className="sticky top-0 z-50 glass border-b border-border backdrop-blur-lg">
      {/* ===== Random Fade + Rotate Top Bar ===== */}
      <div className="bg-gradient-to-r from-primary via-primary-dark to-primary text-primary-foreground py-2.5">
        <div className="relative flex items-center justify-center h-8 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTicker.text}
              initial={{ opacity: 0, rotate: -3, scale: 0.95 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 3, scale: 0.95 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="absolute flex items-center gap-3 text-sm font-semibold"
            >
              <span className="text-lg">{currentTicker.icon}</span>

              {currentTicker.type === 'phone' ? (
                <a
                  href={`tel:${currentTicker.text}`}
                  dir="ltr"
                  className="font-bold hover:text-secondary transition-colors"
                >
                  {currentTicker.text}
                </a>
              ) : (
                <span>{currentTicker.text}</span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      {/* ======================================= */}

      {/* ===== Main Header ===== */}
      <div className="section-container py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl">م</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-primary">مَـذاق</h1>
              <p className="text-xs text-muted-foreground">
                أجود المنتجات الطبيعية
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`font-semibold transition-colors ${
                  isActive(link.to)
                    ? 'text-primary'
                    : 'hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button className="hidden sm:flex w-10 h-10 rounded-xl hover:bg-muted items-center justify-center">
              <Search className="w-5 h-5" />
            </button>

            {isAdmin && (
              <Link
                to="/admin"
                className="hidden sm:flex w-10 h-10 rounded-xl hover:bg-muted items-center justify-center"
              >
                <Settings className="w-5 h-5" />
              </Link>
            )}

            {/* طلباتي — يظهر فقط لما الـ user logged in */}
            {user ? (
              <Link
                to="/my-orders"
                className="hidden sm:flex w-10 h-10 rounded-xl hover:bg-muted items-center justify-center relative"
                title="طلباتي"
              >
                <Package className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                to="/auth"
                className="hidden sm:flex w-10 h-10 rounded-xl hover:bg-muted items-center justify-center"
              >
                <LogIn className="w-5 h-5" />
              </Link>
            )}

            <Link
              to="/cart"
              className="relative w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -left-2 w-6 h-6 bg-secondary text-xs rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center"
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* ===== Mobile Menu ===== */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mt-4 border-t pt-4 space-y-1"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                    isActive(link.to)
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* ─── حسابي بلوك ─── */}
              {user ? (
                <>
                  <Link
                    to="/my-orders"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold hover:bg-muted transition-colors"
                  >
                    <Package className="w-4 h-4" />
                    طلباتي
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold hover:bg-muted transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      لوحة التحكم
                    </Link>
                  )}
                  <button
                    onClick={async () => { await signOut(); setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    تسجيل الخروج
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold hover:bg-muted transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  تسجيل الدخول
                </Link>
              )}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;