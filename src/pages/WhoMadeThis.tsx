import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const WhoMadeThis = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("contact-form", {
        body: {
          name: name.trim() || null,
          email: email.trim() || null,
          message: message.trim(),
        },
      });

      if (error) throw error;

      toast({ title: "Message sent!", description: "Thanks for reaching out." });
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      toast({ title: "Failed to send", description: "Please try again later.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="container mx-auto max-w-2xl px-4 py-10">
      <Link to="/" className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft size={14} /> BACK
      </Link>

      <h1 className="font-pixel text-lg text-foreground sm:text-xl mb-6">WHO MADE THIS?</h1>

      <div className="space-y-4 font-mono text-sm leading-relaxed text-foreground/80 mb-10">
        <p>
          This tool was made by <strong>Lord Kemmis</strong>, the creator of{" "}
          <a
            href="https://fantasy-reality.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80"
          >
            Fantasy Reality
          </a>
          , a play-money prediction market game.
        </p>
      </div>

      <h2 className="font-pixel text-sm text-foreground mb-4">CONTACT ME</h2>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <Input
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="font-mono text-sm"
        />
        <Input
          type="email"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="font-mono text-sm"
        />
        <Textarea
          placeholder="Your message *"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          className="font-mono text-sm min-h-[120px]"
        />
        <Button type="submit" disabled={sending || !message.trim()} className="font-mono text-xs gap-2">
          <Send size={14} />
          {sending ? "SENDING..." : "SEND MESSAGE"}
        </Button>
      </form>
    </main>
  );
};

export default WhoMadeThis;
