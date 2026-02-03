-- Create hero_banners table
CREATE TABLE IF NOT EXISTS public.hero_banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ar TEXT NOT NULL,
  subtitle_ar TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  cta_primary_text TEXT,
  cta_primary_link TEXT,
  cta_secondary_text TEXT,
  cta_secondary_link TEXT,
  badge_text TEXT,
  gradient_class TEXT DEFAULT 'from-primary/90 via-primary/70 to-transparent',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;

-- Public can view active banners
CREATE POLICY "Anyone can view active hero banners" ON public.hero_banners
  FOR SELECT
  USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage hero banners" ON public.hero_banners
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hero_banners_updated_at 
  BEFORE UPDATE ON public.hero_banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default banners
INSERT INTO public.hero_banners (title_ar, subtitle_ar, description, image_url, badge_text, cta_primary_text, cta_primary_link, cta_secondary_text, cta_secondary_link, display_order) VALUES
('أسهل مكان للعثور على هدايا المناسبات', 'مجموعة مذاق المتميزة من التمور', 'باقات مميزة من التمور والعسل والمكسرات بأفضل جودة وسعر لشهر رمضان', '/hero-slide-1.jpg', '🌙 رمضان كريم', 'اكتشف الهدايا', '/products', 'تواصل معنا', 'https://wa.me/+201276166532', 1),
('تمور عربية فاخرة', 'من أرقى المزارع السعودية', 'تمور طازجة ومختارة بعناية لتقديم أفضل طعم وجودة لعائلتك', '/hero-slide-2.jpg', '✨ عروض خاصة', 'تسوق التمور', '/products', 'اطلب الآن', 'https://wa.me/+201276166532', 2),
('عسل نحل طبيعي 100%', 'من أجود المناحل', 'عسل طبيعي بدون أي إضافات أو مواد حافظة - غني بالفوائد الصحية', '/hero-slide-3.jpg', '🍯 عسل طبيعي', 'اشترِ الآن', '/products', 'واتساب', 'https://wa.me/+201276166532', 3);