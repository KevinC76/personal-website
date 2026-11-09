"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="site-width py-24">
      <p className="eyebrow">Edition unavailable</p>
      <h1 className="section-title my-6">The press will be back shortly.</h1>
      <p className="mb-8">
        The published portfolio could not be loaded. Please try again in a
        moment.
      </p>
      <button className="ink-button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
