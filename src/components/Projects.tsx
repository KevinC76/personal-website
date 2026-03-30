"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { projects } from "@/lib/projects";

export default function Projects() {
  const featured = projects[0];

  return (
    <section id="projects" className="w-full bg-black text-[#e2e2e2] py-14">
      <div className="max-w-screen-2xl mx-auto px-6">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between mb-14"
        >
          <div>
            <span className="font-label text-xs uppercase tracking-[0.3em] mb-3 block opacity-60">
              Major Features
            </span>
            <h2 className="font-headline text-6xl md:text-8xl lg:text-9xl font-black italic tracking-tighter leading-none">
              The Projects.
            </h2>
          </div>
          <div className="hidden md:block w-1/3 text-right">
            <p className="font-body text-sm opacity-60 leading-relaxed">
              Crafted with editorial rigour and technical precision — every
              project a case study in product thinking.
            </p>
          </div>
        </motion.div>

        {/* Single featured project */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center"
        >
          {/* Image */}
          <div className="lg:col-span-7 relative aspect-video overflow-hidden bg-[#1a1a1a]">
            <Image
              src={featured.image}
              alt={featured.imageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 58vw"
            />
          </div>

          {/* Text */}
          <div className="lg:col-span-5">
            <span className="font-label text-xs uppercase tracking-widest text-[#acabaa] mb-4 block underline underline-offset-4">
              {featured.label}
            </span>
            <h3 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              {featured.title}
            </h3>
            <div className="text-sm opacity-80 leading-relaxed mb-6">
              <p>{featured.summary}</p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {featured.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-label text-[9px] uppercase tracking-widest border border-white/20 px-2 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>

            <blockquote className="font-headline italic text-xl md:text-2xl border-l-4 border-white pl-6 mb-8">
              {featured.quote}
            </blockquote>

            <Link
              href="/projects"
              className="inline-flex items-center gap-2 font-label text-xs uppercase tracking-widest border border-white/20 px-6 py-3 hover:bg-white hover:text-black transition-all"
            >
              View Full Story →
            </Link>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mt-16"
        >
          <Link
            href="/projects"
            className="bg-white text-black px-10 py-4 font-headline italic text-xl border-2 border-white hover:bg-black hover:text-white transition-colors duration-300"
          >
            See All Projects
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
