"use client";

import { Check, ShieldCheck, Star } from "lucide-react";
import type { Locale, User } from "@/lib/types";

export function VerifiedBadge({ user, locale }: { user: User; locale: Locale }) {
  if (user.verification !== "verified") return null;
  return (
    <span className="tag tag--verified" title={locale === "en" ? "Identity verified" : "Identitas terverifikasi"}>
      <ShieldCheck size={14} aria-hidden="true" />
      {locale === "en" ? "Verified" : "Terverifikasi"}
    </span>
  );
}

export function ScoreRing({ value, locale }: { value: number; locale: Locale }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const filled = (value / 100) * circumference;
  return (
    <div className="score" aria-label={`${value} ${locale === "en" ? "match score" : "skor cocok"}`}>
      <svg viewBox="0 0 56 56" width="56" height="56" aria-hidden="true">
        <defs>
          <linearGradient id="score-shine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-signal)" />
            <stop offset="52%" stopColor="var(--color-accent)" />
            <stop offset="100%" stopColor="var(--color-signal)" />
          </linearGradient>
        </defs>
        <circle cx="28" cy="28" r={radius} fill="none" stroke="var(--color-paper-3)" strokeWidth="4" />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="url(#score-shine)"
          strokeWidth="5"
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
        />
      </svg>
      <span>{value}</span>
    </div>
  );
}

export function RatingLine({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
  return (
    <span className="row" style={{ gap: "var(--space-2xs)" }}>
      <Star size={14} aria-hidden="true" />
      <span>
        {label} {value.toFixed(1)} / {max}
      </span>
    </span>
  );
}

export function Met({ met }: { met: boolean }) {
  return (
    <span className={met ? "row" : "row muted"} style={{ gap: "var(--space-2xs)" }}>
      <Check size={16} aria-hidden="true" />
      <span className="visually-hidden">{met ? "met" : "not met"}</span>
    </span>
  );
}
