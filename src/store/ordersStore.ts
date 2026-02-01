import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order, OrderContactMethod, CartItem, DeliveryArea, AppliedOffer } from '@/types';

// ─── Helper: generates a short unique id ────────────────────────────────────
const generateId = (): string => {
  return 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
};

// ─── Input shape for creating a new order ───────────────────────────────────
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
}

// ─── Store interface ─────────────────────────────────────────────────────────
interface OrdersState {
  orders: Order[];
  /** Creates a new order, persists it, and returns the full Order object */
  createOrder: (input: CreateOrderInput) => Order;
  /** Returns a single order by id, or undefined */
  getOrderById: (id: string) => Order | undefined;
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],

      createOrder: (input) => {
        const order: Order = {
          id: generateId(),
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
          orders: [order, ...state.orders], // الأحدث أولاً
        }));

        return order;
      },

      getOrderById: (id) => {
        return get().orders.find((o) => o.id === id);
      },
    }),
    {
      name: 'mazaq-orders', // مختلف عن mazaq-cart
    }
  )
);