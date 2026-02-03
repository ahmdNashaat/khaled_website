import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order, OrderContactMethod, CartItem, DeliveryArea, AppliedOffer } from '@/types';

// ─── Helper ──────────────────────────────────────────────────────────────────
const generateId = (): string =>
  'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();

// ─── Input shape ─────────────────────────────────────────────────────────────
export interface CreateOrderInput {
  items: CartItem[];
  deliveryArea: DeliveryArea | undefined;
  notes: string;
  contactMethod: OrderContactMethod;
  subtotal: number;
  deliveryFee: number;
  totalDiscount: number;
  total: number;
  savings: number;
  appliedOffers: AppliedOffer[];
  supabaseOrderId?: string;   // الـ id من Supabase عشان نربطهم
}

// ─── Store ───────────────────────────────────────────────────────────────────
interface OrdersState {
  orders: Order[];
  createOrder: (input: CreateOrderInput) => Order;
  getOrderById: (id: string) => Order | undefined;
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],

      createOrder: (input) => {
        const order: Order = {
          id: generateId(),
          supabaseOrderId: input.supabaseOrderId ?? null,
          createdAt: new Date().toISOString(),
          status: 'pending',
          contactMethod: input.contactMethod,
          items: input.items.map((item) => ({
            product: item.product,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            lineTotal:
              (item.selectedSize?.price || item.product.basePrice) * item.quantity,
          })),
          deliveryArea: input.deliveryArea
            ? { city: input.deliveryArea.city, area: input.deliveryArea.area }
            : null,
          notes: input.notes,
          subtotal: input.subtotal,
          deliveryFee: input.deliveryFee,
          totalDiscount: input.totalDiscount,
          total: input.total,
          savings: input.savings,
          appliedOffers: input.appliedOffers.map((a) => ({
            offerTitle: a.offer.title_ar,
            discount: a.discount,
            message: a.message,
          })),
        };

        set((state) => ({
          orders: [order, ...state.orders],
        }));

        return order;
      },

      getOrderById: (id) => get().orders.find((o) => o.id === id),
    }),
    { name: 'mazaq-orders' }
  )
);