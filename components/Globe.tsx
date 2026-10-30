"use client";

import { useEffect, useRef, useState } from "react";

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
};

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

export function Globe({ pins, selectedId, onSelect, label }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dots, setDots] = useState<[number, number][] | null>(null);
  const live = useRef({ rotX: rad(-106), rotY: rad(18), dragging: false, moved: 0, lastX: 0, lastY: 0 });
  const pinsRef = useRef(pins);
  const selectRef = useRef(onSelect);
  const selectedRef = useRef(selectedId);
  useEffect(() => {
    pinsRef.current = pins;
    selectRef.current = onSelect;
    selectedRef.current = selectedId;
  }, [pins, onSelect, selectedId]);

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
    let raf = 0;
    let size = 0;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      size = Math.max(240, Math.min(480, rect.width));
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

    const frame = () => {
      const s = live.current;
      if (!s.dragging && !motion.matches) s.rotX += 0.0016;
      draw(ctx, size, s.rotX, s.rotY, dots, pinsRef.current, selectedRef.current);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [dots]);

  const onPointerDown = (event: React.PointerEvent) => {
    const s = live.current;
    s.dragging = true;
    s.moved = 0;
    s.lastX = event.clientX;
    s.lastY = event.clientY;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent) => {
    const s = live.current;
    if (!s.dragging) return;
    const dx = event.clientX - s.lastX;
    const dy = event.clientY - s.lastY;
    s.moved += Math.abs(dx) + Math.abs(dy);
    s.lastX = event.clientX;
    s.lastY = event.clientY;
    s.rotX += dx * 0.005;
    s.rotY = Math.max(-1.2, Math.min(1.2, s.rotY + dy * 0.003));
  };
  const onPointerUp = (event: React.PointerEvent) => {
    const s = live.current;
    s.dragging = false;
    if (s.moved > 6) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left - rect.width / 2;
    const py = event.clientY - rect.top - rect.height / 2;
    const R = rect.width / 2 - 8;
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
    <div ref={wrapRef} className="globe" style={{ display: "grid", placeItems: "center" }}>
      <canvas
        ref={canvasRef}
        role="application"
        aria-label={label}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ touchAction: "pan-y", cursor: "grab" }}
      />
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
) {
  const R = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  ctx.clearRect(0, 0, size, size);

  const ocean = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
  ocean.addColorStop(0, "rgba(118,192,236,0.35)");
  ocean.addColorStop(1, "rgba(66,91,154,0.35)");
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = ocean;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();

  ctx.strokeStyle = "rgba(255,246,220,0.28)";
  ctx.lineWidth = 1;
  for (let lng = -180; lng < 180; lng += 20) {
    ctx.beginPath();
    for (let lat = -90; lat <= 90; lat += 4) {
      const p = project(lat, lng, rotX, rotY);
      if (!p) continue;
      const X = cx + p.x * R;
      const Y = cy - p.y * R;
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
      const X = cx + p.x * R;
      const Y = cy - p.y * R;
      if (!pen) {
        ctx.moveTo(X, Y);
        pen = true;
      } else ctx.lineTo(X, Y);
    }
    ctx.stroke();
  }

  if (dots) {
    ctx.fillStyle = "rgba(255,246,220,0.6)";
    for (const [lat, lng] of dots) {
      const p = project(lat, lng, rotX, rotY);
      if (!p) continue;
      ctx.fillRect(cx + p.x * R - 0.75, cy - p.y * R - 0.75, 1.5, 1.5);
    }
  }

  const max = Math.max(1, ...pins.map((pin) => pin.score));
  for (const pin of pins) {
    const p = project(pin.lat, pin.lng, rotX, rotY);
    if (!p) continue;
    const X = cx + p.x * R;
    const Y = cy - p.y * R;
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
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,246,220,0.4)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}
