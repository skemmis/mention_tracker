import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/tracking";
import type { EventWithPhrases } from "@/hooks/useEvents";

interface AddEventFormProps {
  onEventAdded?: (event?: EventWithPhrases) => void;
}

const AddEventForm = ({ onEventAdded }: AddEventFormProps) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    trackEvent({ type: "url_lookup", url: url.trim() });
    try {
      const { data, error } = await supabase.functions.invoke("fetch-kalshi", {
        body: { url: url.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`TRACKED: ${data.event?.title || "Event added"}`);

      // Build the EventWithPhrases from the response
      const eventData: EventWithPhrases | undefined = data.event
        ? {
            id: data.event.id,
            title: data.event.title,
            event_date: data.event.event_date,
            kalshi_event_ticker: data.event.kalshi_event_ticker,
            series_ticker: data.event.series_ticker,
            created_at: data.event.created_at,
            subject: { id: data.event.subject_id, name: data.subject || "Unknown" },
            phrases: (data.phrases || []).map((p: any) => ({
              id: p.id || crypto.randomUUID(),
              phrase_text: p.phrase_text,
              was_mentioned: p.was_mentioned,
              yes_bid: p.yes_bid,
              no_bid: p.no_bid,
              kalshi_ticker: p.kalshi_ticker,
            })),
          }
        : undefined;

      setUrl("");
      onEventAdded?.(eventData);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch Kalshi data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="PASTE KALSHI MARKET URL..."
        className="flex-1 border-2 border-border bg-muted font-mono text-xs uppercase tracking-wider placeholder:text-muted-foreground h-12"
      />
      <Button
        type="submit"
        disabled={loading || !url.trim()}
        className="border-2 border-primary bg-primary font-pixel text-xs text-primary-foreground hover:bg-primary/80 h-12 px-6"
      >
        {loading ? (
          <span className="animate-blink">LOADING...</span>
        ) : (
          "TRACK"
        )}
      </Button>
    </form>
  );
};

export default AddEventForm;
