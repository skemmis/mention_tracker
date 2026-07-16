import PhraseChip from "./PhraseChip";
import { format } from "date-fns";

interface PhraseMarket {
  id: string;
  phrase_text: string;
  was_mentioned: boolean;
  yes_bid: number | null;
  no_bid: number | null;
}

interface EventCardProps {
  title: string;
  subjectName: string;
  subjectId?: string;
  eventDate: string;
  phrases: PhraseMarket[];
  onPhraseClick?: (phrase: string, subjectId?: string) => void;
  selectedPhrase?: string;
}

const EventCard = ({ title, subjectName, subjectId, eventDate, phrases, onPhraseClick, selectedPhrase }: EventCardProps) => {
  const mentioned = phrases.filter((p) => p.was_mentioned).length;

  return (
    <div className="border-2 border-border bg-card p-4 transition-colors hover:border-muted-foreground">
      <div className="mb-1 flex items-center gap-3">
        <span className="border border-secondary bg-secondary/20 px-2 py-0.5 font-mono text-[10px] uppercase text-secondary">
          {subjectName}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {format(new Date(eventDate), "MMM dd, yyyy")}
        </span>
      </div>
      <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-foreground">
        {title}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {phrases.map((p) => (
          <PhraseChip
            key={p.id}
            phrase={p.phrase_text}
            mentioned={p.was_mentioned}
            onClick={() => onPhraseClick?.(p.phrase_text, subjectId)}
            active={selectedPhrase === p.phrase_text}
          />
        ))}
      </div>
      <div className="mt-3 font-mono text-[10px] text-muted-foreground">
        {mentioned}/{phrases.length} MENTIONED
      </div>
    </div>
  );
};

export default EventCard;
