import { useParams, useSearchParams } from "react-router-dom";
import PhraseTimelineInline from "@/components/PhraseTimeline";

const PhraseTimeline = () => {
  const { phrase } = useParams<{ phrase: string }>();
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get("subject") || undefined;
  const decodedPhrase = decodeURIComponent(phrase || "");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 font-pixel text-sm text-primary">PHRASE HISTORY</h1>
      <div className="mb-6 border-2 border-accent bg-accent/10 px-4 py-3">
        <span className="font-pixel text-xs text-accent">{decodedPhrase}</span>
      </div>
      <PhraseTimelineInline phrase={decodedPhrase} subjectId={subjectId} />
    </div>
  );
};

export default PhraseTimeline;
