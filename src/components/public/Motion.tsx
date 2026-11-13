"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  type ComponentProps,
} from "react";
import { installPaperScroll } from "./PaperScroll";

const OPENED_KEY = "portfolio-newspaper-opened-v2";
const PAGE_ORDER = ["/", "/projects", "/about"];
const INTRO_MS = 3600;
const NavigationContext = createContext<(href: string) => void>(() => {});
type Scene = HTMLDivElement & { paperWatchdog?: number };
type Visit = { path: string; introStarted: number | null };

// Runs synchronously as HTML is parsed. No CMS strings enter the script.
// The watchdog releases the overlay even if hydration or chunk loading fails.
const bootScript = `(()=>{const p=document.getElementById('paper-scene');if(!p)return;try{if(!${JSON.stringify(PAGE_ORDER)}.includes(location.pathname)||location.hash||matchMedia('(prefers-reduced-motion: reduce)').matches||document.hidden)return;try{if(sessionStorage.getItem('${OPENED_KEY}'))return;sessionStorage.setItem('${OPENED_KEY}','true')}catch{}p.dataset.started=String(performance.now());p.dataset.motion='opening';p.paperWatchdog=setTimeout(()=>{delete p.dataset.motion;p.dataset.expired='true'},4500)}catch{}})()`;

function PaperPrint() {
  return (
    <div className="paper-print">
      <div className="paper-print-edition">
        ✦ &nbsp; THE INDEPENDENT EDITION &nbsp; ✦
      </div>
      <div className="paper-print-masthead" />
      <div className="paper-print-rule" />
      <div className="paper-print-headline" />
      <div className="paper-print-columns">
        <div />
        <div />
        <div />
      </div>
    </div>
  );
}

