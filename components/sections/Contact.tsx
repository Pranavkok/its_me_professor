"use client";

import { useEffect, useRef, useState } from "react";
import IfritStage from "@/components/three/IfritStage";

/* ============================================================================
 *  CONTACT — "Through Fire"
 *
 *  600vh sticky scroll. Ifrit fills the entire background.
 *  5 stops:
 *    0  GitHub       (0.00–0.19)
 *    1  LinkedIn     (0.20–0.38)
 *    2  LeetCode     (0.39–0.57)
 *    3  GeeksForGeeks(0.58–0.76)
 *    4  Contact form (0.77–1.00)
 *
 *  Each profile card flies in from a unique direction.
 *  When the next stop begins the previous card burns away.
 * ============================================================================ */

/* ── Profile data — fill in your real handles ──────────────────────── */
const PROFILES = [
  {
    id:      "github",
    label:   "GitHub",
    handle:  "@PranavKokate",
    href:    "https://github.com/PranavKokate",
    stat:    "Repositories & open source",
    icon:    GH,
    color:   "#e2e8f0",
    glow:    "rgba(226,232,240,0.12)",
    from:    "translateY(-80px) scale(0.88)",    // flies in from top
    accentBg:"rgba(255,255,255,0.04)",
  },
  {
    id:      "linkedin",
    label:   "LinkedIn",
    handle:  "@pranavkokate",
    href:    "https://linkedin.com/in/pranavkokate",
    stat:    "Professional network",
    icon:    LI,
    color:   "#60a5fa",
    glow:    "rgba(96,165,250,0.14)",
    from:    "translateX(90px) scale(0.88)",    // flies in from right
    accentBg:"rgba(96,165,250,0.05)",
  },
  {
    id:      "leetcode",
    label:   "LeetCode",
    handle:  "@pranavkokate",
    href:    "https://leetcode.com/pranavkokate",
    stat:    "Problem solving · DSA",
    icon:    LC,
    color:   "#fbbf24",
    glow:    "rgba(251,191,36,0.14)",
    from:    "translateY(80px) scale(0.88)",    // flies in from bottom
    accentBg:"rgba(251,191,36,0.05)",
  },
  {
    id:      "gfg",
    label:   "GeeksForGeeks",
    handle:  "@pranavkokate",
    href:    "https://geeksforgeeks.org/user/pranavkokate",
    stat:    "CS fundamentals · articles",
    icon:    GFG,
    color:   "#34d399",
    glow:    "rgba(52,211,153,0.14)",
    from:    "translateX(-90px) scale(0.88)",   // flies in from left
    accentBg:"rgba(52,211,153,0.05)",
  },
];

/* Stop boundaries (inclusive) */
const STOPS = [0.19, 0.38, 0.57, 0.76];   // profile i visible when scroll ≤ STOPS[i]
                                            // contact form when scroll > STOPS[3]

/* ── SVG Icons ─────────────────────────────────────────────────────── */
function GH() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="44" height="44">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}
function LI() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="44" height="44">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}
function LC() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="44" height="44">
      <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
    </svg>
  );
}
function GFG() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="44" height="44">
      <path d="M21.45 14.315c-.143.28-.334.532-.565.745a3.691 3.691 0 0 1-1.104.695 4.51 4.51 0 0 1-3.116-.016 3.79 3.79 0 0 1-1.284-.865L12 11.696l-3.38 3.178a3.79 3.79 0 0 1-1.283.865 4.51 4.51 0 0 1-3.117.016 3.69 3.69 0 0 1-1.104-.695 3.088 3.088 0 0 1-.565-.745 3.37 3.37 0 0 1-.55-1.315v-.24h2.25a1.3 1.3 0 0 0 .57 1.09c.15.095.317.163.49.2a2.2 2.2 0 0 0 1.43-.12 1.9 1.9 0 0 0 .69-.49L12 10.255l4.568 4.3a1.9 1.9 0 0 0 .69.49 2.2 2.2 0 0 0 1.43.12 1.28 1.28 0 0 0 .49-.2 1.3 1.3 0 0 0 .57-1.09h2.25v.24a3.37 3.37 0 0 1-.548 1.2zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2z"/>
    </svg>
  );
}

