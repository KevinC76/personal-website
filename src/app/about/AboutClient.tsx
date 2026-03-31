"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import { withBasePath } from "@/lib/assetPath";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55 },
  }),
};

const disciplines = [
  {
    label: "Software Engineering",
    body: "Frontend development with React and Next.js, building interfaces that are fast, accessible, and maintainable. Comfortable across the full delivery pipeline from design handoff to production deploy.",
  },
  {
    label: "Product Management",
    body: "Roadmap definition, stakeholder alignment, and sprint facilitation using Asana, SharePoint, and Notion. 10+ projects delivered across manufacturing, health, AI, and application domains.",
  },
  {
    label: "Quality Assurance",
    body: "Non-functional testing with Playwright, k6, and JMeter. Structured test case authorship covering functional, regression, and edge-case scenarios.",
  },
];

const timeline = [
  {
    period: "2025 — Present",
    role: "Product Life Cycle Officer",
    company: "Kalbe Farma",
    desc: "Overseeing product lifecycles, ensuring regulatory compliance, standardizing division procedures, and leading AI and manufacturing application projects.",
    achievements: [
      "Delivered a GMP-compliant manufacturing application to 4 Kalbe sites.",
      "Managed 3 AI Chatbot projects across Biology, Research, and Sales & Marketing.",
      "Built automation scripts and non-functional tests for 2 projects; created SOPs for division and development phases.",
      "Led a team of 3 interns to drive product lifecycle initiatives.",
    ],
  },
  {
    period: "2025 — 2025",
    role: "Product Management",
    company: "Kalbe Farma (Contract)",
    desc: "Managed cross-functional tech projects including manufacturing applications, VR solutions, and AI initiatives, while ensuring FDA compliance through Computerized System Validation (CSV).",
    achievements: [
      "Managed 6 projects, including a VR training app that saved 310M IDR.",
      "Organised an AI education event attended by 5,000 participants.",
      "Executed CSV per industry standards to ensure FDA compliance for manufacturing systems.",
      "Led a team of 5 interns, delivering all projects on time and within scope.",
    ],
  },
  {
    period: "Feb 2024 — Feb 2025",
    role: "Software Engineer",
    company: "Kalbe Farma (Internship)",
    desc: "Developed full-stack production features and created technical documentation to improve system reliability and team workflows.",
    achievements: [
      "Developed 10+ production features with Next.js, TypeScript, and Supabase.",
      "Created 10+ UML diagrams, saving over 15 hours in onboarding time and reducing team miscommunication.",
    ],
  },
  {
    period: "2023 — 2025",
    role: "Marketing",
    company: "BINUS University (Part Time)",
    desc: "Creating promotional materials and managing social media content to boost university visibility and engage prospective students.",
    achievements: [
      "Generated social media content averaging 5,000 views per post.",
      "Created promotional materials for 10+ campus events.",
    ],
  },
  {
    period: "2022 — Present",
    role: "Multimedia Designer & Content Creator",
    company: "Freelance",
    desc: "Designing UI/UX interfaces and producing multimedia content to support brand engagement and digital marketing campaigns.",
    achievements: [
      "Designed user interfaces, presentations, and social media content using Figma.",
      "Produced 50+ promotional videos using CapCut for various product launches.",
    ],
  },
];

const stats = [
  { value: "10+", label: "Projects Shipped" },
  { value: "4", label: "Industry Sectors" },
  { value: "3", label: "Core Disciplines" },
  { value: "100%", label: "Lifecycle Coverage" },
];

