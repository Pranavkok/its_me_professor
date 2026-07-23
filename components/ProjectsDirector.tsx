"use client";

import { useEffect } from "react";

/**
 * ProjectsDirector
 *
 * Watches the #projects section via IntersectionObserver.
 * When it enters the viewport, sets body[data-theme="arena"] — this
 * triggers a global CSS palette swap: dark ember → forest gold/green.
 * Also writes --projects-t (0→1) for fine-grained smooth transitions.
 */
export default function ProjectsDirector() {
  useEffect(() => {
    const root    = document.documentElement;
    const section = document.getElementById("projects");
    if (!section) return;

    /* ── Smooth CSS var for transitions ────────────────────────── */
    let ticking = false;
    const compute = () => {
      ticking = false;
      const rect   = section.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.6 && rect.bottom > 0;
      // t: 0 = not in view, 1 = fully in view
      const t = Math.min(
        1,
        Math.max(
          0,
          1 - rect.top / (window.innerHeight * 0.5),
        ),
      );
      root.style.setProperty("--projects-t", t.toFixed(3));
    };

    /* ── IntersectionObserver for theme swap ──────────────────── */
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            document.body.dataset.theme = "arena";
          } else {
            delete document.body.dataset.theme;
          }
        });
      },
      { threshold: 0.15 },
    );

    observer.observe(section);

    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(compute); }
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
      delete document.body.dataset.theme;
      root.style.removeProperty("--projects-t");
    };
  }, []);

  return null;
}
