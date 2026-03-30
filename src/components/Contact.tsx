"use client";

import { motion } from "framer-motion";
import { useState, useRef } from "react";
import Link from "next/link";

type Status = "idle" | "sending" | "success" | "error";

export default function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement).value;

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Unknown error");
      }

      setStatus("success");
      formRef.current?.reset();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to send. Please try again.");
    }
  }

  return (
    <section id="contact" className="border-t-2 border-black py-12">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="correspondence-card bg-white border border-black relative p-8 md:p-10"
        >
          {/* Dashed top clip */}
          <div className="absolute -top-[1px] -left-[1px] -right-[1px] h-4 flex overflow-hidden">
            <div className="flex-1 border-t-2 border-black border-dashed" />
          </div>

          {/* Stamp box */}
          <div className="absolute top-8 right-8 md:right-12 w-20 h-28 border-2 border-black/20 flex flex-col items-center justify-center text-[9px] font-label tracking-tighter opacity-40 uppercase text-center p-2 border-dashed">
            AFFIX
            <br />
            STAMP
            <br />
            HERE
          </div>

          {/* Heading */}
          <div className="mb-8 pr-24">
            <h2 className="font-headline text-4xl md:text-5xl font-black uppercase mb-3 tracking-tighter">
              Letters to the Editor
            </h2>
            <p className="font-headline italic text-lg md:text-xl opacity-60">
              Correspondence regarding digital craftsmanship and aesthetic
              theory.
            </p>
          </div>

          {/* Success state */}
          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 flex flex-col items-center gap-6 text-center"
            >
              <p className="font-headline italic text-2xl">
                Dispatched successfully.
              </p>
              <p className="font-label text-[10px] uppercase tracking-[0.2em] opacity-50">
                Please allow 2–4 business cycles for a response.
              </p>
              <Link
                href="/"
                className="group flex items-center gap-2 mt-2 font-label text-xs uppercase tracking-[0.25em] border-b-2 border-black pb-0.5 hover:gap-3 transition-all"
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
            </motion.div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
              <div className="font-headline text-xl md:text-2xl italic mb-6">
                To the Editor:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="space-y-2">
                  <label className="font-label text-[10px] uppercase tracking-widest font-bold block">
                    Respondent Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Sign your name..."
                    className="w-full bg-transparent dotted-input py-2 font-headline italic text-lg md:text-xl placeholder:opacity-20 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label text-[10px] uppercase tracking-widest font-bold block">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Return address..."
                    className="w-full bg-transparent dotted-input py-2 font-headline italic text-lg md:text-xl placeholder:opacity-20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="font-label text-[10px] uppercase tracking-widest font-bold block mb-3">
                  Description
                </label>
                <textarea
                  name="message"
                  required
                  placeholder="Begin your message here..."
                  rows={6}
                  className="w-full bg-transparent dotted-input py-2 font-headline italic text-lg md:text-xl placeholder:opacity-20 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Error message */}
              {status === "error" && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-label text-[10px] uppercase tracking-widest text-red-700"
                >
                  {errorMsg}
                </motion.p>
              )}

              <div className="flex flex-col items-center gap-6">
                <div className="w-full h-px bg-black/10" />
                <motion.button
                  type="submit"
                  disabled={status === "sending"}
                  whileHover={status !== "sending" ? { scale: 1.01 } : {}}
                  whileTap={status !== "sending" ? { scale: 0.99 } : {}}
                  className="group relative px-10 md:px-12 py-4 md:py-5 bg-black text-white overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 font-label text-xs uppercase tracking-[0.4em] flex items-center gap-4">
                    {status === "sending" ? "Dispatching..." : "Dispatch via Post"}
                    {status !== "sending" && (
                      <span className="group-hover:translate-x-1 transition-transform inline-block">
                        →
                      </span>
                    )}
                  </span>
                  {status !== "sending" && (
                    <div className="absolute inset-0 bg-neutral-800 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  )}
                </motion.button>
                <p className="font-label text-[9px] uppercase tracking-[0.2em] opacity-40">
                  Please allow 2–4 business cycles for a response.
                </p>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
