"use client";

/* ============================================================================
 *  ABOUT — Cinematic 560vh Scroll Experience
 *
 *  The section is a tall scroll container (same height as Hero).
 *  A sticky inner div pins a full-screen overlay to the viewport while
 *  the user scrolls through 4 cinematic acts.
 *
 *  Text cards swap between acts — each one fades in, holds, then fades out
 *  as the next begins. The Guts WebGL canvas (GutsStage) sits behind
 *  everything, driven by the same scroll progress via gutsState.
 *
 *  ACT I   — The Blade      (p 0.00→0.25)
 *  ACT II  — The Wound      (p 0.25→0.50)
 *  ACT III — The Silhouette (p 0.50→0.75)
 *  ACT IV  — The Face       (p 0.75→1.00)
 * ============================================================================ */

const ACTS = [
  {
    /* Part I — Ground level, back view, rising */
    cssVar: "--about-card1",
    kicker: "Part I  ·  The Stance",
    quote: "He stands with\nhis back to the world.\nAnd keeps walking.",
    lines: [
      "I don't show my direction — I walk it.",
      "Disciplined. Consistent. Always on the path.",
      "I get distracted. I always come back.",
    ],
    align: "left" as const,
  },
  {
    /* Part II — Rising along his back, shoulder/neck level */
    cssVar: "--about-card2",
    kicker: "Part II  ·  The Weight",
    quote: "Every wound\nis on his back.\nHe carries them.",
    lines: [
      "I love Berserk. I love Vagabond. I love stories of men who refuse to break.",
      "Full energy. All in. Every single time.",
      "I am infinite. I am still finding out how.",
    ],
    align: "right" as const,
  },
  {
    /* Part III — The rotation — side profile revealed */
    cssVar: "--about-card3",
    kicker: "Part III  ·  The Turn",
    quote: "He turns.\nNot for you.\nFor himself.",
    lines: [
      "Pranav Kokate — Final Year B.Tech Computer Science",
      "Thadomal Shahani Engineering College · Mumbai University",
      "Graduating 2027 · India",
    ],
    align: "center" as const,
  },
  {
    /* Part IV — Full body → eyes close-up */
    cssVar: "--about-card4",
    kicker: "Part IV  ·  The Path",
    quote: "I don't chase\nperfection.\nI find it in the hole.",
    lines: [
      "Backend · Systems · DevOps · DSA",
      "The depth is the point. The struggle is the point.",
      "My only competition is who I was yesterday.",
    ],
    align: "left" as const,
  },
];

