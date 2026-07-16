import { useState } from "react";
import { Input } from "@/components/ui/input";
import { usePhraseSearch, useSubjects } from "@/hooks/useEvents";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const PhraseSearch = () => {
  const [search, setSearch] = useState("");
  const [subjectId, setSubjectId] = useState<string>("");
  const { data: subjects } = useSubjects();
  const { data: results, isLoading } = usePhraseSearch(search, subjectId || undefined);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-4 font-pixel text-sm text-primary">PHRASE SEARCH</h1>

      {/* Search */}
      <div className="mb-4 flex gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="SEARCH PHRASES..."
          className="flex-1 border-2 border-border bg-muted font-mono text-xs uppercase tracking-wider"
        />
      </div>

      {/* Subject Filter */}
      {subjects && subjects.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1">
          <button
            onClick={() => setSubjectId("")}
            className={`border-2 px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              !subjectId
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary"
            }`}
          >
            ALL SUBJECTS
          </button>
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setSubjectId(s.id)}
              className={`border-2 px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                subjectId === s.id
                  ? "border-secondary bg-secondary text-secondary-foreground"
                  : "border-border text-muted-foreground hover:border-secondary"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {search.length < 2 ? (
        <div className="border-2 border-dashed border-border p-8 text-center">
          <p className="font-mono text-xs text-muted-foreground">
            TYPE AT LEAST 2 CHARACTERS TO SEARCH
          </p>
        </div>
      ) : isLoading ? (
        <div className="font-mono text-xs text-muted-foreground animate-blink">
          SEARCHING...
        </div>
      ) : results?.length === 0 ? (
        <div className="border-2 border-dashed border-border p-8 text-center">
          <p className="font-mono text-xs text-muted-foreground">
            NO RESULTS FOUND
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results?.map((r) => (
            <div key={r.phrase} className="border-2 border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <Link
                  to={`/phrase/${encodeURIComponent(r.phrase)}`}
                  className="font-pixel text-[10px] text-accent hover:text-primary transition-colors"
                >
                  {r.phrase}
                </Link>
                <div className="flex gap-3">
                  <span className="font-mono text-[10px] text-mentioned">
                    {r.rate}% RATE
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {r.total} APPEARANCES
                  </span>
                </div>
              </div>

              {/* Mini event list */}
              <div className="space-y-1">
                {r.items.slice(0, 5).map((item) => {
                  const event = item.mention_events as any;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-1 font-mono text-[10px]"
                    >
                      <span className="text-muted-foreground">
                        {format(
                          new Date(event?.event_date || item.created_at),
                          "MMM dd"
                        )}{" "}
                        — {event?.title?.slice(0, 50)}
                      </span>
                      <span
                        className={
                          item.was_mentioned
                            ? "text-mentioned"
                            : "text-destructive"
                        }
                      >
                        {item.was_mentioned ? "YES" : "NO"}
                      </span>
                    </div>
                  );
                })}
                {r.items.length > 5 && (
                  <Link
                    to={`/phrase/${encodeURIComponent(r.phrase)}`}
                    className="block font-mono text-[10px] text-accent hover:text-primary"
                  >
                    +{r.items.length - 5} MORE →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhraseSearch;
