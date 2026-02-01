import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
  index?: number;
}

const CategoryCard = ({ category, index = 0 }: CategoryCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Link
        to={`/products?category=${category.id}`}
        className="category-card block text-center group"
      >
        <div className="w-16 h-16 mx-auto mb-3 bg-white rounded-2xl shadow-md flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300">
          {/* إصلاح: عرض الصورة من database بدل emoji */}
          {category.image ? (
            <img 
              src={category.image} 
              alt={category.nameAr}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl">{category.icon || '📦'}</span>
          )}
        </div>
        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
          {category.nameAr}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {/* إصلاح: عرض عدد المنتجات الفعلي */}
          {category.productsCount || 0} منتج
        </p>
      </Link>
    </motion.div>
  );
};

export default CategoryCard;