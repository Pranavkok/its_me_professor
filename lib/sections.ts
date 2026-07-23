export type Section = {
  id: string;
  n: string;
  label: string;
};

export const SECTIONS: Section[] = [
  { id: "hero", n: "01", label: "Hero" },
  { id: "about", n: "02", label: "About" },
  { id: "skills", n: "03", label: "Skills" },
  { id: "projects", n: "04", label: "Projects" },
  { id: "internship", n: "05", label: "Internship" },
  { id: "contact", n: "06", label: "Contact" },
];
