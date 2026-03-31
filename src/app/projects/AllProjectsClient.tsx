"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { projects } from "@/lib/projects";
import Footer from "@/components/Footer";
import { withBasePath } from "@/lib/assetPath";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55 },
  }),
};

export default function AllProjectsClient() {
  return (
    <>
      {/* ── Masthead / Nav ───────────────────────────── */}
      <header className="bg-[#fcf9f2] flex flex-col items-center w-full px-6 max-w-screen-2xl mx-auto border-b-[3px] border-black pt-6 pb-4">
        <div className="w-full flex justify-between items-center mb-3">
          {/* Back button */}
          <Link
            href="/"
            className="group flex items-center gap-2 font-label text-[10px] uppercase tracking-[0.25em] opacity-70 hover:opacity-100 transition-opacity"
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
            ARCHIVE EDITION
          </div>
        </div>

        {/* Page label */}
        <div className="font-label text-[10px] uppercase tracking-[0.3em] opacity-50 py-2 border-t border-black/10 w-full text-center">
          Complete Works — All Projects
        </div>
      </header>

      {/* ── Hero banner (black) ───────────────────────── */}
      <div className="w-full bg-black text-[#e2e2e2] py-14 px-6">
        <div className="max-w-screen-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <span className="font-label text-xs uppercase tracking-[0.3em] mb-4 block opacity-60">
              Complete Archive
            </span>
            <h1 className="font-headline text-6xl md:text-8xl lg:text-9xl font-black italic tracking-tighter leading-none mb-6">
              The Projects.
            </h1>
            <p className="font-body text-sm md:text-base opacity-60 leading-relaxed max-w-xl">
              A complete retrospective on digital craftsmanship and
              problem-solving at scale. Every case study, every collaboration,
              every lesson learned — printed in full.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Project list ─────────────────────────────── */}
      <div className="w-full bg-black text-[#e2e2e2]">
        <div className="max-w-screen-2xl mx-auto px-6 pb-20 space-y-24 md:space-y-32">
          {projects.map((project, idx) => (
            <motion.article
              key={project.id}
              custom={idx}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="border-t border-white/10 pt-12"
            >
              {/* Project header row */}
              <div className="flex flex-wrap items-baseline gap-4 mb-8">
                <span className="font-label text-[10px] uppercase tracking-widest text-[#acabaa] underline underline-offset-4">
                  {project.label}
                </span>
                <span className="font-label text-[10px] uppercase tracking-widest opacity-40">
                  {project.year}
                </span>
                <div className="flex flex-wrap gap-2 ml-auto">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-label text-[9px] uppercase tracking-widest border border-white/20 px-2 py-1"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Main grid: image + text */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-10">
                {/* Image */}
                <div
                  className={`lg:col-span-7 relative aspect-video overflow-hidden bg-[#1a1a1a] ${
                    !project.imageLeft ? "order-1 lg:order-2" : ""
                  }`}
                >
                  <Image
                    src={withBasePath(project.image)}
                    alt={project.imageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 58vw"
                  />
                </div>

                {/* Intro text */}
                <div
                  className={`lg:col-span-5 ${
                    !project.imageLeft ? "order-2 lg:order-1" : ""
                  }`}
                >
                  <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                    {project.title}
                  </h2>
                  <p className="font-headline italic text-lg md:text-xl opacity-80 leading-relaxed mb-6">
                    {project.summary}
                  </p>
                  <div className="font-label text-[10px] uppercase tracking-widest opacity-50 border-t border-white/10 pt-4">
                    Outcome — {project.outcome}
                  </div>
                </div>
              </div>

              {/* Full editorial body — 3-col on large screens */}
              <div className="border-t border-white/10 pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 text-sm opacity-80 leading-relaxed mb-10">
                  {project.body.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>

                {/* Pull quote */}
                <blockquote className="border-l-4 border-white pl-6 md:pl-8 my-8 max-w-2xl">
                  <p className="font-headline italic text-xl md:text-2xl lg:text-3xl leading-snug mb-3">
                    {project.quote}
                  </p>
                  <cite className="font-label text-[10px] uppercase tracking-widest opacity-60 not-italic">
                    {project.quoteAttribution}
                  </cite>
                </blockquote>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      {/* ── Back to home ─────────────────────────────── */}
      <div className="w-full bg-black border-t border-white/10 py-10 px-6">
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center">
          <Link
            href="/"
            className="group flex items-center gap-3 font-label text-xs uppercase tracking-widest text-[#e2e2e2] hover:text-white transition-colors"
          >
            <motion.span
              className="inline-block"
              whileHover={{ x: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              ←
            </motion.span>
            Return to Front Page
          </Link>
          <span className="font-label text-[9px] uppercase tracking-[0.3em] opacity-30">
            The Portfolio Gazette
          </span>
        </div>
      </div>

      <Footer />
    </>
  );
}
