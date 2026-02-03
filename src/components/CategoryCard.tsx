import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Category } from '@/types';
import { ChevronLeft } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
  index?: number;
}

const CategoryCard = ({ category, index = 0 }: CategoryCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ y: -8 }}
      className="group"
    >
      <Link
        to={`/products?category=${category.id}`}
        className="block relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent via-white to-accent-light border-2 border-border/50 hover:border-primary/40 shadow-sm hover:shadow-xl transition-all duration-300"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity pattern-overlay" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-secondary/0 group-hover:from-primary/10 group-hover:to-secondary/10 transition-all duration-300" />

        {/* Content */}
        <div className="relative p-6 text-center space-y-3">
          {/* Icon/Image Container */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-lg flex items-center justify-center overflow-hidden group-hover:shadow-2xl transition-all border-2 border-border/30"
          >
            {category.image ? (
              <img 
                src={category.image} 
                alt={category.nameAr}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl group-hover:scale-110 transition-transform">
                {category.icon || '📦'}
              </span>
            )}
          </motion.div>

          {/* Category Name */}
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
              {category.nameAr}
            </h3>
            
            {/* Products Count */}
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-sm text-muted-foreground">
                {category.productsCount || 0}
              </span>
              <span className="text-sm text-muted-foreground">
                منتج
              </span>
            </div>
          </div>

          {/* Description (Optional) */}
          {category.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {category.description}
            </p>
          )}

          {/* Arrow Icon */}
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            whileHover={{ x: -5 }}
          >
            <ChevronLeft className="w-5 h-5 text-primary" />
          </motion.div>
        </div>

        {/* Shine Effect */}
        <div className="absolute inset-0 -right-full group-hover:right-0 bg-gradient-to-l from-white/20 to-transparent transition-all duration-700 pointer-events-none" />
      </Link>
    </motion.div>
  );
};

export default CategoryCard;