export function PaperLink({
  onNavigate,
  href,
  ...props
}: ComponentProps<typeof Link>) {
  const navigate = useContext(NavigationContext);
  return (
    <Link
      {...props}
      href={href}
      onNavigate={(event) => {
        let cancelled = false;
        onNavigate?.({
          preventDefault: () => {
            cancelled = true;
            event.preventDefault();
          },
        });
        if (!cancelled && typeof href === "string") navigate(href);
      }}
    />
  );
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const scope = useRef<HTMLDivElement>(null);
  const scene = useRef<Scene>(null);
  const lastVisit = useRef<Visit | null>(null);
  const navigation = useRef<(href: string) => void>(() => {});
  const dismiss = useRef<() => void>(() => {});
  const navigate = useCallback((href: string) => navigation.current(href), []);

  useLayoutEffect(() => {
    const root = scope.current;
    const paper = scene.current;
    if (!root || !paper) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = matchMedia("(max-width: 767px), (pointer: coarse)").matches;
    const previous = lastVisit.current;
    const routeChanged = previous !== null && previous.path !== path;
    const publicRoute = PAGE_ORDER.includes(path);
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let frame = 0;
    let generation = 0;
    let disposeRenderer: (() => void) | undefined;
    let alive = true;
    const later = (callback: () => void, delay: number) => {
      const timer = setTimeout(
        () => {
          timers.delete(timer);
          callback();
        },
        Math.max(0, delay),
      );
      timers.add(timer);
    };
    const title =
      root
        .querySelector("[data-newspaper-title]")
        ?.getAttribute("data-newspaper-title") ?? "";
    const headline = root.querySelector("h1")?.textContent ?? "";
    paper.querySelectorAll(".paper-print-masthead").forEach((el) => {
      el.textContent = title;
    });
    paper.querySelectorAll(".paper-print-headline").forEach((el) => {
      el.textContent = headline;
    });

    const release = (complete = true) => {
      generation++;
      timers.forEach(clearTimeout);
      timers.clear();
      clearTimeout(paper.paperWatchdog);
      cancelAnimationFrame(frame);
      disposeRenderer?.();
      disposeRenderer = undefined;
      delete paper.dataset.motion;
      delete paper.dataset.renderer;
      delete paper.dataset.stage;
      delete root.dataset.turning;
      if (complete && lastVisit.current) lastVisit.current.introStarted = null;
      if (paper.contains(document.activeElement))
        root
          .querySelector<HTMLElement>("#main-content")
          ?.focus({ preventScroll: true });
    };
    dismiss.current = () => release();

    if (!previous) {
      let started: number | null = null;
      if (
        publicRoute &&
        !location.hash &&
        !reduced.matches &&
        !document.hidden &&
        !paper.dataset.expired
      ) {
        if (paper.dataset.started) started = Number(paper.dataset.started);
        else {
          try {
            if (!sessionStorage.getItem(OPENED_KEY))
              started = performance.now();
            sessionStorage.setItem(OPENED_KEY, "true");
          } catch {
            started = performance.now();
          }
        }
      }
      lastVisit.current = { path, introStarted: started };
    } else if (routeChanged) lastVisit.current = { path, introStarted: null };

    const playTurn = (direction: "forward" | "backward") => {
      release();
      if (!publicRoute || reduced.matches || document.hidden || location.hash)
        return;
      void paper.offsetWidth;
      paper.dataset.motion = direction;
      root.dataset.turning = "true";
      later(() => release(), (mobile ? 650 : 900) + 150);
    };
    navigation.current = (href) => {
      release();
      const destination = new URL(href, location.href);
      if (
        reduced.matches ||
        document.hidden ||
        destination.origin !== location.origin ||
        destination.hash ||
        destination.pathname === path ||
        !PAGE_ORDER.includes(destination.pathname)
      )
        return;
      paper.dataset.motion = "cover";
      later(() => release(), 1200);
    };

    const start = lastVisit.current?.introStarted;
    if (start != null && !reduced.matches && !document.hidden) {
      const elapsed = performance.now() - start;
      if (elapsed >= INTRO_MS) release();
      else {
        delete paper.dataset.motion;
        void paper.offsetWidth;
        paper.style.setProperty("--intro-delay", `${-elapsed}ms`);
        paper.dataset.motion = "opening";
        paper.dataset.renderer = "css";
        paper.dataset.stage =
          elapsed < 500 ? "crumpled" : elapsed < 2500 ? "unfolding" : "flat";
        later(() => {
          paper.dataset.stage = "unfolding";
        }, 500 - elapsed);
        later(() => {
          paper.dataset.stage = "flat";
        }, 2500 - elapsed);
        later(() => {
          paper.dataset.stage = "revealing";
        }, 3200 - elapsed);
        later(() => release(), INTRO_MS - elapsed);
        const run = generation;
        const deadline = performance.now() + 400;
        void import("./PaperIntro")
          .then(({ createPaperIntro }) => {
            if (!alive || run !== generation || performance.now() > deadline)
              return;
            const host = paper.querySelector<HTMLDivElement>(".paper-canvas");
            if (!host) return;
            try {
              const renderer = createPaperIntro({
                host,
                title,
                headline,
                mobile,
                onError: () => release(),
              });
              if (
                !alive ||
                run !== generation ||
                performance.now() > deadline
              ) {
                renderer.dispose();
                return;
              }
              disposeRenderer = renderer.dispose;
              paper.dataset.renderer = "webgl";
              const tick = () => {
                if (!alive || run !== generation) return;
                try {
                  renderer.render(
                    Math.min(INTRO_MS, performance.now() - start),
                  );
                  frame = requestAnimationFrame(tick);
                } catch {
                  release();
                }
              };
              tick();
            } catch {
              /* The CSS intro is a complete fallback. */
            }
          })
          .catch(() => {
            /* A missing chunk cannot prevent access to the page. */
          });
      }
    } else if (routeChanged) {
      playTurn(
        PAGE_ORDER.indexOf(path) < PAGE_ORDER.indexOf(previous.path)
          ? "backward"
          : "forward",
      );
    } else release();

    const finish = (event: AnimationEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.classList.contains("paper-turn") &&
        event.animationName.startsWith("newspaper-turn")
      )
        release();
    };
    const interruptIntro = (event: Event) => {
      if (paper.dataset.motion !== "opening") return;
      if (
        event.target instanceof Element &&
        event.target.closest(".paper-skip")
      )
        return;
      if (event.type === "keydown" && (event as KeyboardEvent).key !== "Escape")
        return;
      if (event.type === "focusin" && paper.contains(event.target as Node))
        return;
      release();
    };
    const preferenceChanged = () => {
      if (reduced.matches) release();
    };
    const visibilityChanged = () => {
      if (document.hidden) release();
    };
    const resized = () => {
      if (paper.dataset.motion) release();
    };
    const scrollCleanup = installPaperScroll(root, reduced);
    const interrupts = [
      "wheel",
      "touchstart",
      "pointerdown",
      "focusin",
      "keydown",
      "scroll",
    ];
    interrupts.forEach((name) =>
      document.addEventListener(name, interruptIntro, { passive: true }),
    );
    paper.addEventListener("animationend", finish);
    reduced.addEventListener("change", preferenceChanged);
    document.addEventListener("visibilitychange", visibilityChanged);
    window.addEventListener("resize", resized);
    return () => {
      alive = false;
      release(false);
      navigation.current = () => {};
      dismiss.current = () => {};
      scrollCleanup();
      interrupts.forEach((name) =>
        document.removeEventListener(name, interruptIntro),
      );
      paper.removeEventListener("animationend", finish);
      reduced.removeEventListener("change", preferenceChanged);
      document.removeEventListener("visibilitychange", visibilityChanged);
      window.removeEventListener("resize", resized);
    };
  }, [path]);

  return (
    <NavigationContext.Provider value={navigate}>
      <div ref={scope} className="paper-experience">
        {children}
        <div
          id="paper-scene"
          ref={scene}
          className="paper-scene"
          suppressHydrationWarning
        >
          <div className="paper-visual" aria-hidden="true" inert>
            <div className="paper-intro-backdrop" />
            <div className="paper-intro-caption">
              <span>✦</span>
              <p>A new edition unfolds</p>
            </div>
            <div className="paper-canvas" />
            <div className="paper-fallback">
              <PaperPrint />
              <div className="paper-creases" />
            </div>
            <div className="paper-dust">
              {Array.from({ length: 12 }, (_, i) => (
                <i key={i} style={{ "--i": i } as React.CSSProperties} />
              ))}
            </div>
            <div className="paper-turn">
              <PaperPrint />
              <div className="paper-turn-curl" />
            </div>
          </div>
          <button
            className="paper-skip"
            type="button"
            onClick={() => dismiss.current()}
          >
            Skip intro <span aria-hidden="true">↗</span>
          </button>
        </div>
        <script
          type={
            typeof window === "undefined" ? "text/javascript" : "text/plain"
          }
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: bootScript }}
        />
      </div>
    </NavigationContext.Provider>
  );
}

export function EditorialArrow() {
  return (
    <span aria-hidden="true" className="editorial-arrow inline-block">
      →
    </span>
  );
}
