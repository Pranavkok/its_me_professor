import ModelStage from "@/components/ModelStage";
import SectionHeader from "@/components/SectionHeader";

type Discipline = {
  n: string;
  title: string;
  note: string;
  items: string[];
};

const DISCIPLINES: Discipline[] = [
  {
    n: "01",
    title: "Backend Engineering",
    note: "APIs, services, the parts users never see",
    items: ["Node.js", "Express", "REST", "Auth", "Caching"],
  },
  {
    n: "02",
    title: "Databases",
    note: "How data is stored, indexed, and queried",
    items: ["PostgreSQL", "MongoDB", "Redis", "Indexing", "SQL"],
  },
  {
    n: "03",
    title: "DSA & Problem Solving",
    note: "The sport — patterns over memorized answers",
    items: ["C++", "Arrays", "Graphs", "DP", "Complexity"],
  },
  {
    n: "04",
    title: "Systems & Distributed",
    note: "How large software actually holds together",
    items: ["System Design", "Queues", "Scaling", "Consistency"],
  },
  {
    n: "05",
    title: "Cloud & Infrastructure",
    note: "Shipping and running real services",
    items: ["Docker", "Linux", "CI/CD", "AWS", "Deploy"],
  },
  {
    n: "06",
    title: "AI Engineering",
    note: "Building tools on top of models",
    items: ["LLM APIs", "RAG", "Prompting", "Agents"],
  },
];

export default function Skills() {
  return (
    <section
      id="skills"
      className="relative mx-auto max-w-6xl scroll-mt-24 px-6 py-28 md:px-10 md:py-40"
    >
      <SectionHeader n="03" kicker="Skills — The Armory" title="My Skills" />

      <div className="mt-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <p className="max-w-xl font-serif text-3xl leading-snug text-bone md:text-4xl">
          Not a list of logos. A set of{" "}
          <span className="text-ember italic">disciplines</span> I&apos;m
          sharpening, one at a time.
        </p>
        <ModelStage
          model="armory.glb"
          className="h-28 w-full flex-none md:h-24 md:w-56"
        >
          <span className="font-mono text-[0.6rem] tracking-[0.2em] text-faint uppercase">
            [ weapon rack ]
          </span>
        </ModelStage>
      </div>

      {/* dojo wall */}
      <div className="mt-14 grid gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {DISCIPLINES.map((d) => (
          <article
            key={d.n}
            className="group relative bg-ink p-7 transition-colors duration-500 hover:bg-surface"
          >
            <span className="absolute right-6 top-6 h-8 w-px bg-line transition-all duration-500 group-hover:h-12 group-hover:bg-ember" />
            <span className="font-mono text-[0.6rem] tabular-nums text-faint">
              {d.n}
            </span>
            <h3 className="mt-4 font-serif text-2xl text-bone">{d.title}</h3>
            <p className="mt-2 text-sm text-muted">{d.note}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {d.items.map((i) => (
                <li
                  key={i}
                  className="border border-line px-2.5 py-1 font-mono text-[0.65rem] tracking-wide text-muted transition-colors duration-300 group-hover:border-faint"
                >
                  {i}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
