"use client";

import { useEffect } from "react";
import { gutsState } from "@/lib/gutsState";

/**
 * AboutDirector — maps About section scroll progress → CSS variables.
 *
 * SECTION HEIGHT: 560vh (same as Hero for cinematic continuity).
 *
 * ACTS (each ~25% of scroll range):
 *   Act I   p 0.00→0.25  --about-act1   Sword focus
 *   Act II  p 0.25→0.50  --about-act2   Wound / face scar
 *   Act III p 0.50→0.75  --about-act3   Full silhouette
 *   Act IV  p 0.75→1.00  --about-act4   Face close-up
 *
 * TEXT CARD TRANSITIONS (each card fades in then out):
 *   Card 1 fades IN at p=0.02→0.08, OUT at p=0.20→0.26
 *   Card 2 fades IN at p=0.27→0.33, OUT at p=0.45→0.51
 *   Card 3 fades IN at p=0.52→0.58, OUT at p=0.70→0.76
 *   Card 4 fades IN at p=0.77→0.83, stays IN through end
 *
 * CINEMATIC OVERLAYS:
 *   p 0.00→0.08  --about-reveal      section fade-in
 *   p 0.72→0.84  --about-bars        letterbox bars (Act IV)
 *   p 0.05→0.30  --about-vignette    vignette strength
 */
export default function AboutDirector() {
  useEffect(() => {
    const root = document.documentElement;
    let ticking = false;

    const remap = (v: number, lo: number, hi: number) =>
      Math.min(1, Math.max(0, (v - lo) / (hi - lo)));

    const compute = () => {
      ticking = false;
      const section = document.getElementById("about");
      if (!section) return;

      const len = Math.max(1, section.offsetHeight - window.innerHeight);
      const raw = (window.scrollY - section.offsetTop) / len;
      const p   = Math.min(1, Math.max(0, raw));

      gutsState.p   = p;
      gutsState.raw = raw;
      gutsState.visible = raw > -0.15 && raw < 1.25;

      /* ── Section reveal ──────────────────────────────────────── */
      const reveal   = remap(p, 0.00, 0.08);

      /* ── Letterbox bars — only Act IV ────────────────────────── */
      const bars     = remap(p, 0.72, 0.84);

      /* ── Vignette ─────────────────────────────────────────────── */
      const vignette = remap(p, 0.05, 0.35);

      /* ── Text card alphas ─────────────────────────────────────── */
      // Each card: fade in then fade out (except card 4 which stays)
      const c1in  = remap(p, 0.02, 0.09);
      const c1out = remap(p, 0.20, 0.27);
      const card1 = c1in * (1 - c1out);

      const c2in  = remap(p, 0.27, 0.34);
      const c2out = remap(p, 0.45, 0.52);
      const card2 = c2in * (1 - c2out);

      const c3in  = remap(p, 0.52, 0.59);
      const c3out = remap(p, 0.70, 0.77);
      const card3 = c3in * (1 - c3out);

      const c4in  = remap(p, 0.77, 0.84);
      const card4 = c4in;

      /* ── Canvas visibility (section fade in/out) ──────────────── */
      const canvasIn  = remap(raw, -0.10, 0.03);
      const canvasOut = remap(raw,  0.97, 1.10);
      const canvas    = canvasIn * (1 - canvasOut);

      root.style.setProperty("--about-p",       p.toFixed(4));
      root.style.setProperty("--about-reveal",  reveal.toFixed(4));
      root.style.setProperty("--about-bars",    bars.toFixed(4));
      root.style.setProperty("--about-vignette",vignette.toFixed(4));
      root.style.setProperty("--about-card1",   card1.toFixed(4));
      root.style.setProperty("--about-card2",   card2.toFixed(4));
      root.style.setProperty("--about-card3",   card3.toFixed(4));
      root.style.setProperty("--about-card4",   card4.toFixed(4));
      root.style.setProperty("--about-canvas",  canvas.toFixed(4));
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
