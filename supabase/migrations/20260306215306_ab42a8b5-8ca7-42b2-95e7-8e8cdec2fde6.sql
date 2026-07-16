
-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mention_events table
CREATE TABLE public.mention_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  kalshi_event_ticker TEXT NOT NULL,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create phrase_markets table
CREATE TABLE public.phrase_markets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mention_event_id UUID NOT NULL REFERENCES public.mention_events(id) ON DELETE CASCADE,
  phrase_text TEXT NOT NULL,
  was_mentioned BOOLEAN NOT NULL DEFAULT false,
  yes_bid NUMERIC(5,2),
  no_bid NUMERIC(5,2),
  kalshi_ticker TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mention_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phrase_markets ENABLE ROW LEVEL SECURITY;

-- Open access policies (no auth required by design)
CREATE POLICY "Public read subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Public insert subjects" ON public.subjects FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read mention_events" ON public.mention_events FOR SELECT USING (true);
CREATE POLICY "Public insert mention_events" ON public.mention_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read phrase_markets" ON public.phrase_markets FOR SELECT USING (true);
CREATE POLICY "Public insert phrase_markets" ON public.phrase_markets FOR INSERT WITH CHECK (true);

-- Indexes for common queries
CREATE INDEX idx_mention_events_subject ON public.mention_events(subject_id);
CREATE INDEX idx_mention_events_date ON public.mention_events(event_date DESC);
CREATE INDEX idx_phrase_markets_event ON public.phrase_markets(mention_event_id);
CREATE INDEX idx_phrase_markets_phrase ON public.phrase_markets(phrase_text);
