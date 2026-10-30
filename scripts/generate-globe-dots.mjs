// One-time script: fetch world-atlas 50m land, carve Natural Earth 50m lakes,
// sample a dot grid, write public/land-dots.json.
// Needs network ONCE. The committed output keeps the app offline afterwards.
// Usage: node scripts/generate-globe-dots.mjs
import { writeFile } from "node:fs/promises";

const ATLAS_URL = "https://unpkg.com/world-atlas@2/countries-50m.json";
const LAKES_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_lakes.geojson";
const STEP = 1.0;

const res = await fetch(ATLAS_URL);
if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
const topo = await res.json();
const lakesRes = await fetch(LAKES_URL);
if (!lakesRes.ok) throw new Error(`lakes fetch failed: ${lakesRes.status}`);
const lakes = await lakesRes.json();

// Minimal TopoJSON decode: delta-decode arcs, apply transform.
const { scale, translate } = topo.transform;
const decoded = topo.arcs.map((arc) => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => {
    x += dx; y += dy;
    return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
  });
});
// Group rings per polygon: even-odd runs INSIDE one polygon (outer ring +
// holes), then OR across polygons. A flat some() over every ring would paint
// holes and degenerate shared rings as land.
function joinRing(arcIds) {
  // Stitch the TopoJSON arcs of one ring into a single point loop.
  const pts = [];
  for (const id of arcIds) {
    const arc = decoded[id < 0 ? ~id : id];
    const seq = id < 0 ? [...arc].reverse() : arc;
    for (let k = 0; k < seq.length; k++) {
      if (pts.length > 0 && k === 0) continue;
      pts.push(seq[k]);
    }
  }
  return normRing(pts);
}

function normRing(pts) {
  // Rings crossing the antimeridian would span the whole map in planar
  // coordinates and break ray-casting;unwrap them past +180 instead.
  let x0 = Infinity, x1 = -Infinity;
  for (const [x] of pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
  if (x1 - x0 <= 180) return { pts, shifted: false };
  const out = pts.map(([x, y]) => (x < 0 ? [x + 360, y] : [x, y]));
  return { pts: out, shifted: true };
}

function ringTest(lng, lat, ring) {
  const q = ring.shifted && lng < 0 ? lng + 360 : lng;
  return inRing(q, lat, ring.pts);
}

const landPolys = [];
for (const geom of topo.objects.countries.geometries) {
  const polys = geom.type === "Polygon" ? [geom.arcs] : geom.type === "MultiPolygon" ? geom.arcs : [];
  for (const poly of polys) {
    const rings = poly.map(joinRing).filter((ring) => ring.pts.length > 2);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const ring of rings) for (const [x, y] of ring.pts) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    landPolys.push({ rings, x0, x1, y0, y1 });
  }
}

function inRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function onLand(lng, lat) {
  for (const { rings, x0, x1, y0, y1 } of landPolys) {
    const q = lng < x0 ? lng + 360 : lng;
    if (q < x0 || q > x1 || lat < y0 || lat > y1) continue;
    let inside = false;
    for (const ring of rings) if (ringTest(lng, lat, ring)) inside = !inside;
    if (inside) return true;
  }
  return false;
}

// Lake polygons (per-polygon even-odd so holes/islands behave) with bbox prefilter.
const lakePolys = [];
for (const feature of lakes.features ?? []) {
  const geom = feature.geometry;
  if (!geom) continue;
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.type === "MultiPolygon" ? geom.coordinates : [];
  for (const poly of polys) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const ring of poly) for (const [x, y] of ring) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    lakePolys.push({ poly, x0, x1, y0, y1 });
  }
}
function inLake(lng, lat) {
  for (const { poly, x0, x1, y0, y1 } of lakePolys) {
    const q = lng < x0 ? lng + 360 : lng;
    if (q < x0 || q > x1 || lat < y0 || lat > y1) continue;
    let inside = false;
    for (const ring of poly) if (ringTest(lng, lat, normRing(ring))) inside = !inside;
    if (inside) return true;
  }
  return false;
}

const dots = [];
for (let lat = -58; lat <= 80; lat += STEP) {
  for (let lng = -180; lng < 180; lng += STEP) {
    const c = [lng + STEP / 2, lat + STEP / 2];
    if (inLake(c[0], c[1])) continue;
    if (onLand(c[0], c[1])) dots.push([Math.round(c[1] * 100) / 100, Math.round(c[0] * 100) / 100]);
  }
}
await writeFile(new URL("../public/land-dots.json", import.meta.url), JSON.stringify({ step: STEP, dots }));
console.log(`wrote ${dots.length} land dots`);
