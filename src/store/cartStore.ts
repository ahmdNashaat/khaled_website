import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, ProductSize } from '@/types';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity: number, selectedSize?: ProductSize) => void;
  removeItem: (productId: string, sizeId?: string) => void;
  updateQuantity: (productId: string, quantity: number, sizeId?: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, quantity, selectedSize) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => 
              item.product.id === product.id && 
              item.selectedSize?.id === selectedSize?.id
          );
          
          if (existingIndex > -1) {
            const newItems = [...state.items];
            newItems[existingIndex].quantity += quantity;
            return { items: newItems };
          }
          
          return {
            items: [...state.items, { product, quantity, selectedSize }],
          };
        });
      },
      
      removeItem: (productId, sizeId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => 
              !(item.product.id === productId && item.selectedSize?.id === sizeId)
          ),
        }));
      },
      
      updateQuantity: (productId, quantity, sizeId) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId && item.selectedSize?.id === sizeId
              ? { ...item, quantity: Math.max(1, quantity) }
              : item
          ),
        }));
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          const price = item.selectedSize?.price || item.product.basePrice;
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