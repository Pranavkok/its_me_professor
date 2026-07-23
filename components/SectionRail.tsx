"use client";

import { useEffect, useState } from "react";
import { SECTIONS } from "@/lib/sections";

export default function SectionRail() {
  const [active, setActive] = useState("hero");

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      Boolean
    ) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Section index"
      className="fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-4 md:flex"
    >
      {SECTIONS.map((s) => {
        const on = active === s.id;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="group flex items-center justify-end gap-3"
          >
            <span
              className={`font-mono text-[0.65rem] tracking-[0.2em] uppercase transition-all duration-500 ${
                on
                  ? "text-bone opacity-100"
                  : "text-muted opacity-0 group-hover:opacity-100"
              }`}
            >
              {s.label}
            </span>
            <span
              className={`h-px transition-all duration-500 ${
                on
                  ? "w-8 bg-ember"
                  : "w-4 bg-faint group-hover:w-6 group-hover:bg-muted"
              }`}
            />
            <span
              className={`font-mono text-[0.6rem] tabular-nums transition-colors duration-500 ${
                on ? "text-ember" : "text-faint"
              }`}
            >
              {s.n}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
