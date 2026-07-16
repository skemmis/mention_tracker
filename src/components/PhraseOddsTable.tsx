import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PhraseData {
  phrase_text: string;
  yes_bid: number | null;
  no_bid: number | null;
  was_mentioned: boolean;
  kalshi_ticker: string;
}

interface PhraseWithStats {
  phrase_text: string;
  currentOdds: number | null;
  historicalRate: number | null;
  historicalCount: number;
  historicalMentioned: number;
  differential: number | null;
  wasMentioned: boolean;
}

interface PhraseOddsTableProps {
  phrases: PhraseData[];
  subjectId?: string;
  subjectName: string;
  eventDate: string;
  onPhraseClick?: (phrase: string, subjectId?: string) => void;
}

const PhraseOddsTable = ({
  phrases,
  subjectId,
  subjectName,
  eventDate,
  onPhraseClick,
}: PhraseOddsTableProps) => {
  const [stats, setStats] = useState<PhraseWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistorical = async () => {
      setLoading(true);

      const phraseTexts = phrases.map((p) => p.phrase_text);

      // Fetch historical data filtered by subject, excluding future events
      const today = new Date().toISOString().split("T")[0];
      let query = supabase
        .from("phrase_markets")
        .select("phrase_text, was_mentioned, mention_event_id, mention_events!inner(subject_id, event_date)")
        .in("phrase_text", phraseTexts)
        .lt("mention_events.event_date", today);

      if (subjectId) {
        query = query.eq("mention_events.subject_id", subjectId);
      }

      const { data: historicalData } = await query;

      // Group historical by phrase
      const histMap: Record<string, { total: number; mentioned: number }> = {};
      for (const item of historicalData || []) {
        if (!histMap[item.phrase_text]) {
          histMap[item.phrase_text] = { total: 0, mentioned: 0 };
        }
        histMap[item.phrase_text].total++;
        if (item.was_mentioned) histMap[item.phrase_text].mentioned++;
      }

      const result: PhraseWithStats[] = phrases.map((p) => {
        const hist = histMap[p.phrase_text] || { total: 0, mentioned: 0 };
        const historicalRate =
          hist.total > 0
            ? Math.round((hist.mentioned / hist.total) * 100)
            : null;
        const currentOdds =
          p.yes_bid !== null ? Math.round(p.yes_bid * 100) : null;
        const differential =
          currentOdds !== null && historicalRate !== null ? historicalRate - currentOdds : null;

        return {
          phrase_text: p.phrase_text,
          currentOdds,
          historicalRate,
          historicalCount: hist.total,
          historicalMentioned: hist.mentioned,
          differential,
          wasMentioned: p.was_mentioned,
        };
      });

      // Sort by differential descending (highest positive first)
      result.sort((a, b) => {
        if (a.differential === null && b.differential === null) return 0;
        if (a.differential === null) return 1;
        if (b.differential === null) return -1;
        return b.differential - a.differential;
      });

      setStats(result);
      setLoading(false);
    };

    if (phrases.length > 0) fetchHistorical();
    else setLoading(false);
  }, [phrases]);

  if (loading) {
    return (
      <div className="font-mono text-xs text-muted-foreground animate-blink">
        ANALYZING ODDS...
      </div>
    );
  }

  if (stats.length === 0) return null;

  return (
    <div className="border-2 border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="border border-secondary bg-secondary/20 px-2 py-0.5 font-mono text-[10px] uppercase text-secondary">
            {subjectName}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {eventDate}
          </span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          {stats.length} PHRASES
        </span>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Phrase
            </TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground text-right w-[90px]">
              Current
            </TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground text-center w-[120px]">
              Historical
            </TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground text-right w-[90px]">
              Edge
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.map((s) => {
            const diffColor =
              s.differential === null
                ? "text-muted-foreground"
                : s.differential > 10
                  ? "text-green-400"
                  : s.differential > 0
                    ? "text-green-400/70"
                    : s.differential < -10
                      ? "text-red-400"
                      : s.differential < 0
                        ? "text-red-400/70"
                        : "text-muted-foreground";

            return (
              <TableRow
                key={s.phrase_text}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onPhraseClick?.(s.phrase_text, subjectId)}
              >
                <TableCell className="font-mono text-xs uppercase text-foreground">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        s.wasMentioned ? "bg-green-400" : "bg-muted-foreground/30"
                      }`}
                    />
                    {s.phrase_text}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-xs text-foreground">
                  {s.currentOdds !== null ? `${s.currentOdds}%` : "—"}
                </TableCell>
                <TableCell className="text-center font-mono text-xs text-muted-foreground">
                  {s.historicalRate !== null ? (
                    <>
                      {s.historicalRate}%
                      <span className="ml-1 text-[9px] text-muted-foreground/50">
                        ({s.historicalMentioned}/{s.historicalCount})
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground/50">N/A</span>
                  )}
                </TableCell>
                <TableCell
                  className={`text-right font-mono text-xs font-bold ${diffColor}`}
                >
                  {s.differential !== null
                    ? `${s.differential > 0 ? "+" : ""}${s.differential}`
                    : <span className="text-muted-foreground/50 font-normal">N/A</span>}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="border-t border-border px-4 py-2">
        <p className="font-mono text-[9px] text-muted-foreground">
          EDGE = HISTORICAL MENTION RATE − CURRENT ODDS · POSITIVE = HISTORICALLY UNDERPRICED · CLICK A PHRASE FOR FULL HISTORY
        </p>
      </div>
    </div>
  );
};

export default PhraseOddsTable;
