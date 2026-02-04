-- Add soft delete + WhatsApp tracking + order events
ALTER TABLE public.orders
  ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN deleted_reason TEXT,
  ADD COLUMN deleted_by_role TEXT,
  ADD COLUMN checkout_session_id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN whatsapp_last_event TEXT,
  ADD COLUMN whatsapp_last_event_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN whatsapp_started_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN whatsapp_abandoned_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_orders_deleted_at ON public.orders(deleted_at);
CREATE INDEX idx_orders_checkout_session_id ON public.orders(checkout_session_id);
CREATE INDEX idx_orders_whatsapp_last_event_at ON public.orders(whatsapp_last_event_at);

-- Order events for analytics + funnel tracking
CREATE TABLE public.order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'web',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_events_order_id ON public.order_events(order_id);
CREATE INDEX idx_order_events_event_type ON public.order_events(event_type);
CREATE INDEX idx_order_events_created_at ON public.order_events(created_at);

ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

-- Update orders select policy to hide soft-deleted rows from customers
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Allow users to soft delete/cancel their own orders
CREATE POLICY "Users can soft delete own orders" ON public.orders
  FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL AND status IN ('pending', 'confirmed'))
  WITH CHECK (auth.uid() = user_id AND (status = 'cancelled' OR deleted_at IS NOT NULL));

-- Order events policies
CREATE POLICY "Anyone can insert order events" ON public.order_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_events.order_id
        AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

CREATE POLICY "Users can view their order events" ON public.order_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_events.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order events" ON public.order_events
  FOR SELECT
  USING (public.is_admin());
