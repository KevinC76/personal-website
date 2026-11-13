import {
  AmbientLight,
  BufferAttribute,
  CanvasTexture,
  DirectionalLight,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";

type Options = {
  host: HTMLElement;
  title: string;
  headline: string;
  mobile: boolean;
  onError: () => void;
};

const ease = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

function printTexture(title: string, headline: string, mobile: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = mobile ? 768 : 1536;
  canvas.height = Math.round((canvas.width * innerHeight) / innerWidth);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable");
  const w = canvas.width,
    h = canvas.height;
  const margin = w * 0.055;
  ctx.fillStyle = "#e8d8b7";
  ctx.fillRect(0, 0, w, h);
  const wash = ctx.createRadialGradient(
    w / 2,
    h / 3,
    0,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.7,
  );
  wash.addColorStop(0, "#faf0d440");
  wash.addColorStop(1, "#72532f40");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  let seed = 41;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 6500; i++) {
    ctx.fillStyle = `rgba(76,49,24,${random() * 0.1})`;
    ctx.fillRect(random() * w, random() * h, 1 + random() * 2, 1);
  }
  ctx.fillStyle = "#30251b";
  ctx.textAlign = "center";
  const scale = w / innerWidth;
  const masthead = document.querySelector<HTMLElement>(".masthead-title");
  const headlineElement = document.querySelector<HTMLElement>(".newspaper h1");
  const drawText = (
    text: string,
    element: HTMLElement | null,
    fallbackY: number,
    fallbackSize: number,
  ) => {
    const rect = element?.getBoundingClientRect();
    const style = element ? getComputedStyle(element) : null;
    const size = style ? parseFloat(style.fontSize) * scale : fallbackSize;
    ctx.font = `${style?.fontStyle ?? "normal"} ${style?.fontWeight ?? "800"} ${size}px ${style?.fontFamily ?? "Georgia"}`;
    // Use the real line positions, including balanced headings and CMS text.
    // Only typography is painted; we never screenshot or clone the page tree.
    if (element && rect && style) {
      ctx.textAlign = "left";
      ctx.letterSpacing = `${(parseFloat(style.letterSpacing) || 0) * scale}px`;
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      let node: Node | null;
      while ((node = walker.nextNode())) {
        for (const word of (node.textContent ?? "").matchAll(/\S+/g)) {
          range.setStart(node, word.index);
          range.setEnd(node, word.index + word[0].length);
          const box = range.getBoundingClientRect();
          ctx.fillText(
            style.textTransform === "uppercase"
              ? word[0].toUpperCase()
              : word[0],
            box.left * scale,
            box.top * scale + size * 0.78,
          );
        }
      }
      ctx.textAlign = "center";
      ctx.letterSpacing = "0px";
      return rect.bottom * scale + 12;
    }
    const x = rect ? (rect.left + rect.width / 2) * scale : w / 2;
    const y = rect ? rect.top * scale + size * 0.78 : fallbackY;
    ctx.fillText(text, x, y, rect ? rect.width * scale : w - 2 * margin);
    return rect ? rect.bottom * scale + 12 : y + size * 0.4;
  };
  ctx.font = `${Math.max(9, w * 0.008)}px Georgia`;
  ctx.fillText(
    "✦   THE INDEPENDENT EDITION   ✦",
    w / 2,
    Math.max(20, h * 0.035),
  );
  const rule = drawText(title.toUpperCase(), masthead, h * 0.16, w * 0.06);
  ctx.fillRect(margin, rule, w - margin * 2, 3);
  ctx.fillRect(margin, rule + 6, w - margin * 2, 1);
  const articleTop = Math.max(
    rule + 35,
    drawText(headline, headlineElement, h * 0.3, w * 0.055) + 25,
  );
  for (let col = 0; col < 3; col++) {
    const colWidth = (w - margin * 2) / 3;
    const x = margin + col * colWidth;
    ctx.fillStyle = "#30251b35";
    for (let y = articleTop; y < h - margin; y += Math.max(7, w * 0.009)) {
      const length = colWidth * (0.65 + random() * 0.25);
      ctx.fillRect(x, y, length, Math.max(1, w * 0.0015));
    }
    ctx.fillRect(x + colWidth - 14, articleTop, 1, h - articleTop - margin);
  }
  ctx.strokeStyle = "#4b382528";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A single connected sheet with fixed, deterministic morph targets. */
export function createPaperIntro({
  host,
  title,
  headline,
  mobile,
  onError,
}: Options) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl2", {
    alpha: true,
    antialias: !mobile,
    powerPreference: "low-power",
  });
  if (!context) throw new Error("WebGL 2 unavailable");
  let disposed = false;
  const cleanups: (() => void)[] = [
    () => context.getExtension("WEBGL_lose_context")?.loseContext(),
    () => canvas.remove(),
  ];
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const cleanup of cleanups.reverse()) {
      try {
        cleanup();
      } catch {
        /* Continue releasing the remaining resources. */
      }
    }
  };
  try {
    const renderer = new WebGLRenderer({
      canvas,
      context,
      alpha: true,
      antialias: !mobile,
    });
    cleanups.push(() => renderer.dispose());
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1 : 1.5));
    renderer.setSize(innerWidth, innerHeight);
    renderer.setClearColor(0x000000, 0);
    const scene = new Scene();
    const height = 6;
    const width = (height * innerWidth) / innerHeight;
    const camera = new OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0.1,
      30,
    );
    camera.position.z = 10;
    const geometry = new PlaneGeometry(
      width,
      height,
      mobile ? 30 : 52,
      mobile ? 38 : 62,
    );
    cleanups.push(() => geometry.dispose());
    const positions = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    const crumpled = new Float32Array(positions.count * 3);
    const creased = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i++) {
      const u = uv.getX(i),
        v = uv.getY(i);
      const fold = Math.sin(u * 27 + v * 13) * Math.cos(v * 26 - u * 9);
      const ridges = Math.abs(Math.sin(u * 17 - v * 21));
      const radius = 0.85 + fold * 0.09 + ridges * 0.1;
      const theta = u * Math.PI * 1.9 + v * 0.35;
      const phi = (1 - v) * Math.PI * 0.88 + 0.19;
      crumpled.set(
        [
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.cos(theta),
        ],
        i * 3,
      );
      creased.set(
        [
          positions.getX(i) * 0.78 + fold * 0.06,
          positions.getY(i) * 0.82 + fold * 0.04,
          fold * 0.13 + ridges * 0.12 + Math.sin(u * Math.PI * 4) * 0.09,
        ],
        i * 3,
      );
    }
    geometry.morphAttributes.position = [
      new BufferAttribute(crumpled, 3),
      new BufferAttribute(creased, 3),
    ];
    const texture = printTexture(title, headline, mobile);
    cleanups.push(() => texture.dispose());
    const material = new MeshStandardMaterial({
      map: texture,
      side: DoubleSide,
      roughness: 1,
      metalness: 0,
      flatShading: true,
    });
    cleanups.push(() => material.dispose());
    const sheet = new Mesh(geometry, material);
    sheet.frustumCulled = false;
    scene.add(sheet);
    scene.add(new AmbientLight(0xffffff, 2));
    const light = new DirectionalLight(0xfff4df, 2.2);
    light.position.set(-3, 4, 6);
    scene.add(light);
    const rim = new DirectionalLight(0xb4b8c7, 0.7);
    rim.position.set(4, -1, -2);
    scene.add(rim);
    const lost = (event: Event) => {
      event.preventDefault();
      onError();
    };
    canvas.addEventListener("webglcontextlost", lost);
    cleanups.push(() => canvas.removeEventListener("webglcontextlost", lost));
    const render = (elapsed: number) => {
      if (disposed) return;
      const open = ease((elapsed - 500) / 2000);
      const flatten = ease((elapsed - 2300) / 900);
      sheet.morphTargetInfluences![0] = 1 - open;
      sheet.morphTargetInfluences![1] = open * (1 - flatten);
      sheet.rotation.set(
        (0.22 + Math.sin(elapsed * 0.001) * 0.05) * (1 - flatten),
        -0.42 * (1 - open),
        -0.28 * (1 - flatten),
      );
      sheet.position.y =
        Math.sin(Math.min(elapsed, 2500) * 0.0013) * 0.07 * (1 - flatten);
      renderer.render(scene, camera);
    };
    render(0); // Compile shaders before swapping the visible fallback.
    host.appendChild(canvas);
    return { render, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