/* ── Reticle corners — scan-lines at Act IV ─────────────────────────────── */
function ReticleCorners() {
  const corners = [
    "top-[12%] left-[7%]",
    "top-[12%] right-[7%]",
    "bottom-[12%] left-[7%]",
    "bottom-[12%] right-[7%]",
  ];
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20"
      style={{ opacity: "var(--about-card4, 0)" }}
    >
      {corners.map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos}`}
          style={{
            width: 22,
            height: 22,
            borderTop:    i < 2  ? "1px solid rgba(198,85,47,0.6)" : "none",
            borderBottom: i >= 2 ? "1px solid rgba(198,85,47,0.6)" : "none",
            borderLeft:   i % 2 === 0 ? "1px solid rgba(198,85,47,0.6)" : "none",
            borderRight:  i % 2 === 1 ? "1px solid rgba(198,85,47,0.6)" : "none",
          }}
        />
      ))}
      {/* Act label — bottom center */}
      <div
        className="absolute left-1/2 flex items-center gap-3"
        style={{ bottom: "13vh", transform: "translateX(-50%)" }}
      >
        <div className="h-px w-8" style={{ background: "rgba(198,85,47,0.5)" }} />
        <span
          className="font-mono text-[0.42rem] tracking-[0.42em] uppercase"
          style={{ color: "var(--color-ember)" }}
        >
          Close
        </span>
        <div className="h-px w-8" style={{ background: "rgba(198,85,47,0.5)" }} />
      </div>
    </div>
  );
}

/* ── Section number watermark ───────────────────────────────────────────── */
function SectionWatermark() {
  return (
    <div
      className="pointer-events-none absolute right-8 top-8 z-20 hidden md:flex flex-col items-end gap-1"
      style={{ opacity: "calc(var(--about-reveal, 0) * 0.6)" }}
    >
      <span
        className="font-mono text-[0.55rem] tracking-[0.45em] uppercase"
        style={{ color: "var(--color-ember)" }}
      >
        ● Section — 02
      </span>
      <span
        className="font-mono text-[0.48rem] tracking-[0.28em] uppercase"
        style={{ color: "var(--color-faint)" }}
      >
        About · The Path
      </span>
    </div>
  );
}

/* ── Single text card ───────────────────────────────────────────────────── */
function TextCard({
  act,
  index,
}: {
  act: (typeof ACTS)[0];
  index: number;
}) {
  const isCenter = act.align === "center";
  const isRight  = act.align === "right";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 flex items-center"
      style={{
        opacity: `var(${act.cssVar}, 0)`,
        transform: `translateY(calc((1 - var(${act.cssVar}, 0)) * 18px))`,
        transition: "none", // driven purely by scroll, no CSS transition
        justifyContent: isCenter ? "center" : isRight ? "flex-end" : "flex-start",
        padding: "0 6vw",
      }}
    >
      <div
        className="max-w-lg"
        style={{ textAlign: isCenter ? "center" : isRight ? "right" : "left" }}
      >
        {/* Kicker */}
        <p
          className="font-mono text-[0.6rem] tracking-[0.4em] uppercase mb-5"
          style={{ color: "var(--color-ember)" }}
        >
          {act.kicker}
        </p>

        {/* Index number — huge watermark */}
        <p
          className="font-serif leading-none tracking-tighter select-none mb-6"
          style={{
            fontSize: "clamp(5rem, 14vw, 11rem)",
            color: "rgba(198,85,47,0.22)",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </p>

        {/* Quote — the hero statement */}
        <blockquote
          className="font-serif leading-tight text-bone"
          style={{ fontSize: "clamp(1.6rem, 3.8vw, 3rem)", whiteSpace: "pre-line" }}
        >
          {act.quote}
        </blockquote>

        {/* Divider */}
        <div
          className="my-6"
          style={{
            height: 1,
            background: `linear-gradient(to ${isRight ? "left" : "right"}, var(--color-ember), transparent)`,
            opacity: 0.4,
          }}
        />

        {/* Info lines */}
        <div className="space-y-2">
          {act.lines.map((line, li) => (
            <p
              key={li}
              className="font-sans text-sm leading-relaxed"
              style={{
                color: li === 0 ? "var(--color-bone)" : "var(--color-muted)",
                fontWeight: li === 0 ? 500 : 400,
              }}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Scroll hint — Act I only ───────────────────────────────────────────── */
function ScrollHint() {
  return (
    <div
      className="pointer-events-none absolute bottom-8 left-1/2 z-20 flex flex-col items-center gap-2"
      style={{
        transform: "translateX(-50%)",
        opacity: "calc(var(--about-card1, 0) * 0.7)",
      }}
    >
      <span
        className="font-mono text-[0.48rem] tracking-[0.32em] uppercase"
        style={{ color: "var(--color-faint)" }}
      >
        Scroll to advance
      </span>
      <span
        className="h-10 w-px animate-pulse"
        style={{ background: "linear-gradient(to bottom, var(--color-ember), transparent)" }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 *  MAIN EXPORT
 * ══════════════════════════════════════════════════════════════════════════ */
export default function About() {
  return (
    <section
      id="about"
      className="relative h-[560vh] w-full"
      aria-label="About Pranav Kokate"
    >
      {/* Sticky viewport — everything inside here is pinned while scrolling */}
      <div className="sticky top-0 flex h-screen w-full items-center overflow-hidden">

        {/* ── Letterbox bars — slide in at Act IV ──────────────────── */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 z-40"
          style={{
            height: "11.5vh",
            background: "#000",
            opacity: "calc(var(--about-bars, 0) * 0.97)",
            transform: "translateY(calc((1 - var(--about-bars, 0)) * -100%))",
          }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-40"
          style={{
            height: "11.5vh",
            background: "#000",
            opacity: "calc(var(--about-bars, 0) * 0.97)",
            transform: "translateY(calc((1 - var(--about-bars, 0)) * 100%))",
          }}
        />

        {/* ── Vignette ─────────────────────────────────────────────── */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.95) 100%)",
            opacity: "calc(var(--about-vignette, 0) * 0.9)",
          }}
        />

        {/* ── Section reveal fade-in layer ──────────────────────────── */}
        <div
          className="pointer-events-none absolute inset-0 z-5"
          style={{
            background: "var(--color-ink)",
            opacity: `calc(1 - var(--about-reveal, 0))`,
          }}
        />

        {/* ── Section watermark ────────────────────────────────────── */}
        <SectionWatermark />

        {/* ── Reticle corners (Act IV) ─────────────────────────────── */}
        <ReticleCorners />

        {/* ── Scroll hint ──────────────────────────────────────────── */}
        <ScrollHint />

        {/* ── 4 Text Cards ─────────────────────────────────────────── */}
        {ACTS.map((act, i) => (
          <TextCard key={act.kicker} act={act} index={i} />
        ))}

        {/* ── Act progress dots — right rail ───────────────────────── */}
        <div
          className="pointer-events-none absolute right-6 top-1/2 z-30 flex flex-col gap-3 -translate-y-1/2 hidden md:flex"
          style={{ opacity: "calc(var(--about-reveal, 0) * 0.8)" }}
        >
          {ACTS.map((act, i) => {
            const vars = ["--about-card1", "--about-card2", "--about-card3", "--about-card4"];
            return (
              <div
                key={i}
                className="h-px transition-none"
                style={{
                  width: `calc(8px + var(${vars[i]}, 0) * 20px)`,
                  background: `rgba(198, 85, 47, calc(0.3 + var(${vars[i]}, 0) * 0.7))`,
                }}
              />
            );
          })}
        </div>

      </div>
    </section>
  );
}
