import SectionHeader from "@/components/SectionHeader";

// TODO(pranav): replace with your real internships / worked projects.
type Role = {
  n: string;
  company: string;
  role: string;
  period: string;
  summary: string;
  points: string[];
  stack: string[];
};

const ROLES: Role[] = [
  {
    n: "01",
    company: "Company One",
    role: "Backend Engineering Intern",
    period: "2025",
    summary:
      "Short one-line description of what this project or internship was about.",
    points: [
      "Built / designed X that did Y, improving Z.",
      "Owned a service handling N requests with focus on reliability.",
      "Wrote the reasoning behind a key trade-off you made.",
    ],
    stack: ["Node.js", "PostgreSQL", "Redis", "Docker"],
  },
  {
    n: "02",
    company: "Company Two",
    role: "Software Engineering Intern",
    period: "2025",
    summary: "One line on the problem you were solving here.",
    points: [
      "Shipped a feature end-to-end from API to deploy.",
      "Reduced latency / cost / bugs by a measurable amount.",
      "Collaborated with a team on a real production system.",
    ],
    stack: ["Express", "MongoDB", "AWS", "CI/CD"],
  },
  {
    n: "03",
    company: "Company Three",
    role: "Developer Intern",
    period: "2024",
    summary: "One line summarising the third experience.",
    points: [
      "Implemented a tool that saved the team manual effort.",
      "Learned a system deeply and documented how it worked.",
      "Contributed to code reviews and internal quality.",
    ],
    stack: ["Python", "REST", "Linux", "Git"],
  },
];

export default function Internship() {
  return (
    <section
      id="internship"
      className="relative mx-auto max-w-6xl scroll-mt-24 px-6 py-28 md:px-10 md:py-40"
    >
      <SectionHeader
        n="05"
        kicker="Internship — Proof of Work"
        title="Internship"
      />

      <p className="mt-10 max-w-xl font-serif text-3xl leading-snug text-bone md:text-4xl">
        Where the path met the <span className="text-ember italic">real</span>{" "}
        world.
      </p>

      <div className="mt-16 flex flex-col">
        {ROLES.map((r) => (
          <article
            key={r.n}
            className="group grid gap-6 border-t border-line py-10 transition-colors duration-500 hover:bg-surface/40 md:grid-cols-[auto_1fr_1.1fr] md:gap-10"
          >
            <div className="flex items-start gap-4">
              <span className="font-mono text-[0.65rem] tabular-nums text-ember">
                {r.n}
              </span>
              <span className="font-mono text-[0.65rem] tracking-[0.2em] text-faint uppercase">
                {r.period}
              </span>
            </div>

            <div>
              <h3 className="font-serif text-2xl text-bone md:text-3xl">
                {r.company}
              </h3>
              <p className="mt-1 text-sm text-ember">{r.role}</p>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
                {r.summary}
              </p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {r.stack.map((s) => (
                  <li
                    key={s}
                    className="border border-line px-2.5 py-1 font-mono text-[0.6rem] tracking-wide text-muted"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <ul className="space-y-3">
              {r.points.map((p, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-sm leading-relaxed text-muted"
                >
                  <span className="mt-2 h-px w-4 flex-none bg-faint transition-colors duration-500 group-hover:bg-ember" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
        <div className="border-t border-line" />
      </div>
    </section>
  );
}
