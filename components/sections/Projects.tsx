"use client";

import { useEffect, useRef, useState } from "react";
import LostRobotStage from "@/components/three/LostRobotStage";

/* ============================================================================
 *  PROJECTS — Pure immersion. No text. Just the world and one door.
 *
 *  The section is 300vh tall so scroll drives the camera deeply through
 *  the scene. The button appears only after the user has journeyed inward.
 * ============================================================================ */

export default function Projects() {
  const sectionRef  = useRef<HTMLElement>(null);
  const [btnVisible, setBtnVisible] = useState(false);

  /* Reveal button once user has scrolled ≥ 40% into the section */
  useEffect(() => {
    const onScroll = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect     = section.getBoundingClientRect();
      const progress = 1 - (rect.bottom - window.innerHeight) / rect.height;
      if (progress >= 0.38) setBtnVisible(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      id="projects"
      ref={sectionRef}
      /* 300vh — scroll IS the animation timeline */
      style={{ height: "300vh" }}
      className="projects-section relative w-full"
    >
      {/* ── Sticky viewport that holds the immersive world ─────────────── */}
      <div className="sticky top-0 w-full h-screen overflow-hidden">

        {/* Full-bleed 3D world */}
        <div className="absolute inset-0 z-0">
          <LostRobotStage />
        </div>

        {/* Top fade — bleeds into section above */}
        <div
          className="pointer-events-none absolute top-0 inset-x-0 z-10"
          style={{
            height: "18%",
            background: "linear-gradient(to bottom, rgba(5,10,5,1) 0%, transparent 100%)",
          }}
        />

        {/* Bottom fade */}
        <div
          className="pointer-events-none absolute bottom-0 inset-x-0 z-10"
          style={{
            height: "18%",
            background: "linear-gradient(to top, rgba(5,10,5,1) 0%, transparent 100%)",
          }}
        />

        {/* Radial vignette — soft edges */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 90% at center, transparent 45%, rgba(3,8,3,0.75) 100%)",
          }}
        />

        {/* ── Sole UI element — the door ────────────────────────────────── */}
        <div
          className="absolute inset-0 z-20 flex items-end justify-center pb-16"
          style={{
            opacity:    btnVisible ? 1 : 0,
            transform:  btnVisible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 1.2s cubic-bezier(.16,1,.3,1), transform 1.2s cubic-bezier(.16,1,.3,1)",
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <a
              href="/arena"
              id="enter-arena-btn"
              className="arena-btn group relative inline-flex items-center gap-5 overflow-hidden px-10 py-5 font-mono text-xs tracking-[0.32em] uppercase"
            >
              <span className="arena-btn-border" aria-hidden />
              <span className="relative z-10 text-bone transition-colors duration-500">
                Enter Project Arena
              </span>
              <span
                className="relative z-10 inline-block transition-transform duration-500 group-hover:translate-x-2 projects-accent-color"
                aria-hidden
              >
                →
              </span>
              <span className="arena-btn-fill" aria-hidden />
            </a>
            <p className="font-mono text-[0.52rem] tracking-[0.35em] text-muted uppercase opacity-50">
              Scroll to explore · then enter
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
