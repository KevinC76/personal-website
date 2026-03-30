"use client";

import { motion } from "framer-motion";

const skills = [
  {
    num: "001",
    title: "Non-Functional Testing",
    desc: "Playwright, k6, JMeter (basic) — performance, load, and end-to-end test coverage.",
  },
  {
    num: "002",
    title: "React / Next.js",
    desc: "Modern component-driven frontends built for scale, performance, and maintainability.",
  },
  {
    num: "003",
    title: "UI/UX Design & Research",
    desc: "User journey mapping, wireframing, high-fidelity prototyping, and usability research.",
  },
  {
    num: "004",
    title: "Product Management",
    desc: "Roadmap planning and cross-team collaboration via Asana, SharePoint, and Notion.",
  },
  {
    num: "005",
    title: "Git / GitHub",
    desc: "Version control, branching strategies, pull request workflows, and code review.",
  },
  {
    num: "006",
    title: "Test Case Creation",
    desc: "Structured test suites covering functional, regression, and edge-case scenarios.",
  },
  {
    num: "007",
    title: "Prompt Engineering",
    desc: "Designing effective prompts for LLM-powered features and AI-assisted workflows.",
  },
  {
    num: "008",
    title: "Power Automate",
    desc: "Basic workflow automation — connecting services, triggers, and approval flows.",
  },
];

export default function Tools() {
  return (
    <section id="tools" className="py-14">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-4 mb-10"
      >
        <h2 className="font-headline text-3xl md:text-4xl font-black uppercase whitespace-nowrap">
          THE CLASSIFIEDS
        </h2>
        <div className="flex-grow h-[2px] bg-black" />
        <span className="hidden md:block font-label text-xs uppercase tracking-widest whitespace-nowrap">
          Section B: Skills & Tooling
        </span>
      </motion.div>

      {/* Skills grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 border border-black/20">
        {skills.map(({ num, title, desc }, i) => {
          const isLastRow = i >= 4;
          const isLastCol = (i + 1) % 4 === 0;
          const isLastMobileCol = (i + 1) % 2 === 0;

          return (
            <motion.div
              key={num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className={[
                "p-5 md:p-6 group transition-colors hover:bg-[#f6f3ec]",
                !isLastRow ? "border-b border-black/20" : "",
                !isLastMobileCol ? "border-r border-black/20 md:border-r-0" : "",
                !isLastCol ? "md:border-r border-black/20" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="font-label text-[10px] uppercase tracking-tighter opacity-50 block mb-3">
                No. {num}
              </span>
              <h4 className="font-headline text-lg md:text-xl font-bold mb-2 group-hover:italic transition-all leading-tight">
                {title}
              </h4>
              <p className="text-xs font-body opacity-70 leading-relaxed">
                {desc}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
