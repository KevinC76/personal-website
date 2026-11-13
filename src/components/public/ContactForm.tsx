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
      <div
        className="correspondence-card mx-auto max-w-4xl bg-white p-6 md:p-10 border border-black"
        data-letter-state={status}
      >
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
            <div className="letter-delivered py-8">
              <span className="letter-seal" aria-hidden="true">
                ✦
              </span>
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
          <form
            onSubmit={submit}
            className="space-y-6"
            aria-busy={status === "sending"}
          >
            <div className="grid gap-6 md:grid-cols-2">
              <label className="form-label letter-field">
                <span className="letter-label">Your name</span>
                <span className="letter-quill" aria-hidden="true">
                  ✧
                </span>
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                  className="public-input"
                />
              </label>
              <label className="form-label letter-field">
                <span className="letter-label">Email address</span>
                <span className="letter-quill" aria-hidden="true">
                  ✧
                </span>
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
            <label className="form-label letter-field">
              <span className="letter-label">Your letter</span>
              <span className="letter-quill" aria-hidden="true">
                ✧
              </span>
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
              className="ink-button dispatch-button"
            >
              {disabled
                ? "Preview — sending disabled"
                : status === "sending"
                  ? "Dispatching…"
                  : "Send letter"}
              <span className="dispatch-glyph" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                >
                  <path d="m3 5 18-2-2 18-6-8-10-8Z" />
                  <path d="m13 13 8-10M13 13l-3 6-1-9" />
                </svg>
              </span>
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
