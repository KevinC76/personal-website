"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const previousPath = useRef(path);
  useEffect(
    () => () => {
      delete document.documentElement.dataset.navigated;
    },
    [],
  );
  useEffect(() => {
    if (previousPath.current !== path)
      document.documentElement.dataset.navigated = "true";
    previousPath.current = path;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("ink-reveal");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      if (el.getBoundingClientRect().top > innerHeight) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [path]);
  return <>{children}</>;
}
export function EditorialArrow() {
  return (
    <span aria-hidden="true" className="editorial-arrow inline-block">
      →
    </span>
  );
}
