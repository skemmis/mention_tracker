-- Allow reading analytics_events (needed for admin dashboard)
CREATE POLICY "Public read analytics_events"
  ON public.analytics_events
  FOR SELECT
  TO anon, authenticated
  USING (true);
