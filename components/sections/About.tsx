import ModelStage from "@/components/ModelStage";
import SectionHeader from "@/components/SectionHeader";

const META = [
  ["Based in", "India"],
  ["Discipline", "Computer Engineering"],
  ["Focus", "Backend · Systems · DSA"],
  ["Reading", "Vagabond — Musashi's path"],
];

export default function About() {
  return (
    <section
      id="about"
      className="relative mx-auto max-w-6xl scroll-mt-24 px-6 py-28 md:px-10 md:py-40"
    >
      <SectionHeader n="02" kicker="About — The Path" title="About" />

      <div className="mt-16 grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
        {/* second model — a lone ronin / resting blade */}
        <ModelStage
          model="ronin.glb"
          className="min-h-[420px] md:sticky md:top-28 md:min-h-[560px]"
        >
          <span className="font-mono text-[0.7rem] tracking-[0.25em] text-faint uppercase">
            [ ink dissolve → contemplative figure ]
          </span>
        </ModelStage>

        <div>
          <p className="font-serif text-3xl leading-snug text-bone md:text-[2.6rem]">
            I am not an expert who has already arrived. I am a young engineer
            who has chosen a{" "}
            <span className="text-ember italic">direction</span> — and is trying
            to walk it seriously.
          </p>

          <div className="mt-10 space-y-5 text-base leading-relaxed text-muted">
            <p>
              I&apos;m a Computer Engineering student from India, deeply
              ambitious about becoming an exceptional software engineer — not
              just employable, but genuinely good. I want to understand computer
              science deeply, build real systems, and solve difficult problems.
            </p>
            <p>
              I&apos;m drawn to what lives underneath the abstractions: backend
              engineering, system design, distributed systems, databases, and
              the fundamentals. When I learn something, I want the reasoning
              behind it — why it was designed that way, what happens internally,
              what trade-offs were made.
            </p>
            <p>
              I treat DSA like a sport, and I have a builder&apos;s reflex: see
              a problem, start imagining what I could build to solve it. My
              deepest competition is with who I was yesterday.
            </p>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-line pt-8">
            {META.map(([k, v]) => (
              <div key={k}>
                <dt className="kicker">{k}</dt>
                <dd className="mt-2 font-sans text-sm text-bone">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