/* ── Scroll-progress hook ───────────────────────────────────────────── */
function useContactScroll() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const section = document.getElementById("contact");
    if (!section) return;
    const onScroll = () => {
      const r = section.getBoundingClientRect();
      const travel = r.height - window.innerHeight;
      setProgress(Math.max(0, Math.min(1, -r.top / travel)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return progress;
}

/* ── Which "stop" are we on? ────────────────────────────────────────── */
function getStop(progress: number): number {
  if (progress <= STOPS[0]) return 0;
  if (progress <= STOPS[1]) return 1;
  if (progress <= STOPS[2]) return 2;
  if (progress <= STOPS[3]) return 3;
  return 4; // contact form
}

/* ── Profile local progress (0→1 within its own stop window) ───────── */
function stopProgress(stopIdx: number, progress: number): number {
  const lo = stopIdx === 0 ? 0 : STOPS[stopIdx - 1];
  const hi = STOPS[stopIdx] ?? 1;
  return Math.max(0, Math.min(1, (progress - lo) / (hi - lo)));
}

/* ── ContactForm component ──────────────────────────────────────────── */
function ContactForm({ visible }: { visible: boolean }) {
  const [sent, setSent] = useState(false);
  return (
    <div
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? "none" : "translateY(60px) scale(0.95)",
        transition: "opacity 1.1s cubic-bezier(.16,1,.3,1), transform 1.1s cubic-bezier(.16,1,.3,1)",
        pointerEvents: visible ? "all" : "none",
      }}
      className="w-full max-w-lg mx-auto"
    >
      {/* Glass card */}
      <div
        className="relative rounded-2xl p-8 md:p-10"
        style={{
          background:    "rgba(13,6,0,0.72)",
          border:        "1px solid rgba(255,100,20,0.22)",
          backdropFilter:"blur(24px)",
          boxShadow:     "0 0 60px rgba(255,80,0,0.12), 0 0 0 1px rgba(255,100,20,0.08) inset",
        }}
      >
        {/* Fire glow top */}
        <div
          className="pointer-events-none absolute -top-px inset-x-8 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(255,100,20,0.6), transparent)" }}
        />

        <p className="font-mono text-[0.62rem] tracking-[0.4em] uppercase mb-2" style={{ color:"rgba(255,120,40,0.7)" }}>
          06 · Cross Paths
        </p>
        <h2 className="font-serif text-3xl md:text-4xl text-bone mb-2 leading-tight">
          Let&apos;s build something <span style={{ color:"#ff6422" }} className="italic">worth burning for.</span>
        </h2>
        <p className="text-sm text-muted mb-8 max-w-sm">
          An idea, an opportunity, or just a conversation about systems and craft.
        </p>

        <form
          className="space-y-5"
          onSubmit={e => { e.preventDefault(); setSent(true); }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Name"  id="cf-name"  type="text"  placeholder="Your name" />
            <FormField label="Email" id="cf-email" type="email" placeholder="you@domain.com" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[0.65rem] tracking-[0.28em] uppercase" style={{ color:"rgba(255,120,40,0.6)" }} htmlFor="cf-msg">
              Message
            </label>
            <textarea
              id="cf-msg" name="message" rows={4} required
              placeholder="Say something worth reading."
              className="resize-none bg-transparent py-3 text-bone placeholder:text-faint focus:outline-none"
              style={{ borderBottom: "1px solid rgba(255,100,20,0.3)" }}
            />
          </div>

          <button
            type="submit"
            className="group inline-flex items-center gap-4 px-8 py-4 font-mono text-xs tracking-[0.25em] uppercase text-bone transition-all duration-500"
            style={{
              border:    "1px solid rgba(255,100,20,0.35)",
              background:"rgba(255,80,0,0.06)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,80,0,0.14)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,100,20,0.7)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow   = "0 0 24px rgba(255,80,0,0.2)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,80,0,0.06)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,100,20,0.35)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow   = "none";
            }}
          >
            {sent ? "Message sent ✓" : "Send message"}
            <span className="transition-transform duration-500 group-hover:translate-x-1.5" style={{ color:"#ff6422" }}>→</span>
          </button>
          {sent && (
            <p className="font-mono text-[0.6rem] tracking-[0.2em] text-faint uppercase">
              (UI only — endpoint wiring coming soon)
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="mt-10 pt-6 flex items-center justify-between" style={{ borderTop:"1px solid rgba(255,100,20,0.12)" }}>
          <span className="font-serif text-lg text-bone">nexious<span style={{ color:"#ff6422" }}>.</span></span>
          <span className="font-mono text-[0.58rem] tracking-[0.2em] text-faint uppercase">Pranav Kokate · 2026</span>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, id, type, placeholder }: { label: string; id: string; type: string; placeholder: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-mono text-[0.65rem] tracking-[0.28em] uppercase" style={{ color:"rgba(255,120,40,0.6)" }} htmlFor={id}>{label}</label>
      <input
        id={id} name={id} type={type} required placeholder={placeholder}
        className="bg-transparent py-3 text-bone placeholder:text-faint focus:outline-none"
        style={{ borderBottom:"1px solid rgba(255,100,20,0.3)" }}
      />
    </div>
  );
}

