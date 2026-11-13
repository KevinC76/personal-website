import {
  AmbientLight,
  CanvasTexture,
  DirectionalLight,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PCFSoftShadowMap,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";
import { createPaperGeometry, paperCrease } from "./PaperGeometry";

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
  const words = Array.from(document.querySelectorAll(".newspaper main p"))
    .map((element) => element.textContent ?? "")
    .join(" ")
    .split(/\s+/)
    .filter(Boolean);
  let word = 0;
  ctx.font = `${Math.max(7, w * 0.007)}px Georgia`;
  const spaceWidth = ctx.measureText(" ").width;
  const wordWidths = new Map(
    [...new Set(words)].map((text) => [text, ctx.measureText(text).width]),
  );
  for (let col = 0; col < 3; col++) {
    const colWidth = (w - margin * 2) / 3;
    const x = margin + col * colWidth;
    ctx.fillStyle = "#30251ba6";
    ctx.textAlign = "left";
    for (let y = articleTop; y < h - margin; y += Math.max(7, w * 0.009)) {
      let line = "";
      let lineWidth = 0;
      while (words.length) {
        const next = words[word % words.length];
        const nextWidth = wordWidths.get(next)! + (line ? spaceWidth : 0);
        if (line && lineWidth + nextWidth > colWidth - 24) break;
        line += `${line ? " " : ""}${next}`;
        lineWidth += nextWidth;
        word++;
      }
      ctx.fillText(line, x, y, colWidth - 24);
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

function paperBump() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");
  const pixels = context.createImageData(256, 256);
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      const value =
        128 +
        paperCrease(x / 255, 1 - y / 255) * 70 +
        Math.sin(x * 73 + y * 127) * 9;
      const i = (y * 256 + x) * 4;
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
      pixels.data[i + 3] = 255;
    }
  context.putImageData(pixels, 0, 0);
  return new CanvasTexture(canvas);
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
    const camera = new PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 30);
    camera.position.z = height / (2 * Math.tan((35 * Math.PI) / 360));
    const geometry = createPaperGeometry(width, height, mobile);
    cleanups.push(() => geometry.dispose());
    const texture = printTexture(title, headline, mobile);
    cleanups.push(() => texture.dispose());
    const fibers = mobile ? undefined : paperBump();
    if (fibers) cleanups.push(() => fibers.dispose());
    const material = new MeshStandardMaterial({
      map: texture,
      side: DoubleSide,
      vertexColors: true,
      bumpMap: fibers,
      bumpScale: 0.014,
      roughness: 1,
      metalness: 0,
      flatShading: false,
    });
    cleanups.push(() => material.dispose());
    const sheet = new Mesh(geometry, material);
    sheet.frustumCulled = false;
    sheet.castShadow = !mobile;
    sheet.receiveShadow = !mobile;
    scene.add(sheet);
    const ambient = new AmbientLight(0xfff5e5, mobile ? 0.95 : 0.8);
    scene.add(ambient);
    const light = new DirectionalLight(0xfff4df, 3.1);
    light.position.set(-3, 4, 6);
    // One small shadow map on desktop only; mobile uses directional shading.
    if (!mobile) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = PCFSoftShadowMap;
      light.castShadow = true;
      light.shadow.mapSize.set(512, 512);
      Object.assign(light.shadow.camera, {
        left: -5,
        right: 5,
        top: 5,
        bottom: -5,
        near: 0.5,
        far: 20,
      });
      light.shadow.normalBias = 0.035;
      light.shadow.bias = -0.0004;
      cleanups.push(() => light.shadow.dispose());
    }
    scene.add(light);
    const rim = new DirectionalLight(0xd4dcea, 0.85);
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
      const open = ease((elapsed - 450) / 1450);
      const spread = ease((elapsed - 1400) / 1100);
      const flatten = ease((elapsed - 2450) / 750);
      sheet.morphTargetInfluences![0] = 1 - open;
      sheet.morphTargetInfluences![1] = open * (1 - spread);
      sheet.morphTargetInfluences![2] = open * spread * (1 - flatten);
      const lift = ease(elapsed / 450);
      const settle = Math.sin(spread * Math.PI) * 0.045;
      sheet.rotation.set(
        (0.18 * (1 - open) - 0.12 * spread + settle) * (1 - flatten),
        -0.38 * (1 - open) + 0.12 * Math.sin(spread * Math.PI),
        (-0.22 * (1 - open) + 0.035 * Math.sin(spread * Math.PI)) *
          (1 - flatten),
      );
      sheet.position.set(
        0,
        (-0.15 * (1 - lift) + Math.sin(open * Math.PI) * 0.12) * (1 - flatten),
        0,
      );
      sheet.scale.setScalar(0.9 + 0.1 * lift);
      // Light broadens as the sheet flattens; the final frame matches the page.
      ambient.intensity = (mobile ? 0.95 : 0.8) + flatten * 0.75;
      light.intensity = 3.1 - flatten * 0.9;
      material.bumpScale = 0.014 * (1 - flatten * 0.8);
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
