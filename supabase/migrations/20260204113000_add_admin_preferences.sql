CREATE TABLE IF NOT EXISTS public.admin_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  weekly_summary BOOLEAN NOT NULL DEFAULT true,
  default_order_status TEXT NOT NULL DEFAULT 'all',
  dashboard_layout TEXT NOT NULL DEFAULT 'comfortable',
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their preferences"
  ON public.admin_preferences FOR SELECT
  USING (public.is_admin() AND auth.uid() = user_id);

CREATE POLICY "Admins can insert their preferences"
  ON public.admin_preferences FOR INSERT
  WITH CHECK (public.is_admin() AND auth.uid() = user_id);

CREATE POLICY "Admins can update their preferences"
  ON public.admin_preferences FOR UPDATE
  USING (public.is_admin() AND auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_admin_preferences_updated_at'
  ) THEN
    CREATE TRIGGER update_admin_preferences_updated_at
    BEFORE UPDATE ON public.admin_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_admin_preferences_user_id
  ON public.admin_preferences(user_id);
