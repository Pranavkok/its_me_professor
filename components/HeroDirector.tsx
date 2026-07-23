"use client";

import { useEffect } from "react";
import { heroState } from "@/lib/heroState";

/**
 * HeroDirector — 560vh hero section scroll → CSS variables.
 *
 * TEXT REVEAL TIMELINE (text appears as character comes into full view):
 *   p 0.34→0.42  --hero-reveal    gradient behind text fades in
 *   p 0.38→0.46  --hero-r1        kicker "Portfolio · 2026"
 *   p 0.46→0.55  --hero-r2        name "Pranav / Kokate"
 *   p 0.54→0.63  --hero-r3        subtitle tags line
 *   p 0.62→0.72  --hero-r4        bio paragraph
 *
 * All text is fully visible by p ≈ 0.72 — well before the close-up.
 * The cinematic close-up zoom (p 0.70→1.0) happens WITH text already showing.
 *
 * CINEMATIC OVERLAYS:
 *   p 0.06→0.20  --hero-cinema-bars   letterbox bars slide in
 *   p 0.10→0.55  --hero-vignette      corner vignette
 *   p 0.04→0.16  --hero-phase1-out    overview label fades out
 *   p 0.22→0.50  --hero-phase2        reticle + tags
 *   p 0.68→0.90  --hero-closeup       close-up marker
 */
export default function HeroDirector() {
  useEffect(() => {
    const root = document.documentElement;
    let ticking = false;

    const remap = (v: number, lo: number, hi: number) =>
      Math.min(1, Math.max(0, (v - lo) / (hi - lo)));

    const compute = () => {
      ticking = false;
      const hero = document.getElementById("hero");
      if (!hero) return;

      const len = Math.max(1, hero.offsetHeight - window.innerHeight);
      const raw = (window.scrollY - hero.offsetTop) / len;
      const p   = Math.min(1, Math.max(0, raw));

      heroState.p   = p;
      heroState.raw = raw;

      /* ── Cinematic overlays ───────────────────────────────────── */
      const phase1Out  = remap(p, 0.04, 0.16);
      const cinemaBars = remap(p, 0.06, 0.20);
      const vignette   = remap(p, 0.10, 0.55);
      const phase2     = remap(p, 0.22, 0.50);
      const closeupIn  = remap(p, 0.68, 0.78);
      const closeupOut = remap(p, 0.84, 0.92);
      const closeup    = closeupIn * (1 - closeupOut);

      /* ── Staggered text reveal — one element at a time ──────────
       *  Starts at p=0.38 (character visible as a full figure).
       *  Each element slides up and fades in, 0.08 p-units apart.
       *  All text done by p=0.72 — before the close-up zoom.
       * ─────────────────────────────────────────────────────────── */
      const gradientReveal = remap(p, 0.34, 0.43); // gradient behind text
      const r1 = remap(p, 0.38, 0.47); // kicker
      const r2 = remap(p, 0.46, 0.56); // name heading
      const r3 = remap(p, 0.55, 0.64); // subtitle / tags
      const r4 = remap(p, 0.63, 0.73); // bio paragraph

      root.style.setProperty("--hero",             p.toFixed(4));
      root.style.setProperty("--hero-phase1-out",  phase1Out.toFixed(4));
      root.style.setProperty("--hero-cinema-bars", cinemaBars.toFixed(4));
      root.style.setProperty("--hero-vignette",    vignette.toFixed(4));
      root.style.setProperty("--hero-phase2",      phase2.toFixed(4));
      root.style.setProperty("--hero-closeup",     closeup.toFixed(4));
      root.style.setProperty("--hero-reveal",      gradientReveal.toFixed(4));
      root.style.setProperty("--hero-r1",          r1.toFixed(4));
      root.style.setProperty("--hero-r2",          r2.toFixed(4));
      root.style.setProperty("--hero-r3",          r3.toFixed(4));
      root.style.setProperty("--hero-r4",          r4.toFixed(4));
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(compute);
      }
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", compute);
    };
  }, []);

  return null;
}
