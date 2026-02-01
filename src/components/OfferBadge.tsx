import { Badge } from '@/components/ui/badge';
import { Offer } from '@/types';
import { Gift, Percent, Tag, TruckIcon } from 'lucide-react';

interface OfferBadgeProps {
  offer: Offer;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const OfferBadge = ({ offer, className = '', size = 'md' }: OfferBadgeProps) => {
  const getOfferDisplay = () => {
    switch (offer.type) {
      case 'percentage':
      case 'category_discount':
        return {
          icon: <Percent className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
          text: `خصم ${offer.discount_percentage}%`,
          color: 'bg-green-500',
        };
      
      case 'fixed':
        return {
          icon: <Tag className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
          text: `خصم ${offer.discount_amount} جنيه`,
          color: 'bg-blue-500',
        };
      
      case 'buy_x_get_y':
        return {
          icon: <Gift className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
          text: `اشتري ${offer.min_quantity} واحصل على ${offer.free_quantity} مجاناً`,
          color: 'bg-purple-500',
        };
      
      case 'bogo':
        return {
          icon: <Gift className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
          text: 'اشتري 1 واحصل على الثاني مجاناً',
          color: 'bg-purple-500',
        };
      
      case 'free_shipping':
        return {
          icon: <TruckIcon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
          text: `توصيل مجاني فوق ${offer.min_amount} جنيه`,
          color: 'bg-orange-500',
        };
      
      default:
        return {
          icon: <Tag className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
          text: offer.title_ar,
          color: 'bg-primary',
        };
    }
  };

  const display = getOfferDisplay();
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full text-white font-bold shadow-md
        ${display.color}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {display.icon}
      <span>{display.text}</span>
    </div>
  );
};

export default OfferBadge;