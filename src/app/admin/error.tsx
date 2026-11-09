"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <main className="site-width py-24">
      <h1 className="section-title">The editorial office is unavailable.</h1>
      <p className="my-6">
        Check your connection and cloud setup, then try again. No content has
        been published by this page.
      </p>
      <button className="ink-button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
