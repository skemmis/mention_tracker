import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { trackEvent } from "@/lib/tracking";

const PixelHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b-4 border-primary bg-card px-6 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <a href="https://fantasy-reality.com" target="_blank" rel="noopener noreferrer" onClick={() => trackEvent({ type: "referral_click", source: "logo" })} className="flex flex-col leading-tight">
          <span className="font-pixel text-[8px] text-muted-foreground sm:text-[9px]">
            A FREE TOOL FROM
          </span>
          <h2 className="font-pixel text-sm text-foreground sm:text-base md:text-lg">
            FANTASY REALITY
          </h2>
        </a>

        <div className="flex items-center gap-3">
          <a
            href="https://fantasy-reality.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent({ type: "referral_click", source: "signup_button" })}
            className="hidden sm:block border-2 border-dashed border-primary/50 bg-primary/10 px-3 py-1.5 font-mono text-xs text-primary transition-colors hover:border-primary hover:bg-primary/20"
          >
            🚀 SIGN UP NOW →
          </a>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-foreground hover:text-primary transition-colors"
              aria-label="Menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 min-w-[200px] border-2 border-primary bg-card shadow-lg">
                  <Link
                    to="/what-is-this"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 font-mono text-xs text-foreground hover:bg-primary/10 hover:text-primary transition-colors border-b border-border"
                  >
                    WHAT IS THIS?
                  </Link>
                  <Link
                    to="/who-made-this"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 font-mono text-xs text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    WHO MADE THIS?
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default PixelHeader;
