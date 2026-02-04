import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  User,
  ChevronDown,
  Bell,
  Heart,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const itemCount = useCartStore((state) => state.getItemCount());
  const favoriteCount = useFavoritesStore((state) => state.getCount());
  const { user, isAdmin, signOut } = useAuth();
  const profileLink = isAdmin ? '/admin/settings' : '/profile';
  const profileLabel = isAdmin ? 'إعدادات الحساب' : 'الملف الشخصي';
  const ProfileIcon = isAdmin ? Settings : User;

  const navLinks = [
    { to: '/', label: 'الرئيسية' },
    { to: '/products', label: 'المنتجات' },
    { to: '/about', label: 'من نحن' },
    { to: '/contact', label: 'تواصل معنا' },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ================= ENHANCED TICKER ================= */
  const tickerItems = [
    { icon: '🌙', text: 'رمضان كريم - كل عام وأنتم بخير', type: 'text' as const },
    { icon: '🚚', text: 'توصيل مجاني للطلبات فوق 500 جنيه', type: 'text' as const },
    { icon: '📞', text: '+20 127 616 6532', type: 'phone' as const },
    { icon: '⏰', text: 'خدمة العملاء: 24/7', type: 'text' as const },
    { icon: '✨', text: 'منتجات طبيعية 100%', type: 'text' as const },
    { icon: '🎁', text: 'عروض حصرية لشهر رمضان', type: 'text' as const },
  ];

  const [currentTicker, setCurrentTicker] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTicker((prev) => (prev + 1) % tickerItems.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  /* ================================================== */

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-border'
          : 'bg-white/80 backdrop-blur-md border-b border-border/50'
      }`}
    >
      {/* ===== ENHANCED TICKER BAR ===== */}
      <div className="bg-gradient-to-r from-primary via-primary-dark to-primary text-primary-foreground py-2.5 overflow-hidden">
        <div className="relative flex items-center justify-center h-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTicker}
              initial={{ opacity: 0, y: -20, rotateX: -90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: 20, rotateX: 90 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="absolute flex items-center gap-2.5 text-sm font-semibold"
            >
              <span className="text-xl">{tickerItems[currentTicker].icon}</span>
              {tickerItems[currentTicker].type === 'phone' ? (
                <a
                  href={`tel:${tickerItems[currentTicker].text}`}
                  dir="ltr"
                  className="font-bold hover:text-secondary transition-colors"
                >
                  {tickerItems[currentTicker].text}
                </a>
              ) : (
                <span>{tickerItems[currentTicker].text}</span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ===== MAIN HEADER ===== */}
      <div className="section-container py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* === LOGO === */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-14 h-14 sm:w-16 sm:h-16"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow" />
              <div className="relative w-full h-full flex items-center justify-center">
                <span className="text-white font-black text-2xl sm:text-3xl">م</span>
              </div>
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-secondary to-primary rounded-2xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity" />
            </motion.div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary leading-none">
                مَـذاق
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                أجود المنتجات الطبيعية
              </p>
            </div>
          </Link>

          {/* === DESKTOP NAV === */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-5 py-2.5 font-semibold transition-all duration-200 rounded-lg ${
                  isActive(link.to)
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground hover:text-primary hover:bg-muted'
                }`}
              >
                {link.label}
                {isActive(link.to) && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* === ACTIONS (IMPROVED SPACING) === */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Search Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="hidden sm:flex w-11 h-11 rounded-xl hover:bg-muted items-center justify-center transition-colors group"
              aria-label="بحث"
            >
              <Search className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </motion.button>

            {!isAdmin && (
              <>
                {/* Favorites Button */}
                <Link to="/favorites">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative w-11 h-11 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-all shadow-sm hover:shadow-md group"
                    title="المفضلة"
                  >
                    <Heart className="w-5 h-5" />
                    {favoriteCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -left-2 w-6 h-6 bg-destructive text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg ring-2 ring-white"
                      >
                        {favoriteCount}
                      </motion.span>
                    )}
                  </motion.div>
                </Link>
              </>
            )}


            {/* Cart Button (ENHANCED) */}
            <Link to="/cart">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm hover:shadow-md group"
                title="سلة التسوق"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg ring-2 ring-white"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </motion.div>
            </Link>

            {/* Notifications (ENHANCED) */}
            {user && (
              <div className="hidden sm:block">
                <NotificationBell />
              </div>
            )}

            {/* User Menu (ENHANCED) */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-xl hover:bg-muted transition-all border-2 border-transparent hover:border-primary/20"
                  >
                    <Avatar className="w-9 h-9 sm:w-10 sm:h-10 ring-2 ring-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-semibold text-foreground leading-none">
                        {user?.user_metadata?.full_name || 'مستخدم'}
                      </span>
                      {isAdmin && (
                        <span className="text-xs text-primary font-medium">مسؤول</span>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {/* User Info Header */}
                  <DropdownMenuLabel className="text-right">
                    <div className="flex items-center gap-3 py-2">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold text-lg">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {user?.user_metadata?.full_name || 'مستخدم'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate" dir="ltr">
                          {user?.email}
                        </p>
                        {isAdmin && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                            مسؤول النظام
                          </span>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  
                  <DropdownMenuSeparator />

                  {/* Profile Link */}
                  <DropdownMenuItem asChild>
                    <Link to={profileLink} className="flex items-center gap-3 cursor-pointer py-2.5">
                      <ProfileIcon className="w-4 h-4 text-muted-foreground" />
                      <span>{profileLabel}</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  {!isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/favorites" className="flex items-center gap-3 cursor-pointer py-2.5">
                        <Heart className="w-4 h-4 text-muted-foreground" />
                        <span>المفضلة</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  
                  {/* FOR REGULAR USERS - طلباتي */}
                  {!isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/my-orders" className="flex items-center gap-3 cursor-pointer py-2.5">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span>طلباتي</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {/* FOR ADMINS ONLY - لوحة التحكم */}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        لوحة التحكم
                      </DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-3 cursor-pointer py-2.5">
                          <Settings className="w-4 h-4 text-muted-foreground" />
                          <span>الإحصائيات</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/orders" className="flex items-center gap-3 cursor-pointer py-2.5">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span>إدارة الطلبات</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive focus:text-destructive cursor-pointer py-2.5"
                  >
                    <LogOut className="w-4 h-4 ml-2" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">دخول</span>
                </motion.button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden w-11 h-11 rounded-xl hover:bg-muted flex items-center justify-center transition-colors"
              aria-label="القائمة"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>

        {/* === SEARCH BAR (EXPANDABLE) === */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mt-4"
            >
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن المنتجات..."
                  className="w-full pr-12 pl-12 py-3.5 bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all text-base"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute left-3 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
                >
                  بحث
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === MOBILE MENU === */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden mt-4 border-t border-border pt-4"
            >
              {/* Search on Mobile */}
              <div className="sm:hidden mb-4">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن المنتجات..."
                    className="w-full pr-11 pl-3 py-3 bg-muted rounded-xl border-2 border-transparent focus:border-primary outline-none transition-all"
                  />
                </form>
              </div>

              {/* Nav Links */}
              <div className="space-y-1 mb-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center px-4 py-3.5 rounded-xl font-semibold transition-all ${
                      isActive(link.to)
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* User Section */}
              {user ? (
                <div className="space-y-1 border-t border-border pt-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3 px-4 py-3 mb-2">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {user?.user_metadata?.full_name || 'مستخدم'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate" dir="ltr">
                        {user.email}
                      </p>
                      {isAdmin && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                          مسؤول
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Profile Link */}
                  <Link
                    to={profileLink}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold hover:bg-muted transition-colors"
                  >
                    <ProfileIcon className="w-5 h-5 text-muted-foreground" />
                    {profileLabel}
                  </Link>
                  
                  {/* For Regular Users */}
                  {!isAdmin && (
                    <Link
                      to="/favorites"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold hover:bg-muted transition-colors"
                    >
                      <Heart className="w-5 h-5 text-muted-foreground" />
                      المفضلة
                    </Link>
                  )}

                  {!isAdmin && (
                    <Link
                      to="/my-orders"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold hover:bg-muted transition-colors"
                    >
                      <Package className="w-5 h-5 text-muted-foreground" />
                      طلباتي
                    </Link>
                  )}

                  {/* For Admins */}
                  {isAdmin && (
                    <>
                      <div className="px-4 py-2 text-xs text-muted-foreground font-semibold">
                        لوحة التحكم
                      </div>
                      <Link
                        to="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold hover:bg-muted transition-colors"
                      >
                        <Settings className="w-5 h-5 text-muted-foreground" />
                        الإحصائيات
                      </Link>
                      <Link
                        to="/admin/orders"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold hover:bg-muted transition-colors"
                      >
                        <Package className="w-5 h-5 text-muted-foreground" />
                        إدارة الطلبات
                      </Link>
                    </>
                  )}

                  <button
                    onClick={async () => {
                      await handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-semibold text-destructive hover:bg-destructive/10 transition-colors mt-2"
                  >
                    <LogOut className="w-5 h-5" />
                    تسجيل الخروج
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold justify-center shadow-md"
                >
                  <LogIn className="w-5 h-5" />
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
