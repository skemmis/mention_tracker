CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  session_id text,
  user_agent text,
  referrer text
);

-- Allow anonymous inserts (no auth required for tracking)
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts"
  ON public.analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No SELECT policy — data is write-only from the client
-- Add index for querying by event type and time
CREATE INDEX idx_analytics_event_type ON public.analytics_events (event_type, created_at DESC);
