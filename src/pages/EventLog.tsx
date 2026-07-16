import { useState } from "react";
import EventCard from "@/components/EventCard";
import { useEvents, useSubjects } from "@/hooks/useEvents";

const EventLog = () => {
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const { data: events, isLoading } = useEvents();
  const { data: subjects } = useSubjects();

  const filtered = subjectFilter
    ? events?.filter((e) => e.subject?.id === subjectFilter)
    : events;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-4 font-pixel text-sm text-primary">EVENT LOG</h1>

      {/* Subject Filter */}
      {subjects && subjects.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1">
          <button
            onClick={() => setSubjectFilter("")}
            className={`border-2 px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              !subjectFilter
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary"
            }`}
          >
            ALL
          </button>
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setSubjectFilter(s.id)}
              className={`border-2 px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                subjectFilter === s.id
                  ? "border-secondary bg-secondary text-secondary-foreground"
                  : "border-border text-muted-foreground hover:border-secondary"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="font-mono text-xs text-muted-foreground animate-blink">
          LOADING...
        </div>
      ) : filtered?.length === 0 ? (
        <div className="border-2 border-dashed border-border p-8 text-center">
          <p className="font-mono text-xs text-muted-foreground">
            NO EVENTS FOUND.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered?.map((event) => (
            <EventCard
              key={event.id}
              title={event.title}
              subjectName={event.subject?.name || "Unknown"}
              subjectId={event.subject?.id}
              eventDate={event.event_date}
              phrases={event.phrases}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventLog;
