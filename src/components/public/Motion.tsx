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
import { installPaperMagic } from "./PaperMagic";

const OPENED_KEY = "portfolio-newspaper-opened-v2";
const PAGE_ORDER = ["/", "/projects", "/about"];
const INTRO_MS = 3600;
const NavigationContext = createContext<(href: string) => void>(() => {});
type Scene = HTMLDivElement & { paperWatchdog?: number };
type Visit = { path: string; introStarted: number | null };
type Edition = { title: string; headline: string };

// Runs synchronously as HTML is parsed. No CMS strings enter the script.
// The watchdog releases the overlay even if hydration or chunk loading fails.
const bootScript = `(()=>{const p=document.getElementById('paper-scene');if(!p)return;try{if(!${JSON.stringify(PAGE_ORDER)}.includes(location.pathname)||location.hash||matchMedia('(prefers-reduced-motion: reduce)').matches||document.hidden)return;try{if(sessionStorage.getItem('${OPENED_KEY}'))return;sessionStorage.setItem('${OPENED_KEY}','true')}catch{}p.dataset.started=String(performance.now());p.dataset.motion='preparing';p.paperWatchdog=setTimeout(()=>{delete p.dataset.motion;p.dataset.expired='true'},4500)}catch{}})()`;

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

// Connected CSS hinges approximate a curved leaf. Each face is a clipped slice
// of the same decorative print; the accessible page is never duplicated.
function PaperLeaf({ index = 0 }: { index?: number }) {
  return (
    <div
      className="paper-leaf"
      style={{ "--segment": index } as React.CSSProperties}
    >
      <div className="paper-leaf-face paper-leaf-front">
        <PaperPrint />
      </div>
      <div className="paper-leaf-face paper-leaf-back">
        <PaperPrint />
      </div>
      {index < 3 && <PaperLeaf index={index + 1} />}
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
  const lastEdition = useRef<Edition | null>(null);
  const navigation = useRef<(href: string) => void>(() => {});
  const dismiss = useRef<() => void>(() => {});
  const navigate = useCallback((href: string) => navigation.current(href), []);

  useLayoutEffect(() => {
    const root = scope.current;
    const paper = scene.current;
    if (!root || !paper) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const sizePaper = () =>
      paper.style.setProperty("--paper-width", `${paper.clientWidth}px`);
    sizePaper();
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
    const edition = { title, headline };
    const printEdition = (selector: string, content: Edition) => {
      paper
        .querySelectorAll(`${selector} .paper-print-masthead`)
        .forEach((el) => {
          el.textContent = content.title;
        });
      paper
        .querySelectorAll(`${selector} .paper-print-headline`)
        .forEach((el) => {
          el.textContent = content.headline;
        });
    };
    printEdition(".paper-fallback", edition);
    printEdition(
      ".paper-turn",
      routeChanged && lastEdition.current ? lastEdition.current : edition,
    );
    lastEdition.current = edition;

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
      delete paper.dataset.direction;
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
      paper.dataset.direction = direction;
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
      printEdition(".paper-turn", edition);
      paper.dataset.direction =
        PAGE_ORDER.indexOf(destination.pathname) < PAGE_ORDER.indexOf(path)
          ? "backward"
          : "forward";
      paper.dataset.motion = "cover";
      later(() => release(), 1200);
    };

    if (
      lastVisit.current?.introStarted != null &&
      !reduced.matches &&
      !document.hidden
    ) {
      // Hold one centered crumple while choosing a renderer. The unfolding
      // clock starts only once, after that decision; no mid-animation swap.
      paper.dataset.motion = "preparing";
      const run = generation;
      const deadline = performance.now() + 400;
      let chosen = false;
      type Renderer = {
        render: (elapsed: number) => void;
        dispose: () => void;
      };
      const begin = (renderer?: Renderer) => {
        if (chosen || !alive || run !== generation) {
          renderer?.dispose();
          return;
        }
        chosen = true;
        const start = performance.now();
        if (lastVisit.current) lastVisit.current.introStarted = start;
        disposeRenderer = renderer?.dispose;
        clearTimeout(paper.paperWatchdog);
        paper.style.setProperty("--intro-delay", "0ms");
        paper.dataset.renderer = renderer ? "webgl" : "css";
        paper.dataset.stage = "crumpled";
        paper.dataset.motion = "opening";
        later(() => {
          paper.dataset.stage = "unfolding";
        }, 500);
        later(() => {
          paper.dataset.stage = "flat";
        }, 2500);
        later(() => {
          paper.dataset.stage = "revealing";
        }, 3200);
        later(() => release(), INTRO_MS);
        if (renderer) {
          const tick = () => {
            if (!alive || run !== generation) return;
            try {
              renderer.render(Math.min(INTRO_MS, performance.now() - start));
              frame = requestAnimationFrame(tick);
            } catch {
              release();
            }
          };
          tick();
        }
      };
      later(() => begin(), 400);
      void import("./PaperIntro")
        .then(({ createPaperIntro }) => {
          if (
            chosen ||
            !alive ||
            run !== generation ||
            performance.now() > deadline
          )
            return;
          const host = paper.querySelector<HTMLDivElement>(".paper-canvas");
          if (!host) {
            begin();
            return;
          }
          try {
            const renderer = createPaperIntro({
              host,
              title,
              headline,
              mobile,
              onError: () => release(),
            });
            if (performance.now() > deadline) {
              renderer.dispose();
              begin();
            } else begin(renderer);
          } catch {
            begin();
          }
        })
        .catch(() => begin());
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
      if (!["preparing", "opening"].includes(paper.dataset.motion ?? ""))
        return;
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
      sizePaper();
    };
    const magic = installPaperMagic(root, reduced);
    const scrollCleanup = installPaperScroll(root, reduced, magic.reveal);
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
      magic.dispose();
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
        <div className="magic-dust-layer" aria-hidden="true" inert />
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
            <div className="paper-knot" />
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
            <div className="paper-turn-shadow" />
            <div className="paper-turn">
              <PaperLeaf />
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
