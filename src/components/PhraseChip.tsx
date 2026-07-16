interface PhraseChipProps {
  phrase: string;
  mentioned: boolean;
  onClick?: () => void;
  active?: boolean;
}

const PhraseChip = ({ phrase, mentioned, onClick, active }: PhraseChipProps) => {
  const classes = `inline-block border-2 px-2 py-1 font-mono text-xs uppercase tracking-wider cursor-pointer transition-opacity hover:opacity-80 ${
    mentioned
      ? "border-mentioned bg-mentioned/20 text-mentioned"
      : "border-not-mentioned bg-not-mentioned/10 text-not-mentioned"
  } ${active ? "ring-2 ring-accent ring-offset-1 ring-offset-background" : ""}`;

  return (
    <button type="button" onClick={onClick} className={classes}>
      {phrase}
    </button>
  );
};

export default PhraseChip;
