import Link from "next/link";

export default function Arena() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <p className="kicker">Project Arena</p>
      <h1 className="font-serif text-5xl text-bone md:text-7xl">
        A different <span className="text-ember italic">world</span> — coming
        soon.
      </h1>
      <p className="max-w-md text-muted">
        This is where every project will live and breathe. For now, the gate is
        still being forged.
      </p>
      <Link
        href="/"
        className="group mt-4 inline-flex items-center gap-3 font-mono text-xs tracking-[0.25em] text-bone uppercase"
      >
        <span className="text-ember transition-transform duration-500 group-hover:-translate-x-1.5">
          ←
        </span>
        Back to the path
      </Link>
    </main>
  );
}
