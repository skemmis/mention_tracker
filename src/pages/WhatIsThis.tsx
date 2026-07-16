import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const WhatIsThis = () => {
  return (
    <main className="container mx-auto max-w-2xl px-4 py-10">
      <Link to="/" className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft size={14} /> BACK
      </Link>

      <h1 className="font-pixel text-lg text-foreground sm:text-xl mb-6">WHAT IS THIS?</h1>

      <div className="space-y-4 font-mono text-sm leading-relaxed text-foreground/80">
        <p>
          This tool tracks <strong>prediction market odds</strong> for whether specific words or phrases
          will be mentioned during live events — speeches, debates, press conferences, and more.
        </p>
        <p>
          The odds come from <strong>Kalshi</strong>, where real people trade contracts on real-world outcomes.
        </p>
        <p>
          We pull data from Kalshi's public API, match phrases to upcoming events, and display the odds
          in real time. After an event ends, we record whether each phrase was actually mentioned — so you
          can track how well the market predicted what would be said.
        </p>
      </div>
    </main>
  );
};

export default WhatIsThis;
