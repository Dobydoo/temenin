"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type GlobePin = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  score: number;
};

type Props = {
  pins: GlobePin[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  label: string;
  zoomInLabel?: string;
  zoomOutLabel?: string;
  resetLabel?: string;
  popup?: ReactNode;
  onClosePopup?: () => void;
  userLoc?: { lat: number; lng: number } | null;
  userLabel?: string;
  onLocate?: () => void;
  locateLabel?: string;
};

const MIN_ZOOM = 0.7;
const MAX_ZOOM = 2.8;
const clampZoom = (z: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));

const rad = (deg: number) => (deg * Math.PI) / 180;

// Orthographic projection with rotation [rotX, rotY]. Returns null when behind the globe.
function project(lat: number, lng: number, rotX: number, rotY: number) {
  const phi = rad(lat);
  const lambda = rad(lng) + rotX;
  const x = Math.cos(phi) * Math.sin(lambda);
  let y = Math.sin(phi);
  let z = Math.cos(phi) * Math.cos(lambda);
  const y2 = y * Math.cos(rotY) - z * Math.sin(rotY);
  const z2 = y * Math.sin(rotY) + z * Math.cos(rotY);
  y = y2;
  z = z2;
  if (z < 0.02) return null;
  return { x, y };
}

export function Globe({ pins, selectedId, onSelect, label, zoomInLabel = "Zoom in", zoomOutLabel = "Zoom out", resetLabel = "Reset view", popup, onClosePopup, userLoc = null, userLabel = "You", onLocate, locateLabel = "Show my location" }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [dots, setDots] = useState<[number, number][] | null>(null);
  const [zoom, setZoom] = useState(1);
  const live = useRef({ rotX: rad(-106), rotY: rad(18), dragging: false, moved: 0, lastX: 0, lastY: 0, zoom: 1, pinch: new Map<number, { x: number; y: number }>(), pinchDist: 0, lastTouch: 0 });
  const pinsRef = useRef(pins);
  const selectRef = useRef(onSelect);
  const selectedRef = useRef(selectedId);
  const popupContent = useRef(popup);
  const closeRef = useRef(onClosePopup);
  const userLocRef = useRef(userLoc);
  const userLabelRef = useRef(userLabel);
  useEffect(() => {
    pinsRef.current = pins;
    selectRef.current = onSelect;
    selectedRef.current = selectedId;
    popupContent.current = popup;
    closeRef.current = onClosePopup;
    userLocRef.current = userLoc;
    userLabelRef.current = userLabel;
  }, [pins, onSelect, selectedId, popup, onClosePopup, userLoc, userLabel]);

  function positionPopup(rotX: number, rotY: number, zoom: number) {
    const el = popupRef.current;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!el || !canvas || !wrap) return;
    const pin = pinsRef.current.find((item) => item.id === selectedRef.current);
    if (!pin || !popupContent.current) {
      el.style.display = "none";
      return;
    }
    const p = project(pin.lat, pin.lng, rotX, rotY);
    const canvasRect = canvas.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    const R = canvasRect.width / 2 - 8;
    const Re = R * zoom;
    if (!p || Math.hypot(p.x * Re, p.y * Re) > R) {
      el.style.display = "none";
      return;
    }
    el.style.display = "block";
    const x = canvasRect.left - wrapRect.left + canvasRect.width / 2 + p.x * Re;
    const y = canvasRect.top - wrapRect.top + canvasRect.height / 2 - p.y * Re;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }
  useEffect(() => {
    let cancelled = false;
    fetch("/land-dots.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && Array.isArray(data.dots)) setDots(data.dots);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const osDark = window.matchMedia("(prefers-color-scheme: dark)");
    // The app theme can be toggled in-app via data-mode, which overrides the OS scheme.
    const isDark = () => {
      const mode = document.documentElement.getAttribute("data-mode") ?? (osDark.matches ? "dark" : "light");
      return mode === "dark";
    };
    let raf = 0;
    let size = 0;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      size = Math.max(240, Math.min(720, rect.width));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const s = live.current;
      s.zoom = clampZoom(s.zoom * Math.exp(-event.deltaY * 0.0012));
      s.lastTouch = performance.now();
      setZoom(s.zoom);
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const frame = () => {
      const s = live.current;
      // Slow spin that pauses while the user interacts and resumes after ~2.5s idle.
      if (!s.dragging && s.pinch.size === 0 && !motion.matches && performance.now() - s.lastTouch > 2500) s.rotX += 0.0008 / s.zoom;
      draw(ctx, size, s.rotX, s.rotY, dots, pinsRef.current, selectedRef.current, s.zoom, isDark(), userLocRef.current, userLabelRef.current);
      positionPopup(s.rotX, s.rotY, s.zoom);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [dots]);


  const setLiveZoom = (z: number) => {
    const s = live.current;
    s.zoom = clampZoom(z);
    setZoom(s.zoom);
  };

  const onPointerDown = (event: React.PointerEvent) => {
    const s = live.current;
    s.lastTouch = performance.now();
    s.pinch.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (s.pinch.size === 2) {
      const pts = [...s.pinch.values()];
      const a = pts[0] ?? { x: 0, y: 0 };
      const b = pts[1] ?? { x: 0, y: 0 };
      s.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      s.dragging = false;
    } else {
      s.dragging = true;
      s.moved = 0;
      s.lastX = event.clientX;
      s.lastY = event.clientY;
    }
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent) => {
    const s = live.current;
    if (s.dragging || s.pinch.size > 0) s.lastTouch = performance.now();
    if (s.pinch.has(event.pointerId)) s.pinch.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (s.pinch.size === 2) {
      const pts = [...s.pinch.values()];
      const a = pts[0] ?? { x: 0, y: 0 };
      const b = pts[1] ?? { x: 0, y: 0 };
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (s.pinchDist > 0) {
        s.zoom = clampZoom((s.zoom * dist) / s.pinchDist);
        setZoom(s.zoom);
      }
      s.pinchDist = dist;
      s.moved += 1;
      return;
    }
    if (!s.dragging) return;
    const dx = event.clientX - s.lastX;
    const dy = event.clientY - s.lastY;
    s.moved += Math.abs(dx) + Math.abs(dy);
    s.lastX = event.clientX;
    s.lastY = event.clientY;
    // Divide by zoom so grabbing the surface feels the same at any zoom level.
    s.rotX += (dx * 0.005) / s.zoom;
    s.rotY = Math.max(-1.2, Math.min(1.2, s.rotY + (dy * 0.003) / s.zoom));
  };
  const endPointer = (event: React.PointerEvent) => {
    const s = live.current;
    s.lastTouch = performance.now();
    s.pinch.delete(event.pointerId);
    if (s.pinch.size < 2) s.pinchDist = 0;
    if (s.pinch.size > 0) return;
    const wasTap = s.moved <= 6;
    s.dragging = false;
    if (!wasTap) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left - rect.width / 2;
    const py = event.clientY - rect.top - rect.height / 2;
    const R = (rect.width / 2 - 8) * s.zoom;
    let best: GlobePin | null = null;
    let bestDist = 18;
    for (const pin of pinsRef.current) {
      const p = project(pin.lat, pin.lng, s.rotX, s.rotY);
      if (!p) continue;
      const dist = Math.hypot(p.x * R - px, -p.y * R - py);
      if (dist < bestDist) {
        bestDist = dist;
        best = pin;
      }
    }
    if (best) selectRef.current(best.id);
  };

  return (
    <div ref={wrapRef} className="globe" style={{ display: "grid", placeItems: "center", position: "relative" }}>
      <canvas
        ref={canvasRef}
        role="application"
        aria-label={label}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onDoubleClick={() => setLiveZoom(1)}
        style={{ touchAction: "none", cursor: "grab" }}
      />
      {popup && (
        <div
          ref={popupRef}
          style={{ display: "none", position: "absolute", left: 0, top: 0, transform: "translate(-50%, calc(-100% - 14px))", zIndex: 3, width: "max-content", maxWidth: "min(240px, 70vw)" }}
        >
          <div className="card" style={{ padding: "var(--space-xs) var(--space-sm)", position: "relative" }}>
            {onClosePopup && (
              <button type="button" className="chip" aria-label="Close" onClick={() => closeRef.current?.()} style={{ position: "absolute", top: -10, right: -10, minWidth: 28, height: 28, borderRadius: "50%", padding: 0 }}>
                ×
              </button>
            )}
            {popup}
          </div>
        </div>
      )}
      <div
        role="group"
        aria-label={label}
        style={{ position: "absolute", right: 12, bottom: 12, display: "flex", flexDirection: "column", gap: 6 }}
      >
        <button type="button" className="chip" aria-label={zoomInLabel} title={zoomInLabel} onClick={() => setLiveZoom(live.current.zoom + 0.3)} disabled={zoom >= MAX_ZOOM} style={{ minWidth: 36, textAlign: "center" }}>
          +
        </button>
        <button type="button" className="chip" aria-label={zoomOutLabel} title={zoomOutLabel} onClick={() => setLiveZoom(live.current.zoom - 0.3)} disabled={zoom <= MIN_ZOOM} style={{ minWidth: 36, textAlign: "center" }}>
          &minus;
        </button>
        {zoom !== 1 && (
          <button type="button" className="chip" aria-label={resetLabel} title={resetLabel} onClick={() => setLiveZoom(1)} style={{ minWidth: 36, textAlign: "center" }}>
            1:1
          </button>
        )}
        {onLocate && (
          <button type="button" className="chip" aria-label={locateLabel} title={locateLabel} onClick={onLocate} style={{ minWidth: 36, textAlign: "center" }}>
            ⌖
          </button>
        )}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  size: number,
  rotX: number,
  rotY: number,
  dots: [number, number][] | null,
  pins: GlobePin[],
  selectedId: string | null,
  zoom = 1,
  dark = true,
  userLoc: { lat: number; lng: number } | null = null,
  userLabel = "You",
) {
  const R = size / 2 - 8;
  const Re = R * zoom;
  const cx = size / 2;
  const cy = size / 2;
  ctx.clearRect(0, 0, size, size);

  // Opaque ocean, sized by zoom so the whole globe scales as one.
  const ocean = ctx.createRadialGradient(cx - Re * 0.3, cy - Re * 0.3, Re * 0.1, cx, cy, Re);
  if (dark) {
    ocean.addColorStop(0, "#55688f");
    ocean.addColorStop(1, "#2b3a63");
  } else {
    ocean.addColorStop(0, "#4c6bab");
    ocean.addColorStop(1, "#2c3e68");
  }
  ctx.beginPath();
  ctx.arc(cx, cy, Re, 0, Math.PI * 2);
  ctx.fillStyle = ocean;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, Re, 0, Math.PI * 2);
  ctx.clip();

  ctx.strokeStyle = dark ? "rgba(255,246,220,0.22)" : "rgba(255,246,220,0.25)";
  ctx.lineWidth = 1;
  for (let lng = -180; lng < 180; lng += 20) {
    ctx.beginPath();
    for (let lat = -90; lat <= 90; lat += 4) {
      const p = project(lat, lng, rotX, rotY);
      if (!p) continue;
      const X = cx + p.x * Re;
      const Y = cy - p.y * Re;
      if (lat === -90) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    }
    ctx.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 20) {
    ctx.beginPath();
    let pen = false;
    for (let lng = -180; lng <= 180; lng += 4) {
      const p = project(lat, lng, rotX, rotY);
      if (!p) {
        pen = false;
        continue;
      }
      const X = cx + p.x * Re;
      const Y = cy - p.y * Re;
      if (!pen) {
        ctx.moveTo(X, Y);
        pen = true;
      } else ctx.lineTo(X, Y);
    }
    ctx.stroke();
  }

  if (dots) {
    // Cream dots vanish on the light theme, so land adapts to the color scheme.
    // Warm sand land on deep sea reads in both modes.
    ctx.fillStyle = dark ? "#fff6dc" : "#ffe3a1";
    const half = 1.25;
    for (const [lat, lng] of dots) {
      const p = project(lat, lng, rotX, rotY);
      if (!p) continue;
      if (Math.hypot(p.x * Re, p.y * Re) > Re) continue;
      ctx.fillRect(cx + p.x * Re - half, cy - p.y * Re - half, half * 2, half * 2);
    }
  }

  const max = Math.max(1, ...pins.map((pin) => pin.score));
  for (const pin of pins) {
    const p = project(pin.lat, pin.lng, rotX, rotY);
    if (!p) continue;
    if (Math.hypot(p.x * Re, p.y * Re) > Re) continue;
    const X = cx + p.x * Re;
    const Y = cy - p.y * Re;
    const r = 4 + (pin.score / max) * 6;
    const selected = pin.id === selectedId;
    ctx.beginPath();
    ctx.arc(X, Y, r + 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,149,165,0.35)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(X, Y, r, 0, Math.PI * 2);
    ctx.fillStyle = selected ? "#ff95a5" : "rgba(255,149,165,0.85)";
    ctx.fill();
    if (selected) {
      ctx.beginPath();
      ctx.arc(X, Y, r + 2.5, 0, Math.PI * 2);
      ctx.strokeStyle = "#fff6dc";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  if (userLoc) {
    const p = project(userLoc.lat, userLoc.lng, rotX, rotY);
    if (p && Math.hypot(p.x * Re, p.y * Re) <= Re) {
      const X = cx + p.x * Re;
      const Y = cy - p.y * Re;
      ctx.beginPath();
      ctx.arc(X, Y, 9, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(66,133,244,0.3)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(X, Y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#4285f4";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#fff";
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "600 11px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(userLabel, X, Y - 13);
    }
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, Re, 0, Math.PI * 2);
  ctx.strokeStyle = dark ? "rgba(255,246,220,0.5)" : "rgba(44,62,104,0.55)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}
