import { BufferAttribute, BufferGeometry, PlaneGeometry } from "three";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";

// A continuous, open sheet: its four edges gather behind the face instead of
// joining a sphere's seam. Fixed targets keep all deformation on the GPU.
export function createPaperGeometry(
  width: number,
  height: number,
  mobile: boolean,
) {
  const columns = mobile ? 26 : 42;
  const rows = mobile ? 34 : 54;
  const geometry = new PlaneGeometry(width, height, columns, rows);
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const gathered = new Float32Array(position.count * 3);
  const unfurled = new Float32Array(position.count * 3);
  const creased = new Float32Array(position.count * 3);
  const color = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    let u = uv.getX(i),
      v = uv.getY(i);
    // Uneven triangles produce irregular creases, without a regular grid of
    // identical facets. Boundary vertices stay on the original sheet edges.
    if (u > 0 && u < 1 && v > 0 && v < 1) {
      u += (Math.sin(i * 127.1) * 0.3) / columns;
      v += (Math.sin(i * 311.7) * 0.3) / rows;
    }
    uv.setXY(i, u, v);
    const x = (u - 0.5) * width,
      y = (v - 0.5) * height;
    position.setXYZ(i, x, y, 0);
    const a = u * 2 - 1,
      b = v * 2 - 1;
    const radial = Math.hypot(a, b);
    const angle = Math.atan2(b, a);
    const crease = paperCrease(u, v);
    const radius =
      0.9 + crease * 0.24 + Math.sin(angle * 5 + radial * 9) * 0.07;
    const curl = radial * (2.35 + 0.18 * Math.sin(angle * 3 + 0.4));
    const tuck = Math.max(0, radial - 0.7);
    gathered.set(
      [
        Math.sin(curl) * Math.cos(angle) * radius +
          Math.sin(b * 13) * tuck * 0.09,
        Math.sin(curl) * Math.sin(angle) * radius * 1.06,
        Math.cos(curl) * radius + crease * 0.12,
      ],
      i * 3,
    );
    // The lower-left corner releases first; the upper-right stays curled for
    // another beat. A cupped intermediate target gives the sheet real depth.
    const corner = Math.max(0, a * 0.7 + b * 0.65 - 0.45);
    unfurled.set(
      [
        x * 0.66 - corner * 0.35,
        y * 0.7 - corner * 0.4,
        (a * a + b * b) * 0.38 + crease * 0.24 + corner * 0.75,
      ],
      i * 3,
    );
    creased.set(
      [
        x * 0.96,
        y * 0.96,
        crease * 0.09 + Math.abs(a) * 0.08 + Math.sin(v * 9) * 0.035,
      ],
      i * 3,
    );
    const grain = 0.96 + 0.04 * Math.sin(u * 81 + v * 49) ** 2;
    color.set([grain, grain, grain], i * 3);
  }
  // Alternate triangle diagonals so the light catches folds in both directions.
  const indices = geometry.index!;
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < columns; x++) {
      if ((x + y) % 2 === 0) continue;
      const a = y * (columns + 1) + x,
        b = a + columns + 1;
      const offset = (y * columns + x) * 6;
      [a, b, b + 1, a, b + 1, a + 1].forEach((value, j) =>
        indices.setX(offset + j, value),
      );
    }
  geometry.setAttribute("color", new BufferAttribute(color, 3));
  geometry.morphAttributes.position = [gathered, unfurled, creased].map(
    (target) => new BufferAttribute(target, 3),
  );
  geometry.computeVertexNormals();
  const normals = geometry.morphAttributes.position.map((target) => {
    const surface = new BufferGeometry();
    surface.setIndex(indices);
    surface.setAttribute("position", target);
    const folded = toCreasedNormals(surface, Math.PI / 5);
    const normals = folded.attributes.normal.clone();
    folded.dispose();
    surface.dispose();
    return normals;
  });
  const sheet = geometry.toNonIndexed();
  geometry.dispose();
  sheet.morphAttributes.normal = normals;
  return sheet;
}

export function paperCrease(u: number, v: number) {
  return (
    (Math.abs(Math.sin(u * 19 + v * 8 + 0.4)) - 0.5) * 0.9 +
    (Math.abs(Math.sin(v * 23 - u * 7)) - 0.5) * 0.65 +
    Math.sin(u * 31 + v * 27) * 0.16
  );
}
