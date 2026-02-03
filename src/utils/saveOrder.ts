import { supabase } from '@/integrations/supabase/client';
import { CartItem, DeliveryArea, AppliedOffer } from '@/types';

export interface SaveOrderInput {
  items: CartItem[];
  deliveryArea: DeliveryArea | undefined;
  notes: string;
  subtotal: number;
  deliveryFee: number;
  totalDiscount: number;
  total: number;
  appliedOffers: AppliedOffer[];
}

/**
 * Saves the order + its line-items into Supabase.
 * Returns the generated order id on success, or throws.
 *
 * customer_name / customer_phone are not collected in this app yet,
 * so we pass placeholder values that the admin can fill in later
 * after the WhatsApp conversation.  customer_city comes from the
 * selected delivery area.
 */
export async function saveOrderToSupabase(input: SaveOrderInput): Promise<string> {
  const { items, deliveryArea, notes, subtotal, deliveryFee, total } = input;

  // ─── 1. Insert the order row ─────────────────────────────────────────────
  const { data: orderRow, error: orderErr } = await supabase
    .from('orders')
    .insert({
      customer_name: 'العميل (واتساب)',        // placeholder – يُحدَّث بعد الرد
      customer_phone: '',                       // placeholder
      customer_address: deliveryArea
        ? `${deliveryArea.city} - ${deliveryArea.area}`
        : '',
      customer_city: deliveryArea?.city ?? '',
      status: 'pending',
      subtotal,
      delivery_fee: deliveryFee,
      total,
      notes: notes || null,
    })
    .select('id')                               // نرجع الـ id المولّد
    .single();

  if (orderErr || !orderRow) {
    throw new Error(orderErr?.message ?? 'فشل حفظ الطلب');
  }

  const orderId: string = orderRow.id;

  // ─── 2. Insert order_items ───────────────────────────────────────────────
  const itemRows = items.map((item) => {
    const unitPrice = item.selectedSize?.price ?? item.product.basePrice;
    return {
      order_id: orderId,
      product_id: item.product.id,
      product_name: item.product.nameAr,
      size_label: item.selectedSize?.label ?? null,
      quantity: item.quantity,
      unit_price: unitPrice,
      total_price: unitPrice * item.quantity,
    };
  });

  const { error: itemsErr } = await supabase
    .from('order_items')
    .insert(itemRows);

  if (itemsErr) {
    // الطلب اتحفظ بس الـ items لم تتحفظ – نحذف الطلب عشان يبقى consistent
    await supabase.from('orders').delete().eq('id', orderId);
    throw new Error(itemsErr.message ?? 'فشل حفظ المنتجات');
  }

  return orderId;
}