export default function AboutClient() {
  return (
    <>
      {/* ── Header ─────────────────────────────────────── */}
      <header className="bg-[#fcf9f2] flex flex-col items-center w-full px-6 max-w-screen-2xl mx-auto border-b-[3px] border-black pt-6 pb-4">
        <div className="w-full flex justify-between items-center mb-3">
          <Link
            href="/"
            className="flex items-center gap-2 font-label text-[10px] uppercase tracking-[0.25em] opacity-70 hover:opacity-100 transition-opacity"
          >
            <motion.span
              className="inline-block"
              whileHover={{ x: -3 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              ←
            </motion.span>
            Back to Front Page
          </Link>

          <div className="font-headline font-black uppercase tracking-tighter text-black border-b-4 border-black mb-1 text-xl md:text-3xl text-center">
            THE PORTFOLIO GAZETTE
          </div>

          <div className="hidden md:block font-label text-[10px] tracking-[0.3em] uppercase opacity-60 text-right">
            Profile Edition
          </div>
        </div>
        <div className="font-label text-[10px] uppercase tracking-[0.3em] opacity-50 py-2 border-t border-black/10 w-full text-center">
          Feature — Personal Profile & Full Story
        </div>
      </header>

      {/* ── Inverted hero banner ────────────────────────── */}
      <div className="w-full bg-black text-[#e2e2e2] py-14 px-6">
        <div className="max-w-screen-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end"
          >
            <div className="lg:col-span-8">
              <span className="font-label text-xs uppercase tracking-[0.3em] mb-4 block opacity-60">
                The Full Story
              </span>
              <h1 className="font-headline text-6xl md:text-8xl lg:text-9xl font-black italic tracking-tighter leading-none">
                Kevin <br /> Chiputra.
              </h1>
            </div>
            <div className="lg:col-span-4 lg:pb-4">
              <p className="font-body text-sm opacity-60 leading-relaxed">
                Product Life Cycle professional operating across Software
                Engineering, Product Management, and Quality Assurance — in
                manufacturing, health, AI, and application sectors.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Stats strip ────────────────────────────────── */}
      <div className="w-full bg-black border-t border-white/10 text-[#e2e2e2]">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {stats.map(({ value, label }, i) => (
              <motion.div
                key={label}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className={`py-8 px-4 ${i < 3 ? "border-r border-white/10" : ""}`}
              >
                <div className="font-headline text-4xl md:text-5xl font-black tracking-tighter leading-none mb-1">
                  {value}
                </div>
                <div className="font-label text-[10px] uppercase tracking-widest opacity-50">
                  {label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main body ──────────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-6 py-14">

        {/* Photo + intro grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16 border-b-2 border-black pb-16">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="lg:col-span-5 relative aspect-[3/4] bg-[#e5e2db] overflow-hidden"
          >
            <Image
              src={withBasePath("/hero-optimized.jpg")}
              alt="Kevin Chiputra"
              fill
              className="object-cover grayscale"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
            {/* Caption bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-4 py-2">
              <span className="font-label text-[9px] uppercase tracking-widest text-[#e2e2e2] opacity-80">
                Kevin Chiputra — Product Life Cycle
              </span>
            </div>
          </motion.div>

          <div className="lg:col-span-7 flex flex-col justify-between gap-8">
            <motion.div
              custom={1}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <span className="font-label text-[10px] uppercase tracking-widest mb-4 block underline underline-offset-4 decoration-2">
                The Chronicle
              </span>
              <h2 className="font-headline text-3xl md:text-4xl font-black uppercase tracking-tight mb-6">
                Operating at Every Layer of the Product
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-body text-sm md:text-base opacity-70 leading-relaxed">
                <p>
                  My career sits at a deliberate intersection — the place where
                  a product idea is stress-tested against engineering reality,
                  shaped by user research, and validated by a rigorous quality
                  process before it ever reaches a user.
                </p>
                <p>
                  Over 10 projects spanning manufacturing lines, health-tech
                  platforms, AI-assisted tools, and consumer applications, I
                  have worn the hats of engineer, product manager, and QA lead
                  — sometimes all at once. That breadth is not accidental; it is
                  the point.
                </p>
              </div>
            </motion.div>

            <motion.div
              custom={2}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="border-t border-black/10 pt-6"
            >
              <blockquote className="font-headline italic text-2xl md:text-3xl leading-snug border-l-4 border-black pl-6">
                "I believe the best products are built by people who can think
                in systems, communicate across disciplines, and ship without
                losing sight of the user."
              </blockquote>
              <div className="font-headline italic text-lg mt-4 opacity-70">
                — Kevin Chiputra
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Three disciplines ───────────────────────── */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex items-center gap-4 mb-10"
        >
          <h2 className="font-headline text-3xl md:text-4xl font-black uppercase whitespace-nowrap">
            The Disciplines
          </h2>
          <div className="flex-grow h-[2px] bg-black" />
          <span className="hidden md:block font-label text-xs uppercase tracking-widest whitespace-nowrap">
            Section C: Craft
          </span>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 border border-black/20 mb-16">
          {disciplines.map(({ label, body }, i) => (
            <motion.div
              key={label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className={`p-6 md:p-8 group hover:bg-[#f6f3ec] transition-colors ${
                i < 2 ? "border-b md:border-b-0 md:border-r border-black/20" : ""
              }`}
            >
              <span className="font-label text-[10px] uppercase tracking-tighter opacity-50 block mb-4">
                0{i + 1}
              </span>
              <h3 className="font-headline text-xl md:text-2xl font-bold mb-4 group-hover:italic transition-all leading-tight">
                {label}
              </h3>
              <p className="font-body text-sm opacity-70 leading-relaxed">
                {body}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ── Timeline ───────────────────────────────── */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex items-center gap-4 mb-10"
        >
          <h2 className="font-headline text-3xl md:text-4xl font-black uppercase whitespace-nowrap">
            The Record
          </h2>
          <div className="flex-grow h-[2px] bg-black" />
          <span className="hidden md:block font-label text-xs uppercase tracking-widest whitespace-nowrap">
            Section D: Experience
          </span>
        </motion.div>

        <div className="space-y-0 mb-16">
          {timeline.map(({ period, role, company, desc, achievements }, i) => (
            <motion.div
              key={`${role}-${company}`}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 border-t border-black/10 py-8 group hover:bg-[#f6f3ec] transition-colors px-2"
            >
              {/* Left — period + company */}
              <div className="md:col-span-3">
                <span className="font-label text-[10px] uppercase tracking-widest opacity-50 block leading-relaxed">
                  {period}
                </span>
                <span className="font-label text-[10px] uppercase tracking-widest opacity-40 block mt-1 leading-relaxed">
                  {company}
                </span>
              </div>

              {/* Right — role + desc + achievements */}
              <div className="md:col-span-9">
                <h3 className="font-headline text-xl md:text-2xl font-bold mb-2 group-hover:italic transition-all leading-tight">
                  {role}
                </h3>
                <p className="font-body text-sm opacity-60 leading-relaxed mb-4">
                  {desc}
                </p>

                {/* Achievement bullets — rule-line style */}
                <ul className="space-y-2">
                  {achievements.map((item, j) => (
                    <li key={j} className="flex items-start gap-3">
                      {/* "bullet" as an ink rule */}
                      <span className="mt-[0.45em] w-4 shrink-0 h-px bg-black/40 block" />
                      <span className="font-body text-xs opacity-70 leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
          <div className="border-t border-black/10" />
        </div>

        {/* ── CTA strip ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-t-2 border-black pt-10"
        >
          <div>
            <h3 className="font-headline text-2xl md:text-3xl font-black uppercase tracking-tight mb-1">
              Ready to Work Together?
            </h3>
            <p className="font-body text-sm opacity-60">
              Let&apos;s build something worth printing.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/#contact"
              className="bg-black text-[#e2e2e2] px-8 py-3 font-label text-xs uppercase tracking-[0.25em] hover:bg-[#3b3b3b] transition-colors"
            >
              Send a Letter
            </Link>
            <Link
              href="/projects"
              className="border-2 border-black px-8 py-3 font-label text-xs uppercase tracking-[0.25em] hover:bg-black hover:text-white transition-colors"
            >
              See All Projects
            </Link>
          </div>
        </motion.div>
      </div>

      <Footer />
    </>
  );
}
