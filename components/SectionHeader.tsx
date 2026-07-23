export default function SectionHeader({
  n,
  kicker,
  title,
  className = "",
}: {
  n: string;
  kicker: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <span className="font-mono text-xs tabular-nums text-ember">{n}</span>
      <span className="ink-rule w-10 flex-none" />
      <span className="kicker">{kicker}</span>
      <h2 className="sr-only">{title}</h2>
    </div>
  );
}
