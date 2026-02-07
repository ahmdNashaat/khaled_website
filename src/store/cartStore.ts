import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, ProductVariant } from '@/types';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity: number, selectedVariant?: ProductVariant) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, quantity, selectedVariant) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => 
              item.product.id === product.id && 
              item.selectedVariant?.id === selectedVariant?.id
          );
          
          if (existingIndex > -1) {
            const newItems = [...state.items];
            newItems[existingIndex].quantity += quantity;
            return { items: newItems };
          }
          
          return {
            items: [...state.items, { product, quantity, selectedVariant }],
          };
        });
      },
      
      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => 
              !(item.product.id === productId && item.selectedVariant?.id === variantId)
          ),
        }));
      },
      
      updateQuantity: (productId, quantity, variantId) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId && item.selectedVariant?.id === variantId
              ? { ...item, quantity: Math.max(1, quantity) }
              : item
          ),
        }));
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          const price = item.selectedVariant?.price || item.product.basePrice;
          return total + price * item.quantity;
        }, 0);
      },
      
      // إصلاح: حساب عدد المنتجات المختلفة، مش مجموع الكميات
      getItemCount: () => {
        const { items } = get();
        return items.length; // عدد المنتجات المختلفة
      },
    }),
    {
      name: 'mazaq-cart',
    }
  )
);
