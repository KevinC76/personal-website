"use client";
import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const OPENED_KEY = "portfolio-newspaper-opened";
const PAGE_ORDER = ["/", "/projects", "/about"];
type PaperMotion = "opening" | "forward" | "backward" | null;

function PaperPrint() {
  return (
    <div className="paper-print">
      <div className="paper-print-edition" />
      <div className="paper-print-masthead" />
      <div className="paper-print-rule" />
      <div className="paper-print-columns">
        <div />
        <div />
        <div />
      </div>
    </div>
  );
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const scene = useRef<HTMLDivElement>(null);
  const lastVisit = useRef<{ path: string; motion: PaperMotion } | null>(null);

  useLayoutEffect(() => {
    const paper = scene.current;
    if (!paper) return;
    if (lastVisit.current?.path !== path) {
      let motion: PaperMotion;
      if (lastVisit.current) {
        motion =
          PAGE_ORDER.indexOf(path) < PAGE_ORDER.indexOf(lastVisit.current.path)
            ? "backward"
            : "forward";
      } else {
        motion = "opening";
        try {
          if (sessionStorage.getItem(OPENED_KEY)) motion = null;
          sessionStorage.setItem(OPENED_KEY, "true");
        } catch {
          // Storage can be disabled. The persistent layout still limits the intro
          // to one play during this visit, without interfering with navigation.
        }
      }
      lastVisit.current = { path, motion };
    }

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let fallback: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      delete paper.dataset.motion;
      clearTimeout(fallback);
    };
    const finish = (event: AnimationEvent) => {
      if (
        !event.pseudoElement &&
        event.target instanceof HTMLElement &&
        event.target.matches(".paper-opening-right, .paper-turn")
      )
        stop();
    };
    const motion = lastVisit.current.motion;
    if (motion && !reducedMotion.matches && !document.hidden) {
      // Copy only the current CMS masthead, never a screenshot or a duplicate
      // page tree. The decorative surface stays small even on long pages.
      const title = document
        .querySelector("[data-newspaper-title]")
        ?.getAttribute("data-newspaper-title");
      paper.querySelectorAll(".paper-print-masthead").forEach((el) => {
        el.textContent = title ?? "";
      });
      paper.dataset.motion = motion;
      // Animation events do the normal cleanup. This also releases the layers
      // if a resize, browser interruption, or a CSS override cancels the event.
      fallback = setTimeout(stop, motion === "opening" ? 1100 : 3400);
    }

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
    if (!reducedMotion.matches)
      document.querySelectorAll("[data-reveal]").forEach((el) => {
        if (el.getBoundingClientRect().top > innerHeight) observer.observe(el);
      });
    const preferenceChanged = () => {
      if (reducedMotion.matches) {
        stop();
        observer.disconnect();
      }
    };
    const visibilityChanged = () => {
      if (document.hidden) stop();
    };
    paper.addEventListener("animationend", finish);
    reducedMotion.addEventListener("change", preferenceChanged);
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => {
      stop();
      observer.disconnect();
      paper.removeEventListener("animationend", finish);
      reducedMotion.removeEventListener("change", preferenceChanged);
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, [path]);
  return (
    <>
      {children}
      <div
        key={path}
        ref={scene}
        className="paper-scene"
        aria-hidden="true"
        inert
      >
        <div className="paper-leaf paper-opening-left">
          <PaperPrint />
        </div>
        <div className="paper-leaf paper-opening-right">
          <PaperPrint />
        </div>
        <div className="paper-leaf paper-turn">
          <PaperPrint />
        </div>
      </div>
    </>
  );
}
export function EditorialArrow() {
  return (
    <span aria-hidden="true" className="editorial-arrow inline-block">
      →
    </span>
  );
}
