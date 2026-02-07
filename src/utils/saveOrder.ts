import { supabase } from '@/integrations/supabase/client';
import { CartItem, DeliveryArea, AppliedOffer } from '@/types';
import { generateOrderNumber, formatOrderNumber } from '@/utils/orderNumber';

export interface SaveOrderInput {
  items: CartItem[];
  deliveryArea: DeliveryArea | undefined;
  notes: string;
  subtotal: number;
  deliveryFee: number;
  totalDiscount: number;
  total: number;
  appliedOffers: AppliedOffer[];
  customerName?: string;  // اسم العميل
  customerPhone?: string; // رقم الهاتف
  customerAddress?: string;
  customerCity?: string;
  userId?: string | null; // ⬅️ معرف المستخدم (null للـ guests)
}

/**
 * Saves the order + its line-items into Supabase.
 * Returns the generated order id and order number on success, or throws.
 */
export async function saveOrderToSupabase(input: SaveOrderInput): Promise<{ orderId: string; orderNumber: string }> {
  const { 
    items, 
    deliveryArea, 
    notes, 
    subtotal, 
    deliveryFee, 
    total,
    customerName,
    customerPhone,
    customerAddress,
    customerCity,
    userId // ⬅️ نستقبل الـ userId
  } = input;

  const orderNumber = generateOrderNumber();

  let resolvedName = customerName?.trim() || '';
  let resolvedPhone = customerPhone?.trim() || '';

  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('user_id', userId)
      .maybeSingle();

    resolvedName = resolvedName || profile?.full_name || '';
    resolvedPhone = resolvedPhone || profile?.phone || '';

    if ((resolvedName && resolvedName !== profile?.full_name) || (resolvedPhone && resolvedPhone !== profile?.phone)) {
      await supabase
        .from('profiles')
        .update({
          full_name: resolvedName || profile?.full_name || null,
          phone: resolvedPhone || profile?.phone || null,
        })
        .eq('user_id', userId);
    }
  }


  // ─── 1. Insert the order row ─────────────────────────────────────────────
  const { data: orderRow, error: orderErr } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      user_id: userId || null, // ⬅️ نحفظ الـ user_id (null للـ guests)
      customer_name: resolvedName || 'عميل جديد',
      customer_phone: resolvedPhone || '',
      customer_address: customerAddress || (deliveryArea ? `${deliveryArea.city} - ${deliveryArea.area}` : ''),
      customer_city: customerCity || (deliveryArea?.city ?? ''),
      status: 'pending',
      subtotal,
      delivery_fee: deliveryFee,
      total,
      notes: notes || null,
    })
    .select('id, order_number')
    .single();

  if (orderErr || !orderRow) {
    throw new Error(orderErr?.message ?? 'فشل حفظ الطلب');
  }

  const orderId: string = orderRow.id;
  const savedOrderNumber: string = orderRow.order_number ?? orderNumber;

  // ─── 2. Insert order_items ───────────────────────────────────────────────
  const itemRows = items.map((item) => {
    const unitPrice = item.selectedVariant?.price ?? item.product.basePrice;
    return {
      order_id: orderId,
      product_id: item.product.id,
      product_name: item.product.nameAr,
      size_label: item.selectedVariant?.label ?? null,
      variant_id: item.selectedVariant?.id ?? null,
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

  return { orderId, orderNumber: savedOrderNumber };
}

/**
 * بناء رسالة الواتساب المحسّنة
 */
export function buildWhatsAppMessage(input: {
  orderNumber: string;
  customerName: string;
  items: CartItem[];
  deliveryArea: DeliveryArea | undefined;
  notes: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  appliedOffers: AppliedOffer[];
}): string {
  const {
    orderNumber,
    customerName,
    items,
    deliveryArea,
    notes,
    subtotal,
    deliveryFee,
    total,
    appliedOffers,
  } = input;


  let message = `◆ طلب جديد من متجر مذاق\n\n`;
  message += `◆ رقم الطلب: ${formatOrderNumber(orderNumber)}\n`;
  message += `◆ اسم العميل: ${customerName}\n\n`;
  
  message += `◆ المنتجات:\n`;
  items.forEach((item, index) => {
    const size = item.selectedVariant?.label || '';
    const sizeText = size ? ` - ${size}` : '';
    message += `${index + 1}. ${item.product.nameAr}${sizeText} × ${item.quantity} = ${(
      (item.selectedVariant?.price || item.product.basePrice) * item.quantity
    ).toFixed(2)} جنيه\n`;
  });

  message += `\n`;

  if (appliedOffers.length > 0) {
    message += `◆ العروض المطبقة:\n`;
    appliedOffers.forEach((offer) => {
      message += `• ${offer.offer.title_ar}: خصم ${offer.discount.toFixed(2)} جنيه\n`;
    });
    message += `\n`;
  }

  if (deliveryArea) {
    message += `◆ منطقة التوصيل: ${deliveryArea.city} - ${deliveryArea.area}\n`;
    message += `◆ رسوم التوصيل: ${deliveryFee.toFixed(2)} جنيه\n\n`;
  }

  message += `◆ المجموع الفرعي: ${subtotal.toFixed(2)} جنيه\n`;
  message += `◆ رسوم التوصيل: ${deliveryFee.toFixed(2)} جنيه\n`;
  message += `◆ الإجمالي النهائي: ${total.toFixed(2)} جنيه\n\n`;

  if (appliedOffers.length > 0) {
    const totalSavings = appliedOffers.reduce((sum, o) => sum + o.discount, 0);
    message += `✅ وفرت: ${totalSavings.toFixed(2)} جنيه\n\n`;
  }

  message += `◆ طريقة الدفع: الدفع عند الاستلام\n\n`;

  if (notes) {
    message += `◆ ملاحظات:\n${notes}\n\n`;
  }

  message += `تاريخ الطلب: ${new Date().toLocaleString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  return message;
}
