import { supabase } from '@/integrations/supabase/client';
import { Enums } from '@/integrations/supabase/types';
import { WhatsAppEventType, AppError } from '@/types';

export type OrderDeleteRole = 'customer' | 'admin' | 'system';

export interface TrackWhatsAppEventInput {
  orderId: string;
  userId?: string | null;
  event: WhatsAppEventType;
  source?: 'web' | 'admin' | 'system' | string;
  metadata?: Record<string, any>;
}

export async function trackWhatsAppEvent(input: TrackWhatsAppEventInput) {
  const { orderId, userId, event, source = 'web', metadata = {} } = input;
  const now = new Date().toISOString();

  const { error: eventError } = await supabase.from('order_events').insert({
    order_id: orderId,
    user_id: userId ?? null,
    event_type: event,
    source,
    metadata,
  });

  if (eventError) {
    const err: AppError = { code: 'EVENT_INSERT_FAILED', message: eventError.message };
    throw err;
  }

  const updates: Record<string, any> = {
    whatsapp_last_event: event,
    whatsapp_last_event_at: now,
  };

  if (event === 'whatsapp_button_clicked') {
    updates.whatsapp_started_at = now;
  }
  if (event === 'whatsapp_abandoned') {
    updates.whatsapp_abandoned_at = now;
  }

  const { error: orderError } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId);

  if (orderError) {
    const err: AppError = { code: 'ORDER_UPDATE_FAILED', message: orderError.message };
    throw err;
  }
}

export interface SoftDeleteOrderInput {
  orderId: string;
  userId: string | null;
  role: OrderDeleteRole;
  reason?: string | null;
}

export async function softDeleteOrder(input: SoftDeleteOrderInput) {
  const { orderId, userId, role, reason } = input;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('orders')
    .update({
      deleted_at: now,
      deleted_by: userId,
      deleted_by_role: role,
      deleted_reason: reason ?? null,
      status: 'cancelled',
    })
    .eq('id', orderId)
    .select('id')
    .maybeSingle();

  if (error) {
    const err: AppError = { code: 'SOFT_DELETE_FAILED', message: error.message };
    throw err;
  }

  if (!data) {
    const err: AppError = { code: 'ORDER_NOT_FOUND', message: 'Order not found or not permitted.' };
    throw err;
  }

  return data;
}

type OrderStatus = Enums<'order_status'>;

export async function adminUpdateOrderStatus(orderId: string, status: OrderStatus) {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) {
    const err: AppError = { code: 'STATUS_UPDATE_FAILED', message: error.message };
    throw err;
  }
}



