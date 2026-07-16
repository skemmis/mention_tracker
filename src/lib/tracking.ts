import { supabase } from "@/integrations/supabase/client";

// Simple session ID (persists per tab)
let sessionId: string | null = null;
function getSessionId(): string {
  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }
  return sessionId;
}

type TrackingEvent =
  | { type: "hero_search"; person: string; phrase?: string }
  | { type: "url_lookup"; url: string }
  | { type: "referral_click"; source?: string };

export function trackEvent(event: TrackingEvent) {
  const { type, ...data } = event;

  // Fire and forget — don't block UI
  supabase
    .from("analytics_events")
    .insert({
      event_type: type,
      event_data: data,
      session_id: getSessionId(),
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
    })
    .then(({ error }) => {
      if (error) console.error("Tracking error:", error);
    });
}
