import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { X, Link2, AlertCircle } from "lucide-react";
import AddEventForm from "@/components/AddEventForm";
import EventCard from "@/components/EventCard";
import PhraseOddsTable from "@/components/PhraseOddsTable";
import PhraseTimelineInline from "@/components/PhraseTimeline";
import type { EventWithPhrases } from "@/hooks/useEvents";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useSubjects, useDistinctPhrases } from "@/hooks/useEvents";
import { trackEvent } from "@/lib/tracking";
import { supabase } from "@/integrations/supabase/client";

function parseVideoEmbed(url: string): { type: "youtube" | "twitch"; embedUrl: string } | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1` };
  // Twitch channel
  const twitchChannel = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)$/);
  if (twitchChannel) return { type: "twitch", embedUrl: `https://player.twitch.tv/?channel=${twitchChannel[1]}&parent=${window.location.hostname}` };
  return null;
}

// Aliases for URL matching — maps common short names to canonical DB names
const SUBJECT_ALIASES: Record<string, string> = {
  "trump": "Donald Trump",
  "biden": "Joe Biden",
  "harris": "Kamala Harris",
  "kamala": "Kamala Harris",
  "vance": "JD Vance",
  "aoc": "Alexandria Ocasio-Cortez",
  "desantis": "Ron DeSantis",
  "newsom": "Gavin Newsom",
  "hochul": "Kathy Hochul",
  "rogan": "Joe Rogan",
  "elon": "Elon Musk",
  "musk": "Elon Musk",
  "zelenskyy": "Volodymyr Zelenskyy",
  "zelensky": "Volodymyr Zelenskyy",
  "rubio": "Marco Rubio",
  "powell": "Jerome Powell",
  "zuckerberg": "Mark Zuckerberg",
  "zuck": "Mark Zuckerberg",
  "walz": "Tim Walz",
  "starmer": "Keir Starmer",
  "melania": "Melania Trump",
  "colbert": "Stephen Colbert",
  "kimmel": "Jimmy Kimmel",
};

