"use client";

import { motion, type Variants, type Easing } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { withBasePath } from "@/lib/assetPath";

const easeOut: Easing = "easeOut";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: easeOut },
  }),
};

const sectors = ["Manufacturing", "Health", "AI", "Applications"];

const articles = [
  {
    label: "My Goals",
    headline: "Bridge the Gap Between Business Vision and Technical Execution.",
    body: "My ambition is to operate at the full lifecycle of a product — from the first whiteboard session to post-launch quality gates. I want to lead cross-functional teams where engineering rigour and product thinking are not separate departments but a single, unified practice.",
  },
  {
    label: "My Hobby",
    headline: "Building Things That Shouldn't Exist — Until They Do.",
    body: "Outside of work I tinker with side projects at the edge of what feels reasonable: custom mechanical keyboards, local AI experiments, and the occasional over-engineered personal dashboard. If it has a terminal and a blinking cursor, I'm probably interested.",
  },
];

export default function Hero() {
  return (
    <section id="hero" className="py-10 md:py-14 border-b-4 border-black">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-stretch">

        {/* ── Left Column ───────────────────────────────── */}
        <div className="flex flex-col justify-between pr-0 lg:pr-12 lg:border-r border-black/20">
          <div>
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mb-6 inline-block border border-black px-3 py-1 font-label text-[10px] uppercase tracking-[0.2em] bg-black text-white"
            >
              Vol. 1, Issue 1 • Personal Profile
            </motion.div>

            {/* Name as masthead-style display headline */}
            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="font-headline italic tracking-tighter text-5xl md:text-7xl xl:text-8xl leading-[0.85] mb-6"
            >
              Kevin <br /> Chiputra.
            </motion.h1>

            {/* Role pill */}
            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="font-body text-base md:text-lg opacity-70 leading-relaxed mb-6"
            >
              Product Life Cycle professional with hands-on experience across{" "}
              <span className="font-bold text-black opacity-100">
                Software Engineering
              </span>
              ,{" "}
              <span className="font-bold text-black opacity-100">
                Product Management
              </span>
              , and{" "}
              <span className="font-bold text-black opacity-100">
                Quality Assurance
              </span>
              .
            </motion.p>

            {/* Byline bar */}
            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-wrap items-center gap-3 border-y border-black py-3 mb-6"
            >
              <span className="font-label text-xs uppercase tracking-widest font-bold">
                10 Projects
              </span>
              <span className="w-1.5 h-1.5 bg-black" />
              <span className="font-label text-xs uppercase tracking-widest opacity-60">
                Product Life Cycle
              </span>
              <span className="ml-auto font-label text-xs uppercase tracking-widest opacity-60">
                Est. 2024
              </span>
            </motion.div>

            {/* Sector tags */}
            <motion.div
              custom={4}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-wrap gap-2 mb-8"
            >
              {sectors.map((s) => (
                <span
                  key={s}
                  className="font-label text-[10px] uppercase tracking-widest border border-black/30 px-2 py-1 bg-[#f6f3ec]"
                >
                  {s}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Hero photo */}
          <motion.div
            custom={5}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative w-full aspect-[4/3] lg:flex-grow bg-[#e5e2db] overflow-hidden"
          >
            <Image
              src={withBasePath("/hero-optimized.jpg")}
              alt="Kevin Chiputra"
              fill
              className="object-cover grayscale"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </motion.div>
        </div>

        {/* ── Right Column ──────────────────────────────── */}
        <div className="flex flex-col gap-10 lg:pl-4">

          {/* Desk intro */}
          <motion.div
            custom={2}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="border-b-2 border-black pb-8"
          >
            <h2 className="font-headline text-2xl md:text-3xl font-black mb-5 uppercase tracking-tight">
              From the Desk of the Editor
            </h2>
            <p className="font-headline text-xl md:text-2xl leading-snug italic opacity-90 mb-4">
              Over 10 projects across manufacturing, health, AI, and application
              development — managing product delivery, leading quality assurance,
              and building the interfaces that hold it all together.
            </p>
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-black/10">
              {[
                { value: "10+", label: "Projects" },
                { value: "4", label: "Sectors" },
                { value: "3", label: "Disciplines" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center md:text-left">
                  <div className="font-headline text-3xl md:text-4xl font-black tracking-tighter leading-none">
                    {value}
                  </div>
                  <div className="font-label text-[10px] uppercase tracking-widest opacity-50 mt-1">
                    {label}
                  </div>
                </div>
              ))}
            </div>
            <div className="font-headline italic text-2xl mt-6 opacity-80 tracking-tight">
              — Kevin Chiputra
            </div>
            <div className="font-label text-[10px] uppercase tracking-[0.2em] opacity-50 mt-1">
              Product Life Cycle
            </div>
            <Link
              href="/about"
              className="group inline-flex items-center gap-3 mt-6 border-b-2 border-black pb-0.5 font-label text-xs uppercase tracking-[0.25em] hover:gap-4 transition-all"
            >
              See My Full Story
              <motion.span
                className="inline-block"
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                →
              </motion.span>
            </Link>
          </motion.div>

          {/* Articles: My Goals + My Hobby */}
          <div className="space-y-10">
            {articles.map(({ label, headline, body }, i) => (
              <motion.div
                key={label}
                custom={4 + i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className={i === 1 ? "pt-8 border-t border-black/10" : ""}
              >
                <span className="font-label text-[10px] uppercase tracking-widest font-bold mb-3 block underline underline-offset-4 decoration-2">
                  {label}
                </span>
                <h3 className="font-headline text-xl md:text-2xl font-bold mb-3 leading-tight">
                  {headline}
                </h3>
                <p className="font-body text-sm md:text-base opacity-70 leading-relaxed">
                  {body}
                </p>
                {/* CV button — only after My Hobby */}
                {i === 1 && (
                  <Link
                    href="https://drive.google.com/file/d/1K-2qKCO2TUzbDaeRlEV6Aa7BGOZLHi0H/view?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-3 mt-6 bg-black text-[#e2e2e2] px-6 py-3 font-label text-xs uppercase tracking-[0.25em] hover:bg-[#3b3b3b] transition-colors"
                  >
                    Download CV
                    <motion.span
                      className="inline-block"
                      whileHover={{ x: 3 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      ↓
                    </motion.span>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
