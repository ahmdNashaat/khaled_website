import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Offer } from '@/types';
import { isOfferValid } from '@/utils/offerCalculator';

/**
 * Hook لجلب جميع العروض النشطة
 */
export const useOffers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('offers')
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: false });

        if (fetchError) throw fetchError;

        // تحويل البيانات من database إلى Offer type
        const mappedOffers: Offer[] = (data || []).map((offer: any) => ({
          id: offer.id,
          title_ar: offer.title_ar,
          description: offer.description,
          type: offer.type,
          discount_percentage: offer.discount_percentage,
          discount_amount: offer.discount_amount,
          min_quantity: offer.min_quantity ?? null,
          free_quantity: offer.free_quantity ?? null,
          min_amount: offer.min_amount ?? null,
          applicable_products: offer.applicable_products ?? null,
          applicable_categories: offer.applicable_categories ?? null,
          banner_image: offer.banner_image,
          start_date: offer.start_date,
          end_date: offer.end_date,
          is_active: offer.is_active,
          priority: offer.priority,
          auto_apply: offer.auto_apply ?? true,
          created_at: offer.created_at,
          updated_at: offer.updated_at,
        }));

        // فلترة العروض السارية فقط
        const validOffers = mappedOffers.filter(offer => isOfferValid(offer));
        setOffers(validOffers);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching offers:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffers();

    // Subscription للتحديثات الفورية
    const subscription = supabase
      .channel('offers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers',
        },
        () => {
          fetchOffers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { offers, isLoading, error };
};

/**
 * Hook لجلب العروض المطبقة على منتج معين
 */
export const useProductOffers = (productId: string, categoryId: string) => {
  const { offers, isLoading } = useOffers();

  const productOffers = offers.filter(offer => {
    // تجاهل عروض الشحن المجاني
    if (offer.type === 'free_shipping') return false;

    // إذا لم يحدد منتجات أو أقسام، العرض ينطبق على الكل
    if (!offer.applicable_products && !offer.applicable_categories) {
      return true;
    }

    // فحص المنتجات المحددة
    if (offer.applicable_products && offer.applicable_products.includes(productId)) {
      return true;
    }

    // فحص الأقسام المحددة
    if (offer.applicable_categories && offer.applicable_categories.includes(categoryId)) {
      return true;
    }

    return false;
  });

  // ترتيب حسب الأولوية
  const sortedOffers = productOffers.sort((a, b) => b.priority - a.priority);

  return {
    offers: sortedOffers,
    bestOffer: sortedOffers[0] || null,
    isLoading,
  };
};

/**
 * Hook لجلب عروض الشحن المجاني
 */
export const useFreeShippingOffers = () => {
  const { offers, isLoading } = useOffers();

  const freeShippingOffers = offers.filter(offer => offer.type === 'free_shipping');

  return {
    offers: freeShippingOffers,
    isLoading,
  };
};