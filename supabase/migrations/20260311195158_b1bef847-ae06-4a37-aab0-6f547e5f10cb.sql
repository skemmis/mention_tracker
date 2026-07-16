CREATE OR REPLACE FUNCTION public.count_unique_sessions()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT session_id) FROM public.analytics_events WHERE session_id IS NOT NULL
$$;