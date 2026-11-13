// Small, finite spells use compositor animations. Nothing runs while idle.
export function installPaperMagic(root: HTMLElement, reduced: MediaQueryList) {
  const layer = root.querySelector<HTMLElement>(".magic-dust-layer");
  const particles = new Map<HTMLElement, Animation>();
  let lastTrail = 0;
  let lastX = -1000;
  let lastY = -1000;
  const clear = () => {
    particles.forEach((animation, particle) => {
      animation.onfinish = null;
      animation.oncancel = null;
      animation.cancel();
      particle.remove();
    });
    particles.clear();
  };
  const emit = (x: number, y: number, count: number, dark = false) => {
    if (
      !layer ||
      reduced.matches ||
      document.hidden ||
      typeof layer.animate !== "function"
    )
      return;
    for (let i = 0; i < count; i++) {
      if (particles.size >= 24) {
        const first = particles.keys().next().value;
        if (first) {
          particles.get(first)?.cancel();
          first.remove();
          particles.delete(first);
        }
      }
      const particle = document.createElement("i");
      particle.className = `spell-mote${i % 3 === 0 ? " spell-star" : ""}`;
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.color = dark ? "#efd298" : "#98702f";
      layer.appendChild(particle);
      const angle = (i / Math.max(1, count)) * Math.PI * 2;
      const distance = count === 1 ? 14 : 18 + (i % 3) * 10;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - 16;
      const animation = particle.animate(
        [
          {
            transform: "translate(-50%, -50%) scale(.2) rotate(0deg)",
            opacity: 0,
          },
          { opacity: 0.85, offset: 0.15 },
          {
            transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.1) rotate(80deg)`,
            opacity: 0,
          },
        ],
        {
          duration: 540 + (i % 3) * 70,
          easing: "cubic-bezier(.18,.65,.3,1)",
          fill: "forwards",
        },
      );
      particles.set(particle, animation);
      const remove = () => {
        particle.remove();
        particles.delete(particle);
      };
      animation.onfinish = remove;
      animation.oncancel = remove;
    }
  };
  const interactive = (target: EventTarget | null) =>
    target instanceof Element
      ? target.closest<HTMLElement>(
          ".newspaper a, .newspaper button, .newspaper .paper-card, .newspaper .editorial-picture",
        )
      : null;
  const trail = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || event.buttons || reduced.matches)
      return;
    const target = interactive(event.target);
    if (!target || target.matches(":disabled")) return;
    const now = performance.now();
    if (
      now - lastTrail < 85 ||
      Math.hypot(event.clientX - lastX, event.clientY - lastY) < 12
    )
      return;
    lastTrail = now;
    lastX = event.clientX;
    lastY = event.clientY;
    emit(
      event.clientX,
      event.clientY,
      1,
      Boolean(target.closest(".ink-edition")),
    );
  };
  const press = (event: PointerEvent) => {
    const target = interactive(event.target);
    if (target && !target.matches(":disabled"))
      emit(
        event.clientX,
        event.clientY,
        7,
        Boolean(target.closest(".ink-edition")),
      );
  };
  const focus = (event: FocusEvent) => {
    if (
      !(event.target instanceof HTMLElement) ||
      !event.target.matches(".newspaper .public-input")
    )
      return;
    const box = event.target.getBoundingClientRect();
    emit(box.right - 12, Math.min(innerHeight - 20, box.bottom - 2), 5);
  };
  const visibility = () => {
    if (document.hidden) clear();
  };
  root.addEventListener("pointermove", trail, { passive: true });
  root.addEventListener("pointerdown", press, { passive: true });
  root.addEventListener("focusin", focus);
  reduced.addEventListener("change", clear);
  document.addEventListener("visibilitychange", visibility);
  return {
    reveal(element: HTMLElement) {
      const box = element.getBoundingClientRect();
      emit(
        Math.min(innerWidth - 24, box.right - 24),
        Math.max(24, Math.min(innerHeight - 24, box.top + 22)),
        6,
        Boolean(element.closest(".ink-edition")),
      );
    },
    dispose() {
      clear();
      root.removeEventListener("pointermove", trail);
      root.removeEventListener("pointerdown", press);
      root.removeEventListener("focusin", focus);
      reduced.removeEventListener("change", clear);
      document.removeEventListener("visibilitychange", visibility);
    },
  };
}
