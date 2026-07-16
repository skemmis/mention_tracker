interface StatBlockProps {
  label: string;
  value: string | number;
  accent?: boolean;
}

const StatBlock = ({ label, value, accent }: StatBlockProps) => (
  <div className="border-2 border-border bg-card p-4">
    <div className={`font-pixel text-lg ${accent ? "text-primary" : "text-foreground"}`}>
      {value}
    </div>
    <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
      {label}
    </div>
  </div>
);

export default StatBlock;
