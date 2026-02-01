import { Link } from 'react-router-dom';
import { Facebook, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { storeSettings } from '@/data/mockData';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main Footer */}
      <div className="section-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold">م</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">مذاق</h2>
                <p className="text-xs text-white/70">أجود المنتجات الطبيعية</p>
              </div>
            </Link>
            <p className="text-white/80 text-sm leading-relaxed">
              متجر مذاق هو وجهتك الأولى لأجود المنتجات الطبيعية والتمور والعسل والمكسرات. نقدم لك منتجات طازجة بجودة عالية وأسعار منافسة.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">روابط سريعة</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-white/80 hover:text-secondary transition-colors">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-white/80 hover:text-secondary transition-colors">
                  جميع المنتجات
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-white/80 hover:text-secondary transition-colors">
                  من نحن
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-white/80 hover:text-secondary transition-colors">
                  تواصل معنا
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-lg font-bold mb-4">سياسات المتجر</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/delivery" className="text-white/80 hover:text-secondary transition-colors">
                  معلومات التوصيل
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-white/80 hover:text-secondary transition-colors">
                  سياسة الاسترجاع
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-white/80 hover:text-secondary transition-colors">
                  سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-white/80 hover:text-secondary transition-colors">
                  الشروط والأحكام
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">تواصل معنا</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-secondary" />
                <a 
                  href={`tel:${storeSettings.primaryPhone}`} 
                  className="text-white/80 hover:text-secondary transition-colors"
                  dir="ltr"
                >
                  {storeSettings.primaryPhone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-secondary" />
                <a 
                  href={`https://wa.me/${storeSettings.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-secondary transition-colors"
                >
                  واتساب
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Facebook className="w-5 h-5 text-secondary" />
                <a 
                  href={storeSettings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-secondary transition-colors"
                >
                  فيسبوك
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-secondary mt-0.5" />
                <span className="text-white/80">المنصورة، الدقهلية، مصر</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="section-container py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/60">
            © {currentYear} متجر مذاق. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-4">
            <a
              href={storeSettings.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-colors"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href={`https://wa.me/${storeSettings.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-success hover:text-white transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
