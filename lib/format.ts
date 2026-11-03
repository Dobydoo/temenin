import type { Locale } from "./types";

export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function rupiah(value: number): string {
  if (value === 0) return "Free";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export function budgetRange(min: number, max: number): string {
  if (min === 0 && max === 0) return "Free";
  return `${rupiah(min)} to ${rupiah(max)}`;
}

export function timeAgo(iso: string, locale: Locale): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  // Posted age never lies in the future; legacy fallbacks to startsAt can.
  const diffMs = Math.max(Date.now() - then, 0);
  if (diffMs < 60e3) return locale === "en" ? "just now" : "baru saja";
  const rtf = new Intl.RelativeTimeFormat(locale === "en" ? "en" : "id", { numeric: "auto" });
  if (diffMs < 36e5) return rtf.format(-Math.round(diffMs / 60e3), "minute");
  if (diffMs < 864e5) return rtf.format(-Math.round(diffMs / 36e5), "hour");
  if (diffMs < 7 * 864e5) return rtf.format(-Math.round(diffMs / 864e5), "day");
  if (diffMs < 30 * 864e5) return rtf.format(-Math.round(diffMs / (7 * 864e5)), "week");
  return rtf.format(-Math.round(diffMs / (30 * 864e5)), "month");
}

// ponytail: unset/invalid durations fall back to 60 minutes.
export function planEndsAt(startsAt: string, durationMin?: number | null): number {
  const start = Date.parse(startsAt);
  if (Number.isNaN(start)) return Number.NaN;
  const minutes = durationMin && durationMin > 0 ? durationMin : 60;
  return start + minutes * 60_000;
}
