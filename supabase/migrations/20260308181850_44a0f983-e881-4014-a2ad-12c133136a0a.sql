
CREATE TABLE public.site_config (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site_config" ON public.site_config
  FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.site_config (key, value) VALUES ('livestream_url', NULL);
