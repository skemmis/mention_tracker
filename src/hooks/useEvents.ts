import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 1000;

/** Paginate through all rows of a query to bypass the 1000-row default cap */
async function fetchAllRows<T>(
  buildQuery: (from: number, to: number) => any
): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await buildQuery(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

export interface EventWithPhrases {
  id: string;
  title: string;
  event_date: string;
  kalshi_event_ticker: string;
  series_ticker: string | null;
  created_at: string;
  subject: { id: string; name: string };
  phrases: {
    id: string;
    phrase_text: string;
    was_mentioned: boolean;
    yes_bid: number | null;
    no_bid: number | null;
    kalshi_ticker: string;
  }[];
}

export function useEvents(limit?: number) {
  return useQuery({
    queryKey: ["events", limit],
    queryFn: async () => {
      let events: any[];

      if (limit) {
        const { data, error } = await supabase
          .from("mention_events")
          .select("*, subjects(id, name)")
          .order("event_date", { ascending: false })
          .limit(limit);
        if (error) throw error;
        events = data;
      } else {
        // Paginate to get ALL events
        events = await fetchAllRows((from, to) =>
          supabase
            .from("mention_events")
            .select("*, subjects(id, name)")
            .order("event_date", { ascending: false })
            .range(from, to)
        );
      }

      const eventIds = events.map((e) => e.id);
      if (eventIds.length === 0) return [] as EventWithPhrases[];

      // Paginate phrases too
      const phrases = await fetchAllRows<any>((from, to) =>
        supabase
          .from("phrase_markets")
          .select("*")
          .in("mention_event_id", eventIds)
          .range(from, to)
      );

      return events.map((e) => ({
        id: e.id,
        title: e.title,
        event_date: e.event_date,
        kalshi_event_ticker: e.kalshi_event_ticker,
        series_ticker: e.series_ticker,
        created_at: e.created_at,
        subject: e.subjects as unknown as { id: string; name: string },
        phrases: (phrases || []).filter((p) => p.mention_event_id === e.id),
      })) as EventWithPhrases[];
    },
  });
}

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const [{ count: eventCount }, { count: phraseCount }, { count: mentionedCount }] =
        await Promise.all([
          supabase.from("mention_events").select("*", { count: "exact", head: true }),
          supabase.from("phrase_markets").select("*", { count: "exact", head: true }),
          supabase.from("phrase_markets").select("*", { count: "exact", head: true }).eq("was_mentioned", true),
        ]);

      const total = phraseCount || 0;
      const mentioned = mentionedCount || 0;
      const rate = total > 0 ? Math.round((mentioned / total) * 100) : 0;

      return {
        totalEvents: eventCount || 0,
        totalPhrases: total,
        mentionRate: rate,
      };
    },
  });
}

export function usePhraseHistory(phrase: string, subjectId?: string) {
  return useQuery({
    queryKey: ["phraseHistory", phrase, subjectId],
    queryFn: async () => {
      const buildQuery = (from: number, to: number) => {
        let query = supabase
          .from("phrase_markets")
          .select("*, mention_events!inner(*, subjects(name))")
          .eq("phrase_text", phrase)
          .order("created_at", { ascending: true })
          .range(from, to);

        if (subjectId) {
          query = query.eq("mention_events.subject_id", subjectId);
        }
        return query;
      };

      return fetchAllRows<any>(buildQuery);
    },
    enabled: !!phrase,
  });
}

export function useBackfillPhrase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      phrase,
      seriesTicker,
      subjectId,
    }: {
      phrase: string;
      seriesTicker: string;
      subjectId: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("backfill-phrase", {
        body: {
          phrase,
          series_ticker: seriesTicker,
          subject_id: subjectId,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phraseHistory"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useDistinctPhrases(subjectId?: string) {
  return useQuery({
    queryKey: ["distinctPhrases", subjectId],
    queryFn: async () => {
      const allData = await fetchAllRows<any>((from, to) => {
        let query = supabase
          .from("phrase_markets")
          .select("phrase_text, mention_events!inner(subject_id)")
          .range(from, to);

        if (subjectId) {
          query = query.eq("mention_events.subject_id", subjectId);
        }
        return query;
      });

      const unique = [...new Set(allData.map((d: any) => d.phrase_text as string))];
      return unique.sort();
    },
    enabled: !!subjectId,
  });
}

export function usePhraseSearch(searchTerm: string, subjectId?: string) {
  return useQuery({
    queryKey: ["phraseSearch", searchTerm, subjectId],
    queryFn: async () => {
      const allData = await fetchAllRows<any>((from, to) => {
        let query = supabase
          .from("phrase_markets")
          .select("*, mention_events!inner(*, subjects(id, name))")
          .ilike("phrase_text", `%${searchTerm}%`)
          .range(from, to);

        if (subjectId) {
          query = query.eq("mention_events.subject_id", subjectId);
        }
        return query;
      });

      const grouped: Record<string, typeof allData> = {};
      for (const item of allData) {
        const key = item.phrase_text;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
      }

      return Object.entries(grouped).map(([phrase, items]) => {
        const mentionedCount = items.filter((i: any) => i.was_mentioned).length;
        return {
          phrase,
          total: items.length,
          mentioned: mentionedCount,
          notMentioned: items.length - mentionedCount,
          rate: Math.round((mentionedCount / items.length) * 100),
          items,
        };
      });
    },
    enabled: searchTerm.length >= 2,
  });
}
