import { usePhraseHistory, useBackfillPhrase } from "@/hooks/useEvents";
import StatBlock from "@/components/StatBlock";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExternalLink } from "lucide-react";

interface PhraseTimelineInlineProps {
  phrase: string;
  subjectId?: string;
}

const PhraseTimelineInline = ({ phrase, subjectId }: PhraseTimelineInlineProps) => {
  const { data, isLoading, refetch } = usePhraseHistory(phrase, subjectId);

  const backfill = useBackfillPhrase();
  const [backfillTriggered, setBackfillTriggered] = useState(false);

  useEffect(() => {
    if (backfillTriggered || !data?.length || backfill.isPending) return;
    const firstItem = data[0];
    const event = firstItem.mention_events as any;
    const seriesTicker = event?.series_ticker;
    const sid = event?.subject_id;
    if (!seriesTicker || !sid) return;
    if (data.length >= 5) return;

    setBackfillTriggered(true);
    toast.info("SCANNING FOR MORE HISTORY...");
    backfill.mutate(
      { phrase, seriesTicker, subjectId: sid },
      {
        onSuccess: (result) => {
          if (result.newEvents > 0) {
            toast.success(`FOUND ${result.newEvents} NEW EVENTS`);
            refetch();
          }
        },
        onError: (err: any) => {
          toast.error(`BACKFILL FAILED: ${err.message}`);
        },
      }
    );
  }, [data, backfillTriggered]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const items = (data || [])
    .filter((i) => {
      const event = i.mention_events as any;
      const eventDate = new Date(event?.event_date || i.created_at);
      return eventDate < today;
    })
    .sort((a, b) => {
      const eA = a.mention_events as any;
      const eB = b.mention_events as any;
      return new Date(eB?.event_date || b.created_at).getTime() - new Date(eA?.event_date || a.created_at).getTime();
    });

  const mentioned = items.filter((i) => i.was_mentioned).length;
  const rate = items.length > 0 ? Math.round((mentioned / items.length) * 100) : 0;

  const buildKalshiUrl = (event: any) => {
    const series = (event?.series_ticker || "").toLowerCase();
    const ticker = (event?.kalshi_event_ticker || "").toLowerCase();
    return `https://kalshi.com/markets/${series}/${ticker}`;
  };

  const dates = items.map((i) => {
    const event = i.mention_events as any;
    return new Date(event?.event_date || i.created_at).getTime();
  });
  const minDate = dates.length ? Math.min(...dates) : 0;
  const maxDate = dates.length ? Math.max(...dates) : 0;
  const range = maxDate - minDate || 1;

  if (isLoading) {
    return (
      <div className="font-mono text-xs text-muted-foreground animate-blink py-4">
        LOADING...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border-2 border-dashed border-border p-6 text-center">
        <p className="font-mono text-xs text-muted-foreground">
          NO HISTORY FOUND FOR THIS PHRASE
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-2">
        <StatBlock label="APPEARANCES" value={items.length} />
        <StatBlock label="MENTIONED" value={mentioned} accent />
        <StatBlock label="RATE" value={`${rate}%`} accent />
      </div>

      {/* Timeline */}
      <div className="mb-6">
        <h3 className="mb-3 font-pixel text-[10px] text-secondary">TIMELINE</h3>
        <div className="relative border-2 border-border bg-card p-6">
          <div className="relative h-4 w-full bg-muted">
            {items.map((item) => {
              const event = item.mention_events as any;
              const d = new Date(event?.event_date || item.created_at).getTime();
              const pct = items.length === 1 ? 50 : ((d - minDate) / range) * 100;
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-pointer border-2 ${
                        item.was_mentioned
                          ? "border-mentioned bg-mentioned"
                          : "border-destructive bg-destructive"
                      }`}
                      style={{ left: `${pct}%` }}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="border-2 border-border bg-card font-mono text-xs">
                    <div className="text-foreground">
                      {format(new Date(event?.event_date || item.created_at), "MMM dd, yyyy")}
                    </div>
                    <div className="text-muted-foreground">{event?.title}</div>
                    <div className={item.was_mentioned ? "text-mentioned" : "text-destructive"}>
                      {item.was_mentioned ? "MENTIONED" : "NOT MENTIONED"}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between">
            <span className="font-mono text-[10px] text-muted-foreground">
              {format(new Date(minDate), "MMM yyyy")}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {format(new Date(maxDate), "MMM yyyy")}
            </span>
          </div>
        </div>
      </div>

      {/* All Appearances */}
      <div>
        <h3 className="mb-3 font-pixel text-[10px] text-secondary">ALL APPEARANCES</h3>
        <div className="space-y-2">
          {items.map((item) => {
            const event = item.mention_events as any;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between border-2 border-border bg-card p-3"
              >
                <div className="flex-1">
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {format(new Date(event?.event_date || item.created_at), "MMM dd, yyyy")}
                    {" — "}
                    {(event?.subjects as any)?.name}
                  </div>
                  <div className="font-mono text-xs text-foreground">
                    {event?.title}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={buildKalshiUrl(event)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-accent transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <div
                    className={`border-2 px-2 py-1 font-mono text-[10px] ${
                      item.was_mentioned
                        ? "border-mentioned text-mentioned"
                        : "border-destructive text-destructive"
                    }`}
                  >
                    {item.was_mentioned ? "YES" : "NO"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PhraseTimelineInline;