/* ── Profile card ───────────────────────────────────────────────────── */
function ProfileCard({ p, active, incoming }: {
  p: typeof PROFILES[0];
  active: boolean;
  incoming: boolean;
}) {
  const Icon = p.icon;
  return (
    <a
      href={p.href}
      target="_blank"
      rel="noreferrer"
      style={{
        position:   "absolute",
        inset:      0,
        display:    "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity:    active ? 1 : 0,
        transform:  active ? "none" : incoming ? p.from : "scale(1.06) translateY(-20px)",
        transition: "opacity 0.85s cubic-bezier(.16,1,.3,1), transform 0.85s cubic-bezier(.16,1,.3,1)",
        pointerEvents: active ? "all" : "none",
        textDecoration: "none",
      }}
    >
      <div
        className="relative rounded-2xl p-8 md:p-12 flex flex-col items-center text-center gap-6"
        style={{
          width:         "min(440px, 92vw)",
          background:    `rgba(13,6,0,0.68)`,
          border:        `1px solid ${p.color}22`,
          backdropFilter:"blur(28px)",
          boxShadow:     `0 0 80px ${p.glow}, 0 0 0 1px ${p.color}10 inset`,
        }}
      >
        {/* Top accent line */}
        <div
          className="pointer-events-none absolute -top-px inset-x-12 h-px"
          style={{ background: `linear-gradient(to right, transparent, ${p.color}80, transparent)` }}
        />
        {/* Icon */}
        <div style={{ color: p.color, filter: `drop-shadow(0 0 12px ${p.color}88)` }}>
          <Icon />
        </div>
        {/* Label */}
        <div>
          <p className="font-mono text-[0.65rem] tracking-[0.45em] uppercase mb-2" style={{ color:`${p.color}99` }}>
            {p.stat}
          </p>
          <h3 className="font-serif text-4xl md:text-5xl text-bone mb-1">{p.label}</h3>
          <p className="font-mono text-sm tracking-wide" style={{ color:`${p.color}cc` }}>
            {p.handle}
          </p>
        </div>
        {/* CTA */}
        <div
          className="font-mono text-xs tracking-[0.28em] uppercase px-6 py-3 transition-all duration-300"
          style={{
            border:    `1px solid ${p.color}44`,
            color:     p.color,
            background:`${p.accentBg}`,
          }}
        >
          View Profile →
        </div>
        {/* Bottom glow */}
        <div
          className="pointer-events-none absolute -bottom-px inset-x-12 h-px"
          style={{ background: `linear-gradient(to right, transparent, ${p.color}40, transparent)` }}
        />
      </div>
    </a>
  );
}

