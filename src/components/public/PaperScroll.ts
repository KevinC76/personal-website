// All work is driven by intersection/scroll events. There is no idle RAF loop.
export function installPaperScroll(root: HTMLElement, reduced: MediaQueryList) {
  const visible = new Set<HTMLElement>();
  const pictures = Array.from(
    root.querySelectorAll<HTMLElement>(".editorial-picture"),
  );
  const reveals = Array.from(
    root.querySelectorAll<HTMLElement>("[data-reveal]"),
  );
  let frame = 0;
  const update = () => {
    frame = 0;
    if (reduced.matches || document.hidden) return;
    visible.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const progress =
        (innerHeight / 2 - rect.top - rect.height / 2) /
        (innerHeight / 2 + rect.height / 2);
      el.style.setProperty(
        "--photo-drift",
        `${Math.max(-12, Math.min(12, progress * 12)).toFixed(2)}px`,
      );
    });
  };
  const schedule = () => {
    if (!frame && !reduced.matches && !document.hidden)
      frame = requestAnimationFrame(update);
  };
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (el.classList.contains("editorial-picture")) {
          if (entry.isIntersecting) visible.add(el);
          else visible.delete(el);
        } else if (entry.isIntersecting) {
          if (!reduced.matches) el.classList.add("ink-reveal");
          observer.unobserve(el);
        }
      });
      schedule();
    },
    { threshold: 0.06 },
  );
  const configure = () => {
    observer.disconnect();
    visible.clear();
    cancelAnimationFrame(frame);
    frame = 0;
    pictures.forEach((el) => el.style.removeProperty("--photo-drift"));
    reveals.forEach((el) => el.classList.remove("ink-reveal"));
    if (reduced.matches) return;
    pictures.forEach((el) => observer.observe(el));
    reveals.forEach((el) => {
      if (el.getBoundingClientRect().top >= innerHeight) observer.observe(el);
    });
  };
  const finish = (event: AnimationEvent) => {
    if (
      event.animationName === "ink-unfold" &&
      event.target instanceof HTMLElement
    )
      event.target.classList.remove("ink-reveal");
  };
  const visibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else schedule();
  };
  configure();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  document.addEventListener("visibilitychange", visibility);
  reduced.addEventListener("change", configure);
  root.addEventListener("animationend", finish);
  return () => {
    observer.disconnect();
    cancelAnimationFrame(frame);
    pictures.forEach((el) => el.style.removeProperty("--photo-drift"));
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    document.removeEventListener("visibilitychange", visibility);
    reduced.removeEventListener("change", configure);
    root.removeEventListener("animationend", finish);
  };
}
