"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const navLinks = [
  { href: "#hero", label: "Hero" },
  { href: "#tools", label: "Tools" },
  { href: "#projects", label: "Projects" },
  { href: "#contact", label: "Contact" },
];

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-[#fcf9f2] flex flex-col items-center w-full px-6 max-w-screen-2xl mx-auto border-b-[3px] border-black pt-6 pb-4"
    >
      <div className="w-full flex justify-between items-center mb-3">
        <div className="hidden md:block font-label text-[10px] tracking-[0.3em] uppercase opacity-60">
          VOL. LXIV ... NO. 31,452
        </div>
        <div className="font-headline font-black uppercase tracking-tighter text-black border-b-4 border-black mb-1 text-2xl md:text-4xl text-center w-full md:w-auto">
          Kevin Chiputra Newspaper
        </div>
        <div className="hidden md:block font-label text-[10px] tracking-[0.3em] uppercase opacity-60 text-right">
          PRICE: ONE CENT
        </div>
      </div>

      <nav className="flex gap-6 md:gap-8 items-center py-2">
        {navLinks.map(({ href, label }, i) => (
          <Link
            key={href}
            href={href}
            className={`font-label uppercase text-xs tracking-widest transition-all hover:italic ${
              i === 0
                ? "text-black font-bold border-b-2 border-black"
                : "text-black/60 hover:text-black"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </motion.header>
  );
}
