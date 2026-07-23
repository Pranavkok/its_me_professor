import ModelStage from "@/components/ModelStage";
import SectionHeader from "@/components/SectionHeader";

export default function Projects() {
  return (
    <section
      id="projects"
      className="relative flex min-h-screen scroll-mt-24 items-center overflow-hidden px-6 py-28 md:px-10"
    >
      {/* the gate — torii / heavy iron door behind the copy */}
      <ModelStage
        model="torii.glb"
        className="pointer-events-none absolute inset-0 opacity-40"
      >
        <span className="font-mono text-[0.7rem] tracking-[0.25em] text-faint uppercase">
          [ a gate that opens on click ]
        </span>
      </ModelStage>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink" />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <SectionHeader
          n="04"
          kicker="Projects — The Arena"
          title="Projects"
          className="justify-center"
        />

        <h2 className="mt-10 font-serif text-5xl leading-[1.05] text-bone md:text-7xl">
          The work doesn&apos;t live
          <span className="block text-ember italic">on this page.</span>
        </h2>

        <p className="mx-auto mt-8 max-w-lg text-base leading-relaxed text-muted">
          Every project — the tools, the systems, the experiments — waits behind
          the gate, in a world of its own. Step through when you&apos;re ready.
        </p>

        <a
          href="/arena"
          aria-disabled
          className="group mt-12 inline-flex items-center gap-4 border border-line px-8 py-4 font-mono text-xs tracking-[0.25em] text-bone uppercase transition-all duration-500 hover:border-ember hover:bg-ember/5"
        >
          Enter the Arena
          <span className="inline-block transition-transform duration-500 group-hover:translate-x-1.5 text-ember">
            →
          </span>
        </a>

        <p className="mt-5 font-mono text-[0.6rem] tracking-[0.25em] text-faint uppercase">
          Arena — under construction
        </p>
      </div>
    </section>
  );
}
