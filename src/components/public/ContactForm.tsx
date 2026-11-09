"use client";
import { useState } from "react";
import type { PortfolioContent } from "@/lib/content/schema";
export default function ContactForm({
  content,
  disabled = false,
}: {
  content: PortfolioContent["contact"];
  disabled?: boolean;
}) {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || status === "sending") return;
    const form = event.currentTarget;
    setStatus("sending");
    setError("");
    const fields = new FormData(form);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(fields)),
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok)
        throw new Error(
          (await response.json()).error ||
            "Unable to send your letter. Please try again.",
        );
      setStatus("success");
      form.reset();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to send your letter.",
      );
      setStatus("error");
    }
  }
  return (
    <section id="contact" className="border-t-2 border-black py-12" data-reveal>
      <div className="correspondence-card mx-auto max-w-4xl bg-white p-6 md:p-10 border border-black">
        <p className="eyebrow mb-5">
          Correspondence ·{" "}
          <a href={`mailto:${content.email}`}>{content.email}</a>
        </p>
        <h2 className="section-title">{content.title}</h2>
        <p className="font-headline italic text-xl mb-8 mt-3">
          {content.intro}
        </p>
        <div aria-live="polite">
          {status === "success" && (
            <div className="py-8">
              <h3 className="font-headline text-3xl italic">
                {content.success}
              </h3>
              <p className="mt-3">{content.successDetail}</p>
              <button
                className="text-link mt-6"
                onClick={() => setStatus("idle")}
              >
                Write another letter
              </button>
            </div>
          )}
        </div>
        {status !== "success" && (
          <form onSubmit={submit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <label className="form-label">
                Your name
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                  className="public-input"
                />
              </label>
              <label className="form-label">
                Email address
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  className="public-input"
                />
              </label>
            </div>
            <label className="form-label">
              Your letter
              <textarea
                name="message"
                required
                minLength={10}
                maxLength={5000}
                rows={5}
                className="public-input"
              />
            </label>
            <div hidden>
              <label>
                Company website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            {error && (
              <p role="alert" className="text-red-800">
                {error}
              </p>
            )}
            <button
              disabled={disabled || status === "sending"}
              className="ink-button"
            >
              {disabled
                ? "Preview — sending disabled"
                : status === "sending"
                  ? "Dispatching…"
                  : "Send letter →"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
