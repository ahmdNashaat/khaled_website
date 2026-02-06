ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS featured_order integer;

CREATE INDEX IF NOT EXISTS idx_products_featured_order
ON public.products (is_featured, featured_order);
