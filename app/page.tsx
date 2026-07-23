import TopBar from "@/components/TopBar";
import SectionRail from "@/components/SectionRail";
import SmoothScroll from "@/components/SmoothScroll";
import Stage3D from "@/components/three/Stage3D";
import GutsStage from "@/components/three/GutsStage";
import HeroDirector from "@/components/HeroDirector";
import AboutDirector from "@/components/AboutDirector";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Skills from "@/components/sections/Skills";
import Projects from "@/components/sections/Projects";
import Internship from "@/components/sections/Internship";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <HeroDirector />
      <AboutDirector />
      {/* Hero model — fixed full-screen canvas */}
      <Stage3D />
      {/* Guts model — second fixed canvas, visible only during About section */}
      <GutsStage />

      <TopBar />
      <SectionRail />

      <main className="relative z-10">
        <Hero />
        <hr className="ink-rule mx-auto max-w-6xl" />
        <About />
        <hr className="ink-rule mx-auto max-w-6xl" />
        <Skills />
        <hr className="ink-rule mx-auto max-w-6xl" />
        <Projects />
        <hr className="ink-rule mx-auto max-w-6xl" />
        <Internship />
        <hr className="ink-rule mx-auto max-w-6xl" />
        <Contact />
      </main>
    </>
  );
}
