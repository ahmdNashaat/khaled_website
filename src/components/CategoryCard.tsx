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
      initial={{ opacity: 0, scale: 0.9, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
      }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <Link
        to={`/products?category=${category.id}`}
        className="block relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-accent via-white to-accent-light border border-border/50 hover:border-primary/40 shadow-sm hover:shadow-lg transition-all duration-300"
      >
        <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity pattern-overlay" />

        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-secondary/0 group-hover:from-primary/10 group-hover:to-secondary/10 transition-all duration-300" />

        {/* CONTENT - COMPACT */}
        <div className="relative p-3 sm:p-4 text-center space-y-2">
          {/* ICON - SMALLER */}
          <motion.div
            whileHover={{ scale: 1.08, rotate: 3 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-white rounded-xl shadow-md flex items-center justify-center overflow-hidden group-hover:shadow-lg transition-all border border-border/30"
          >
            {category.image ? (
              <img
                src={category.image}
                alt={category.nameAr}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">
                {category.icon || '📦'}
              </span>
            )}
          </motion.div>

          {/* CATEGORY NAME - COMPACT */}
          <div className="space-y-1">
            <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">
              {category.nameAr}
            </h3>

            <div className="flex items-center justify-center gap-1">
              <span className="text-xs sm:text-sm text-muted-foreground">
                {category.productsCount || 0}
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground">
                منتج
              </span>
            </div>
          </div>

          {/* DESCRIPTION - HIDDEN ON MOBILE */}
          {category.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block">
              {category.description}
            </p>
          )}

          {/* ARROW - SMALLER */}
          <motion.div
            initial={{ x: -8, opacity: 0 }}
            className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hidden sm:flex"
            whileHover={{ x: -4 }}
          >
            <ChevronLeft className="w-4 h-4 text-primary" />
          </motion.div>
        </div>

        <div className="absolute inset-0 -right-full group-hover:right-0 bg-gradient-to-l from-white/20 to-transparent transition-all duration-700 pointer-events-none" />
      </Link>
    </motion.div>
  );
};

export default CategoryCard;
