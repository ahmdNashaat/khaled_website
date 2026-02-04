-- Add avatar_url to profiles and create user_addresses table

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE TABLE IF NOT EXISTS public.user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  city TEXT NOT NULL,
  area TEXT NOT NULL,
  street TEXT NOT NULL,
  building TEXT,
  floor TEXT,
  apartment TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own addresses"
  ON public.user_addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own addresses"
  ON public.user_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own addresses"
  ON public.user_addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own addresses"
  ON public.user_addresses FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Admins can view all addresses"
  ON public.user_addresses FOR SELECT
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_addresses_one_default
  ON public.user_addresses(user_id)
  WHERE is_default;
