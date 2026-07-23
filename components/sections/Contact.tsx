"use client";

import { useState } from "react";
import SectionHeader from "@/components/SectionHeader";

// TODO(pranav): drop in your real profile URLs.
const PROFILES = [
  { label: "GitHub", handle: "@pranav", href: "https://github.com/" },
  { label: "LeetCode", handle: "@pranav", href: "https://leetcode.com/" },
  {
    label: "GeeksforGeeks",
    handle: "@pranav",
    href: "https://www.geeksforgeeks.org/",
  },
  { label: "Codeforces", handle: "@pranav", href: "https://codeforces.com/" },
];

export default function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <section
      id="contact"
      className="relative mx-auto max-w-6xl scroll-mt-24 px-6 py-28 md:px-10 md:py-40"
    >
      <SectionHeader
        n="06"
        kicker="Contact — Cross Paths"
        title="Profiles & Contact"
      />

      <div className="mt-16 grid gap-16 md:grid-cols-[1.1fr_0.9fr]">
        {/* form */}
        <div>
          <h2 className="max-w-md font-serif text-4xl leading-tight text-bone md:text-5xl">
            Have something worth <span className="text-ember italic">building</span>?
          </h2>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-muted">
            An idea, an opportunity, or just a conversation about systems and the
            craft — my inbox is open.
          </p>

          <form
            className="mt-10 space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Name" name="name" placeholder="Your name" />
              <Field
                label="Email"
                name="email"
                type="email"
                placeholder="you@domain.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="kicker" htmlFor="message">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                required
                placeholder="Say something worth reading."
                className="resize-none border-b border-line bg-transparent py-3 text-bone placeholder:text-faint focus:border-ember focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="group inline-flex items-center gap-4 border border-line px-8 py-4 font-mono text-xs tracking-[0.25em] text-bone uppercase transition-all duration-500 hover:border-ember hover:bg-ember/5"
            >
              {sent ? "Message drafted" : "Send message"}
              <span className="text-ember transition-transform duration-500 group-hover:translate-x-1.5">
                →
              </span>
            </button>
            {sent && (
              <p className="font-mono text-[0.65rem] tracking-[0.2em] text-faint uppercase">
                (front-end only for now — wiring the endpoint comes later)
              </p>
            )}
          </form>
        </div>

        {/* profiles */}
        <div className="flex flex-col justify-between gap-10">
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-line bg-line">
            {PROFILES.map((p) => (
              <a
                key={p.label}
                href={p.href}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between bg-ink px-6 py-5 transition-colors duration-500 hover:bg-surface"
              >
                <span className="font-serif text-xl text-bone">{p.label}</span>
                <span className="flex items-center gap-4">
                  <span className="font-mono text-[0.65rem] tracking-wide text-muted">
                    {p.handle}
                  </span>
                  <span className="text-ember transition-transform duration-500 group-hover:translate-x-1">
                    ↗
                  </span>
                </span>
              </a>
            ))}
          </div>

          <div className="model-stage flex h-40 items-center justify-center rounded-sm" data-model="model — lantern.glb">
            <span className="font-mono text-[0.65rem] tracking-[0.2em] text-faint uppercase">
              [ lantern / crow — reacts to cursor ]
            </span>
          </div>
        </div>
      </div>

      <footer className="mt-28 flex flex-col items-center justify-between gap-4 border-t border-line pt-8 md:flex-row">
        <span className="font-serif text-lg text-bone">
          nexious<span className="text-ember">.</span>
        </span>
        <span className="font-mono text-[0.6rem] tracking-[0.25em] text-faint uppercase">
          Pranav Kokate — still becoming · 2026
        </span>
      </footer>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="kicker" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required
        placeholder={placeholder}
        className="border-b border-line bg-transparent py-3 text-bone placeholder:text-faint focus:border-ember focus:outline-none"
      />
    </div>
  );
}
