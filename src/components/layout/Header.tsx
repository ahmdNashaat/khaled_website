import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Menu, X, Phone, Search, Settings, LogIn } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuth } from '@/hooks/useAuth';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const itemCount = useCartStore((state) => state.getItemCount());
  const { user, isAdmin } = useAuth();

  const navLinks = [
    { to: '/', label: 'الرئيسية' },
    { to: '/products', label: 'المنتجات' },
    { to: '/about', label: 'من نحن' },
    { to: '/contact', label: 'تواصل معنا' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass border-b border-border">
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground py-2">
        <div className="section-container flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span dir="ltr">+20 127 616 6532</span>
          </div>
          <p className="hidden sm:block">رمضان كريم 🌙 توصيل مجاني للطلبات فوق ٥٠٠ جنيه</p>
        </div>
      </div>

      {/* Main Header */}
      <div className="section-container py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center shadow-warm">
              <span className="text-2xl font-bold text-white">م</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">مذاق</h1>
              <p className="text-xs text-muted-foreground">أجود المنتجات الطبيعية</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative font-medium transition-colors duration-200 animated-underline ${
                  isActive(link.to) 
                    ? 'text-primary' 
                    : 'text-foreground hover:text-primary'
                }`}
              >
                {link.label}
                {isActive(link.to) && (
                  <motion.span
                    layoutId="activeNav"
                    className="absolute -bottom-1 right-0 w-full h-0.5 bg-secondary rounded-full"
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <button className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted transition-colors">
              <Search className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Admin Link */}
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted transition-colors"
                title="لوحة التحكم"
              >
                <Settings className="w-5 h-5 text-muted-foreground" />
              </Link>
            )}

            {/* Auth Link */}
            {!user && (
              <Link
                to="/auth"
                className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted transition-colors"
                title="تسجيل الدخول"
              >
                <LogIn className="w-5 h-5 text-muted-foreground" />
              </Link>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              className="relative flex items-center justify-center w-10 h-10 bg-primary rounded-xl text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -left-2 w-5 h-5 bg-secondary text-secondary-foreground text-xs font-bold rounded-full flex items-center justify-center"
                >
                  {itemCount}
                </motion.span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border bg-white"
          >
            <nav className="section-container py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={`py-3 px-4 rounded-xl font-medium transition-colors ${
                    isActive(link.to)
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="py-3 px-4 rounded-xl font-medium transition-colors hover:bg-muted flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  لوحة التحكم
                </Link>
              )}
              {!user && (
                <Link
                  to="/auth"
                  onClick={() => setIsMenuOpen(false)}
                  className="py-3 px-4 rounded-xl font-medium transition-colors hover:bg-muted flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  تسجيل الدخول
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
