export default function Hero() {
  return (
    <section id="hero" className="relative h-[560vh] w-full">
      <div className="sticky top-0 flex h-screen w-full items-center overflow-hidden">

        {/* ── Cinematic letterbox bars ── */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 z-30"
          style={{
            height: '11.5vh', background: '#000',
            opacity: 'calc(var(--hero-cinema-bars, 0) * 0.97)',
            transform: 'translateY(calc((1 - var(--hero-cinema-bars, 0)) * -100%))',
          }} />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-30"
          style={{
            height: '11.5vh', background: '#000',
            opacity: 'calc(var(--hero-cinema-bars, 0) * 0.97)',
            transform: 'translateY(calc((1 - var(--hero-cinema-bars, 0)) * 100%))',
          }} />

        {/* ── Vignette ── */}
        <div className="pointer-events-none absolute inset-0 z-10"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.92) 100%)',
            opacity: 'calc(var(--hero-vignette, 0) * 0.85)',
          }} />

        {/* ── Overview label ── */}
        <div
          className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-4"
          style={{ opacity: 'calc(1 - var(--hero-phase1-out, 0))' }}
        >
          <span className="font-mono text-[0.55rem] tracking-[0.45em] uppercase" style={{ color: 'var(--color-ember)' }}>
            ● In — Becoming
          </span>
          <span className="font-mono text-[0.52rem] tracking-[0.28em] uppercase" style={{ color: 'var(--color-faint)' }}>
            Scroll to approach
          </span>
          <span className="h-14 w-px animate-pulse mt-2"
            style={{ background: 'linear-gradient(to bottom, var(--color-ember), transparent)' }} />
        </div>

        {/* ── Scan reticle ── */}
        <div className="pointer-events-none absolute inset-0 z-20" style={{ opacity: 'var(--hero-phase2, 0)' }}>

          {[
            'top-[14%] left-[10%]', 'top-[14%] right-[10%]',
            'bottom-[14%] left-[10%]', 'bottom-[14%] right-[10%]',
          ].map((pos, i) => (
            <div key={i} className={`absolute ${pos}`} style={{
              width: 20, height: 20,
              borderTop:    i < 2  ? '1px solid rgba(198,85,47,0.55)' : 'none',
              borderBottom: i >= 2 ? '1px solid rgba(198,85,47,0.55)' : 'none',
              borderLeft:   i % 2 === 0 ? '1px solid rgba(198,85,47,0.55)' : 'none',
              borderRight:  i % 2 === 1 ? '1px solid rgba(198,85,47,0.55)' : 'none',
            }} />
          ))}

          <div className="absolute right-6 top-1/2 flex flex-col items-end gap-1.5" style={{ transform: 'translateY(-50%)' }}>
            {['Backend Engineer', 'Systems Architect', 'Still Becoming'].map((tag, i) => (
              <span key={tag} className="font-mono text-[0.5rem] tracking-[0.15em] uppercase"
                style={{ color: i === 0 ? 'var(--color-ember-soft)' : 'var(--color-faint)' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── Close-up marker ── */}
        <div className="pointer-events-none absolute z-20 flex items-center gap-3"
          style={{ bottom: '13.5vh', left: '50%', transform: 'translateX(-50%)', opacity: 'var(--hero-closeup, 0)' }}>
          <div className="h-px w-6" style={{ background: 'rgba(198,85,47,0.5)' }} />
          <span className="font-mono text-[0.44rem] tracking-[0.4em] uppercase" style={{ color: 'var(--color-ember)' }}>Close</span>
          <div className="h-px w-6" style={{ background: 'rgba(198,85,47,0.5)' }} />
        </div>

        {/* ── Background gradient (behind text) ── */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-transparent"
          style={{ opacity: 'calc(var(--hero-reveal, 0) * 0.95)', zIndex: 15 }} />

        {/* ══════════════════════════════════════════════════════════
            STAGGERED TEXT — one element at a time.
            Each element has its own var, 0.08 p-units apart.
            All done by p=0.72, before the close-up zoom.
            ══════════════════════════════════════════════════════════ */}
        <div className="relative px-6 md:px-10 max-w-2xl flex flex-col" style={{ zIndex: 20 }}>

          {/* 1 — Kicker */}
          <p
            className="kicker"
            style={{
              opacity: 'var(--hero-r1, 0)',
              transform: 'translateY(calc((1 - var(--hero-r1, 0)) * 22px))',
            }}
          >
            Portfolio · 2026
          </p>

          {/* 2 — Name */}
          <h1
            className="mt-5 font-serif text-[15vw] leading-[0.87] tracking-[-0.03em] text-bone md:text-[8.5vw]"
            style={{
              opacity: 'var(--hero-r2, 0)',
              transform: 'translateY(calc((1 - var(--hero-r2, 0)) * 28px))',
            }}
          >
            <span className="block">Pranav</span>
            <span className="block italic text-muted">Kokate</span>
          </h1>

          {/* 3 — Subtitle tags */}
          <div
            className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.68rem] tracking-[0.2em] text-muted uppercase"
            style={{
              opacity: 'var(--hero-r3, 0)',
              transform: 'translateY(calc((1 - var(--hero-r3, 0)) * 22px))',
            }}
          >
            <span className="text-ember">Backend / Systems Engineer</span>
            <span className="h-1 w-1 rounded-full bg-faint" />
            <span>India</span>
            <span className="h-1 w-1 rounded-full bg-faint" />
            <span>Still Becoming</span>
          </div>

          {/* 4 — Bio */}
          <p
            className="mt-7 max-w-sm font-sans text-sm leading-relaxed text-muted"
            style={{
              opacity: 'var(--hero-r4, 0)',
              transform: 'translateY(calc((1 - var(--hero-r4, 0)) * 22px))',
            }}
          >
            Building real systems, one deliberate step at a time. I care less
            about titles and more about the path — and the person I become while
            walking it.
          </p>

        </div>
      </div>
    </section>
  );
}
