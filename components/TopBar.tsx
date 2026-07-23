export default function TopBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 md:px-10">
      <a href="#hero" className="group flex items-baseline gap-2">
        <span className="font-serif text-lg tracking-tight text-bone">
          nexious
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-ember transition-transform duration-500 group-hover:scale-150" />
      </a>
      <div className="flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.22em] text-muted uppercase">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ember" />
        <span className="hidden sm:inline">In — Becoming</span>
      </div>
    </header>
  );
}
