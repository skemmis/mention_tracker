
-- Count events by type
CREATE OR REPLACE FUNCTION public.count_events_by_type()
RETURNS TABLE(event_type text, count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT event_type, COUNT(*) as count
  FROM public.analytics_events
  GROUP BY event_type
$$;

-- Top searched people (from hero_search event_data->>'person')
CREATE OR REPLACE FUNCTION public.top_searched_people(lim int DEFAULT 10)
RETURNS TABLE(name text, count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT event_data->>'person' as name, COUNT(*) as count
  FROM public.analytics_events
  WHERE event_type = 'hero_search' AND event_data->>'person' IS NOT NULL
  GROUP BY event_data->>'person'
  ORDER BY count DESC
  LIMIT lim
$$;

-- Top searched phrases (from hero_search event_data->>'phrase')
CREATE OR REPLACE FUNCTION public.top_searched_phrases(lim int DEFAULT 10)
RETURNS TABLE(name text, count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT event_data->>'phrase' as name, COUNT(*) as count
  FROM public.analytics_events
  WHERE event_type = 'hero_search' AND event_data->>'phrase' IS NOT NULL
  GROUP BY event_data->>'phrase'
  ORDER BY count DESC
  LIMIT lim
$$;

-- Daily event counts
CREATE OR REPLACE FUNCTION public.daily_event_counts()
RETURNS TABLE(day date, count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT created_at::date as day, COUNT(*) as count
  FROM public.analytics_events
  GROUP BY created_at::date
  ORDER BY day
$$;

-- Daily unique session counts
CREATE OR REPLACE FUNCTION public.daily_session_counts()
RETURNS TABLE(day date, sessions bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT created_at::date as day, COUNT(DISTINCT session_id) as sessions
  FROM public.analytics_events
  WHERE session_id IS NOT NULL
  GROUP BY created_at::date
  ORDER BY day
$$;