/* ── Progress dots ──────────────────────────────────────────────────── */
function Dots({ stop }: { stop: number }) {
  const labels = ["GitHub", "LinkedIn", "LeetCode", "GFG", "Contact"];
  return (
    <div
      className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3 items-center"
      style={{ opacity: 0.85 }}
    >
      {labels.map((l, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            style={{
              width:      stop === i ? 10 : 5,
              height:     stop === i ? 10 : 5,
              borderRadius: "50%",
              background: stop === i ? "#ff6422" : "rgba(255,100,34,0.25)",
              transition: "all 0.5s cubic-bezier(.16,1,.3,1)",
              boxShadow:  stop === i ? "0 0 10px #ff6422aa" : "none",
            }}
          />
          <span
            className="font-mono text-[0.55rem] tracking-[0.3em] uppercase hidden md:block"
            style={{ color: stop === i ? "#ff6422" : "rgba(255,100,34,0.3)", transition:"color 0.5s" }}
          >
            {l}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Scroll hint ────────────────────────────────────────────────────── */
function ScrollHint({ visible }: { visible: boolean }) {
  return (
    <div
      className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2"
      style={{ opacity: visible ? 0.6 : 0, transition: "opacity 1s" }}
    >
      <span className="font-mono text-[0.55rem] tracking-[0.4em] uppercase text-muted">Scroll to meet me</span>
      <div className="w-px h-8 overflow-hidden relative">
        <div
          className="w-full h-full"
          style={{
            background:  "linear-gradient(to bottom, #ff6422, transparent)",
            animation:   "ifrit-scroll-line 1.8s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

/* ── Main section ───────────────────────────────────────────────────── */
export default function Contact() {
  const progress = useContactScroll();
  const stop     = getStop(progress);

  return (
    <>
      {/* Keyframe for scroll hint line */}
      <style>{`
        @keyframes ifrit-scroll-line {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>

      <section
        id="contact"
        style={{ height: "600vh" }}
        className="relative w-full"
      >
        {/* ── Sticky viewport ──────────────────────────────────────────── */}
        <div className="sticky top-0 w-full h-screen overflow-hidden">

          {/* Full-bleed Ifrit */}
          <div className="absolute inset-0 z-0">
            <IfritStage />
          </div>

          {/* Top fade */}
          <div
            className="pointer-events-none absolute top-0 inset-x-0 z-10"
            style={{ height:"20%", background:"linear-gradient(to bottom, rgba(8,4,0,1) 0%, transparent 100%)" }}
          />
          {/* Bottom fade */}
          <div
            className="pointer-events-none absolute bottom-0 inset-x-0 z-10"
            style={{ height:"20%", background:"linear-gradient(to top, rgba(8,4,0,1) 0%, transparent 100%)" }}
          />
          {/* Radial vignette */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{ background:"radial-gradient(ellipse 75% 85% at center, transparent 40%, rgba(6,3,0,0.80) 100%)" }}
          />

          {/* Progress dots */}
          <Dots stop={stop} />

          {/* Scroll hint — only on first stop */}
          <ScrollHint visible={stop === 0 && progress < 0.08} />

          {/* ── Profile cards — stacked absolutely, one active at a time ── */}
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            {PROFILES.map((p, i) => (
              <ProfileCard
                key={p.id}
                p={p}
                active={stop === i}
                incoming={stop < i}   // card yet to arrive comes from its FROM direction
              />
            ))}

            {/* Contact form — final stop */}
            <div
              style={{
                position:   "absolute",
                inset:      0,
                display:    "flex",
                alignItems: "center",
                justifyContent:"center",
                padding:    "24px",
                overflowY:  "auto",
              }}
            >
              <ContactForm visible={stop === 4} />
            </div>
          </div>

          {/* Section label — top-left */}
          <div
            className="absolute top-8 left-6 md:left-10 z-30"
            style={{ opacity: 0.5 }}
          >
            <p className="font-mono text-[0.58rem] tracking-[0.4em] uppercase" style={{ color:"rgba(255,100,34,0.7)" }}>
              <span style={{ color:"#ff6422" }}>●</span>&nbsp;&nbsp;06 · Through Fire
            </p>
          </div>

        </div>
      </section>
    </>
  );
}
