"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const navLinks = [
  {href: "/", label: "Home"},
  { href: "/projects", label: "All Projects" },
  { href: "/about", label: "About" },
];

const socialLinks = [
  {
    href: "https://www.instagram.com/kevin.chiputra/",
    label: "Instagram",
  },
  {
    href: "https://www.linkedin.com/in/kevin-chiputra/",
    label: "LinkedIn",
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-[#fcf9f2] flex flex-col items-center gap-5 w-full px-8 text-center border-t border-black/20 mt-16 py-12"
    >
      <p className="max-w-2xl font-headline italic text-lg md:text-xl opacity-80 mb-2">
        &quot;Design is intelligence made visible.&quot;
      </p>

      {/* Navigation */}
      <div className="flex flex-wrap justify-center gap-6 md:gap-8 font-label text-[10px] tracking-[0.2em] uppercase">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="opacity-70 hover:opacity-100 hover:underline underline-offset-4 transition-opacity"
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Copyright */}
      <p className="font-label text-[10px] tracking-[0.2em] uppercase opacity-40 mt-2 flex items-center gap-1.5 justify-center">
        <span>©</span>
        <span>{year} Kevin Chiputra</span>
      </p>

      {/* Social links */}
      <div className="flex gap-6 mt-1">
        {socialLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-label text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 hover:underline underline-offset-4 transition-opacity"
          >
            {label}
          </Link>
        ))}
      </div>
    </motion.footer>
  );
}
