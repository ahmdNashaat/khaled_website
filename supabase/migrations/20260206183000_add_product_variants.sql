-- Create product_variants table for weights/variants
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    label TEXT NOT NULL,
    weight_grams INTEGER,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    stock_qty INTEGER,
    low_stock_threshold INTEGER,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ensure only one default variant per product
CREATE UNIQUE INDEX IF NOT EXISTS product_variants_default_unique
  ON public.product_variants(product_id)
  WHERE is_default;

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON public.product_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_sort ON public.product_variants(sort_order);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_variants (public read active, admin write)
CREATE POLICY "Anyone can view active product variants"
  ON public.product_variants FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all product variants"
  ON public.product_variants FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage product variants"
  ON public.product_variants FOR ALL
  USING (public.is_admin());

-- updated_at trigger
CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill from legacy product_sizes
INSERT INTO public.product_variants (product_id, label, price, sort_order, is_default, is_active)
SELECT
  ps.product_id,
  ps.label,
  ps.price,
  ROW_NUMBER() OVER (PARTITION BY ps.product_id ORDER BY ps.price) - 1 AS sort_order,
  CASE
    WHEN ROW_NUMBER() OVER (PARTITION BY ps.product_id ORDER BY ps.price) = 1 THEN true
    ELSE false
  END AS is_default,
  true AS is_active
FROM public.product_sizes ps
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_variants pv WHERE pv.product_id = ps.product_id
);

-- Add variant reference to order_items
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;