const Index = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [lastEvent, setLastEvent] = useState<EventWithPhrases | null>(null);
  const [selectedPhrase, setSelectedPhrase] = useState<{ phrase: string; subjectId?: string } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [urlInitialized, setUrlInitialized] = useState(false);

  // Hero query state
  const [personQuery, setPersonQuery] = useState("");
  const [phraseQuery, setPhraseQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<{ id: string; name: string } | null>(null);
  const [selectedPhraseText, setSelectedPhraseText] = useState<string | null>(null);
  const [showPersonSuggestions, setShowPersonSuggestions] = useState(false);
  const [showPhraseSuggestions, setShowPhraseSuggestions] = useState(false);
  const [personNotFound, setPersonNotFound] = useState(false);
  const [phraseNotFound, setPhraseNotFound] = useState(false);
  const personRef = useRef<HTMLDivElement>(null);
  const phraseRef = useRef<HTMLDivElement>(null);

  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const { data: phrases, isLoading: phrasesLoading } = useDistinctPhrases(selectedSubject?.id);

  // Auto-populate from URL params
  useEffect(() => {
    if (urlInitialized || !subjects || subjectsLoading) return;

    const personParam = searchParams.get("person");
    const phraseParam = searchParams.get("phrase");

    if (!personParam) {
      setUrlInitialized(true);
      return;
    }

    // Try to find matching subject: exact match → alias → partial match
    const personLower = personParam.toLowerCase();
    let matchedSubject = subjects.find(
      (s) => s.name.toLowerCase() === personLower
    );
    if (!matchedSubject) {
      const aliasName = SUBJECT_ALIASES[personLower];
      if (aliasName) {
        matchedSubject = subjects.find(
          (s) => s.name.toLowerCase() === aliasName.toLowerCase()
        );
      }
    }
    if (!matchedSubject) {
      // Partial match: find subject whose name contains the query or vice versa
      matchedSubject = subjects.find(
        (s) => s.name.toLowerCase().includes(personLower) || personLower.includes(s.name.toLowerCase())
      );
    }

    if (matchedSubject) {
      setSelectedSubject({ id: matchedSubject.id, name: matchedSubject.name });
      setPersonQuery(matchedSubject.name.toUpperCase());
      setPersonNotFound(false);

      if (phraseParam) {
        // Store phrase param to be resolved after phrases load
        setPhraseQuery(phraseParam.toUpperCase());
      }
    } else {
      setPersonQuery(personParam.toUpperCase());
      setPersonNotFound(true);
    }

    setUrlInitialized(true);
  }, [subjects, subjectsLoading, searchParams, urlInitialized]);

  // Resolve phrase from URL after phrases load
  useEffect(() => {
    if (!urlInitialized || !selectedSubject || phrasesLoading || !phrases) return;

    const phraseParam = searchParams.get("phrase");
    if (!phraseParam || selectedPhraseText) return;

    const matchedPhrase = phrases.find(
      (p) => p.toLowerCase() === phraseParam.toLowerCase()
    );

    if (matchedPhrase) {
      setSelectedPhraseText(matchedPhrase);
      setPhraseQuery(matchedPhrase);
      setPhraseNotFound(false);
    } else if (phraseQuery) {
      setPhraseNotFound(true);
    }
  }, [phrases, phrasesLoading, urlInitialized, selectedSubject, searchParams, selectedPhraseText, phraseQuery]);

  // Sync state to URL params
  const updateUrlParams = (person?: string, phrase?: string) => {
    const params = new URLSearchParams();
    if (person) params.set("person", person);
    if (phrase) params.set("phrase", phrase);
    setSearchParams(params, { replace: true });
  };

  const filteredSubjects = useMemo(() => {
    if (!subjects) return [];
    if (!personQuery.trim()) return subjects;
    return subjects.filter((s) =>
      s.name.toLowerCase().includes(personQuery.toLowerCase())
    );
  }, [subjects, personQuery]);

  const filteredPhrases = useMemo(() => {
    if (!phrases) return [];
    if (!phraseQuery.trim()) return phrases;
    return phrases.filter((p) =>
      p.toLowerCase().includes(phraseQuery.toLowerCase())
    );
  }, [phrases, phraseQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (personRef.current && !personRef.current.contains(e.target as Node)) {
        setShowPersonSuggestions(false);
      }
      if (phraseRef.current && !phraseRef.current.contains(e.target as Node)) {
        setShowPhraseSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleEventAdded = (event?: EventWithPhrases) => {
    if (event) setLastEvent(event);
    setSelectedPhrase(null);
    queryClient.invalidateQueries({ queryKey: ["events"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
  };

  const handlePhraseClick = (phrase: string, subjectId?: string) => {
    setSelectedPhrase((prev) =>
      prev?.phrase === phrase && prev?.subjectId === subjectId ? null : { phrase, subjectId }
    );
  };

  const handleSelectSubject = (subject: { id: string; name: string }) => {
    setSelectedSubject(subject);
    setPersonQuery(subject.name.toUpperCase());
    setShowPersonSuggestions(false);
    setPersonNotFound(false);
    setSelectedPhraseText(null);
    setPhraseQuery("");
    setPhraseNotFound(false);
    updateUrlParams(subject.name);
    trackEvent({ type: "hero_search", person: subject.name });
  };

  const handleSelectPhrase = (phrase: string) => {
    setSelectedPhraseText(phrase);
    setPhraseQuery(phrase);
    setShowPhraseSuggestions(false);
    setPhraseNotFound(false);
    updateUrlParams(selectedSubject?.name, phrase);
    trackEvent({ type: "hero_search", person: selectedSubject?.name || "", phrase });
  };

  const handleClearSelection = () => {
    setSelectedSubject(null);
    setSelectedPhraseText(null);
    setPersonQuery("");
    setPhraseQuery("");
    setPersonNotFound(false);
    setPhraseNotFound(false);
    updateUrlParams();
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
  };

  const { data: livestreamUrl } = useQuery({
    queryKey: ["site_config", "livestream_url"],
    queryFn: async () => {
      const { data } = await supabase.from("site_config").select("value").eq("key", "livestream_url").single();
      return data?.value || null;
    },
    staleTime: 30_000,
  });

  const videoEmbed = livestreamUrl ? parseVideoEmbed(livestreamUrl) : null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Livestream embed */}
      {videoEmbed && (
        <div className="mx-auto mb-8 max-w-2xl">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={videoEmbed.embedUrl}
              className="absolute inset-0 h-full w-full border-2 border-border"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Livestream"
            />
          </div>
          <p className="mt-1 text-center font-mono text-[9px] text-muted-foreground uppercase">
            LIVE
          </p>
        </div>
      )}

      {/* Hero Query */}
      <div className="mb-12 flex flex-col items-center text-center">
        <div className="flex flex-col items-center gap-y-2">
          <span className="font-pixel text-xl text-foreground sm:text-2xl md:text-4xl">
            HOW OFTEN DOES
          </span>

          {/* Person input */}
          <div ref={personRef} className="relative flex items-center justify-center">
            <input
              type="text"
              value={personQuery}
              onChange={(e) => {
                setPersonQuery(e.target.value);
                setSelectedSubject(null);
                setSelectedPhraseText(null);
                setPhraseQuery("");
                setPersonNotFound(false);
                setPhraseNotFound(false);
                setShowPersonSuggestions(true);
                updateUrlParams();
              }}
              onFocus={() => setShowPersonSuggestions(true)}
              placeholder="PERSON"
              className={`border-b-4 bg-transparent font-pixel text-xl placeholder:text-primary/30 focus:outline-none sm:text-2xl md:text-4xl min-w-[180px] max-w-[90vw] text-center ${
                personNotFound ? "border-destructive text-destructive" : "border-primary text-primary"
              }`}
              style={{ width: `${Math.max(7, (personQuery || 'PERSON').length + 2)}ch` }}
            />
            {personQuery && (
              <button
                onClick={() => {
                  setPersonQuery("");
                  setSelectedSubject(null);
                  setSelectedPhraseText(null);
                  setPhraseQuery("");
                  setPersonNotFound(false);
                  setPhraseNotFound(false);
                  updateUrlParams();
                }}
                className="absolute right-[-28px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            )}
            {showPersonSuggestions && filteredSubjects.length > 0 && (
              <div className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full min-w-[200px] overflow-y-auto border-2 border-border bg-card shadow-lg">
                {filteredSubjects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSubject(s)}
                    className="block w-full px-3 py-2 text-left font-mono text-xs uppercase text-foreground hover:bg-muted transition-colors"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Person not found message */}
          {personNotFound && (
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-destructive animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={12} />
              NO DATA FOR "{personQuery}" — TRY SEARCHING ABOVE
            </div>
          )}

          <span className="font-pixel text-xl text-foreground sm:text-2xl md:text-4xl">
            SAY
          </span>

          {/* Phrase input */}
          <div ref={phraseRef} className="relative flex items-center justify-center">
            <input
              type="text"
              value={phraseQuery}
              onChange={(e) => {
                setPhraseQuery(e.target.value);
                setSelectedPhraseText(null);
                setPhraseNotFound(false);
                setShowPhraseSuggestions(true);
              }}
              onFocus={() => setShowPhraseSuggestions(true)}
              placeholder="PHRASE"
              disabled={!selectedSubject}
              className={`border-b-4 bg-transparent font-pixel text-xl placeholder:text-primary/30 focus:outline-none sm:text-2xl md:text-4xl min-w-[180px] max-w-[90vw] text-center disabled:opacity-30 disabled:cursor-not-allowed ${
                phraseNotFound ? "border-destructive text-destructive" : "border-primary text-primary"
              }`}
              style={{ width: `${Math.max(7, (phraseQuery || 'PHRASE').length + 2)}ch` }}
            />
            {phraseQuery && (
              <button
                onClick={() => {
                  setPhraseQuery("");
                  setSelectedPhraseText(null);
                  setPhraseNotFound(false);
                  if (selectedSubject) {
                    updateUrlParams(selectedSubject.name);
                  }
                }}
                className="absolute right-[-28px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            )}
            {showPhraseSuggestions && filteredPhrases.length > 0 && selectedSubject && (
              <div className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full min-w-[200px] overflow-y-auto border-2 border-border bg-card shadow-lg">
                {filteredPhrases.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSelectPhrase(p)}
                    className="block w-full px-3 py-2 text-left font-mono text-xs uppercase text-foreground hover:bg-muted transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Phrase not found message */}
          {phraseNotFound && selectedSubject && (
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-destructive animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={12} />
              NO DATA FOR "{phraseQuery}" UNDER {selectedSubject.name.toUpperCase()}
            </div>
          )}

          <span className="font-pixel text-xl text-foreground sm:text-2xl md:text-4xl">
            ?
          </span>
        </div>

        {/* Share link button */}
        {selectedSubject && selectedPhraseText && (
          <button
            onClick={handleCopyLink}
            className="mt-3 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            title="Copy shareable link"
          >
            <Link2 size={12} />
            COPY LINK
          </button>
        )}
      </div>

      {/* Inline phrase timeline when both selected */}
      {selectedSubject && selectedPhraseText && (
        <div className="mx-auto max-w-2xl mb-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-pixel text-sm text-primary sm:text-base md:text-lg">
              {selectedPhraseText}
            </h2>
            <span className="font-mono text-[10px] text-muted-foreground">
              {selectedSubject.name}
            </span>
          </div>
          <PhraseTimelineInline
            phrase={selectedPhraseText}
            subjectId={selectedSubject.id}
          />
        </div>
      )}

      {/* Advanced: URL lookup */}
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="mb-4 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAdvanced ? "▼" : "▶"} ADVANCED: LOOK UP BY URL
        </button>

        {showAdvanced && (
          <div className="border-2 border-border bg-card/50 p-6">
            <AddEventForm onEventAdded={handleEventAdded} />
            <p className="mt-3 text-center font-mono text-[10px] text-muted-foreground">
              PASTE A KALSHI MENTION MARKET URL
            </p>
          </div>
        )}
      </div>

      {/* URL lookup result */}
      {lastEvent && (
        <div className="mx-auto mt-8 max-w-3xl">
          <div className="mb-3 font-pixel text-[10px] text-secondary">
            ODDS VS HISTORY — CLICK ANY PHRASE FOR FULL TIMELINE
          </div>
          <PhraseOddsTable
            phrases={lastEvent.phrases}
            subjectId={lastEvent.subject?.id}
            subjectName={lastEvent.subject?.name || "Unknown"}
            eventDate={lastEvent.event_date}
            onPhraseClick={handlePhraseClick}
          />
        </div>
      )}

      {/* Inline phrase timeline from URL lookup */}
      {selectedPhrase && (
        <div className="mx-auto mt-8 max-w-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-pixel text-sm text-primary sm:text-base md:text-lg">
              {selectedPhrase.phrase}
            </h2>
            <button
              onClick={() => setSelectedPhrase(null)}
              className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕ CLOSE
            </button>
          </div>
          <PhraseTimelineInline
            phrase={selectedPhrase.phrase}
            subjectId={selectedPhrase.subjectId}
          />
        </div>
      )}
    </div>
  );
};

export default Index;
