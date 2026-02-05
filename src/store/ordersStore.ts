import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order, OrderContactMethod, CartItem, DeliveryArea, AppliedOffer } from '@/types';
import { generateOrderNumber } from '@/utils/orderNumber';

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
  orderNumber?: string;
  supabaseOrderId?: string;   // الـ id من Supabase عشان نربطهم
  userId?: string | null;      // ⬅️ معرف المستخدم
}

// ─── Store ───────────────────────────────────────────────────────────────────
interface OrdersState {
  orders: Order[];
  createOrder: (input: CreateOrderInput) => Order;
  getOrderById: (id: string) => Order | undefined;
  getUserOrders: (userId: string | null) => Order[];
  upsertOrders: (incoming: Order[]) => void;
  updateOrderStatus: (supabaseOrderId: string, newStatus: string) => void;
  updateOrderNumber: (supabaseOrderId: string, orderNumber: string) => void;
  removeOrder: (supabaseOrderId: string) => void;
  removeOrderById: (id: string) => void;
  clearOrders: () => void; // ⬅️ جديد: مسح كل الطلبات (مفيد عند logout)
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],

      createOrder: (input) => {
        const order: Order = {
          id: generateId(),
          orderNumber: input.orderNumber ?? generateOrderNumber(),
          supabaseOrderId: input.supabaseOrderId ?? null,
          userId: input.userId ?? null,
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

      // ⬅️ جديد: جلب طلبات مستخدم معين فقط
      getUserOrders: (userId) => {
        // نفلتر الطلبات اللي عندها supabaseOrderId
        // (يعني محفوظة في الداتابيز مع user_id)
        const normalizedUserId = userId ?? null;
        return get().orders.filter((o) => {
          const orderUserId = o.userId ?? null;
          if (normalizedUserId === null) {
            return orderUserId === null && o.supabaseOrderId === null;
          }
          return orderUserId === normalizedUserId;
        });
      },

      // merge Supabase orders into local store
      upsertOrders: (incoming) => {
        if (!incoming || incoming.length === 0) return;

        set((state) => {
          const next = [...state.orders];

          incoming.forEach((order) => {
            if (!order.supabaseOrderId) return;
            const existingIndex = next.findIndex(
              (o) => o.supabaseOrderId === order.supabaseOrderId
            );

            if (existingIndex >= 0) {
              const existing = next[existingIndex];
              next[existingIndex] = {
                ...existing,
                ...order,
                id: existing.id,
              };
            } else {
              next.unshift(order);
            }
          });

          next.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          return { orders: next };
        });
      },

      // ─── الأدمن غيّر الحالة أو العميل الغى → نحدّل محلياً فوراً
      updateOrderStatus: (supabaseOrderId, newStatus) => {
        // Map Supabase DB statuses → app statuses
        const statusMap: Record<string, string> = {
          pending: 'pending',
          confirmed: 'confirmed',
          processing: 'preparing',
          shipped: 'out_for_delivery',
          delivered: 'delivered',
          cancelled: 'cancelled',
        };
        const mapped = statusMap[newStatus] || newStatus;

        set((state) => ({
          orders: state.orders.map((o) =>
            o.supabaseOrderId === supabaseOrderId
              ? { ...o, status: mapped as any }
              : o
          ),
        }));
      },

      updateOrderNumber: (supabaseOrderId, orderNumber) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.supabaseOrderId === supabaseOrderId ? { ...o, orderNumber } : o
          ),
        }));
      },

      // ─── الأدمن حذف الطلب من الداتا بيز → نحذفه محلياً
      removeOrder: (supabaseOrderId) => {
        set((state) => ({
          orders: state.orders.filter((o) => o.supabaseOrderId !== supabaseOrderId),
        }));
      },

      removeOrderById: (id) => {
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== id),
        }));
      },

      // ⬅️ جديد: مسح كل الطلبات (عند logout مثلاً)
      clearOrders: () => {
        set({ orders: [] });
      },
    }),
    { name: 'mazaq-orders' }
  )
);
