import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1, product.sizes[0]);
    toast.success('تمت الإضافة إلى السلة', {
      description: product.nameAr,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link to={`/products/${product.id}`} className="block product-card group">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.mainImage}
            alt={product.nameAr}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
          
          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {product.discountPercentage && (
              <span className="badge-discount">
                -{product.discountPercentage}%
              </span>
            )}
            {product.isFeatured && (
              <span className="badge-featured">مميز</span>
            )}
          </div>

          {/* Quick Actions Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleAddToCart}
              className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg"
            >
              <ShoppingCart className="w-5 h-5" />
            </motion.button>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-12 h-12 bg-white text-foreground rounded-full flex items-center justify-center shadow-lg"
            >
              <Eye className="w-5 h-5" />
            </motion.div>
          </div>

          {/* Out of Stock Overlay */}
          {!product.isAvailable && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg font-bold">
                غير متوفر
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <span className="text-xs text-primary-light font-medium">
            {product.categoryName}
          </span>
          <h3 className="text-lg font-bold text-foreground mt-1 mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {product.nameAr}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {product.shortDescription}
          </p>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">
                {product.basePrice}
              </span>
              <span className="text-sm text-muted-foreground">جنيه/{product.unit}</span>
              {product.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {product.originalPrice}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
