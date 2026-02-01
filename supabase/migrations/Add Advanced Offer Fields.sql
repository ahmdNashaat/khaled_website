-- Migration: Add Advanced Offer Fields
-- هذا الملف يحتوي على الـ SQL المطلوب لتحديث جدول offers

-- إضافة الحقول الجديدة لجدول offers
ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS free_quantity INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS min_amount NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS applicable_products TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS applicable_categories TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS auto_apply BOOLEAN DEFAULT true;

-- تعليقات توضيحية
COMMENT ON COLUMN offers.min_quantity IS 'الحد الأدنى للكمية (للعروض من نوع buy_x_get_y)';
COMMENT ON COLUMN offers.free_quantity IS 'عدد القطع المجانية';
COMMENT ON COLUMN offers.min_amount IS 'الحد الأدنى للمبلغ (للتوصيل المجاني أو الخصم)';
COMMENT ON COLUMN offers.applicable_products IS 'معرّفات المنتجات المطبق عليها العرض';
COMMENT ON COLUMN offers.applicable_categories IS 'معرّفات الأقسام المطبق عليها العرض';
COMMENT ON COLUMN offers.auto_apply IS 'هل يطبق العرض تلقائياً في السلة';

-- إنشاء index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_offers_applicable_products ON offers USING GIN (applicable_products);
CREATE INDEX IF NOT EXISTS idx_offers_applicable_categories ON offers USING GIN (applicable_categories);
CREATE INDEX IF NOT EXISTS idx_offers_dates ON offers (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_offers_active ON offers (is_active) WHERE is_active = true;