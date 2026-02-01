-- Fix permissive RLS policies for orders INSERT
DROP POLICY "Users can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (
    customer_name IS NOT NULL AND 
    customer_phone IS NOT NULL AND 
    customer_address IS NOT NULL AND 
    customer_city IS NOT NULL
);

-- Fix permissive RLS policies for order_items INSERT
DROP POLICY "Users can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT WITH CHECK (
    order_id IS NOT NULL AND 
    product_name IS NOT NULL AND 
    quantity > 0
);