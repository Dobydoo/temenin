// One-time script: fetch world-atlas 110m land, sample a dot grid, write public/land-dots.json.
// Needs network ONCE. The committed output keeps the app offline afterwards.
// Usage: node scripts/generate-globe-dots.mjs
import { writeFile } from "node:fs/promises";

const ATLAS_URL = "https://unpkg.com/world-atlas@2/countries-110m.json";
const STEP = 1.6;

const res = await fetch(ATLAS_URL);
if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
const topo = await res.json();

// Minimal TopoJSON decode: delta-decode arcs, apply transform.
const { scale, translate } = topo.transform;
const arcs = topo.objects.countries.geometries.flatMap((g) => (g.type === "Polygon" ? [g.arcs] : g.arcs));
const decoded = topo.arcs.map((arc) => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => {
    x += dx; y += dy;
    return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
  });
});
// Ring direction does not matter for the even-odd inside test.
const rings = arcs.flat(2).map((i) => decoded[i < 0 ? ~i : i]);

function inRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const dots = [];
for (let lat = -58; lat <= 80; lat += STEP) {
  for (let lng = -180; lng < 180; lng += STEP) {
    const c = [lng + STEP / 2, lat + STEP / 2];
    if (rings.some((ring) => inRing(c[0], c[1], ring))) dots.push([Math.round(c[1] * 100) / 100, Math.round(c[0] * 100) / 100]);
  }
}
await writeFile(new URL("../public/land-dots.json", import.meta.url), JSON.stringify({ step: STEP, dots }));
console.log(`wrote ${dots.length} land dots`);
