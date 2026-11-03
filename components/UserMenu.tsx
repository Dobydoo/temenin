"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogOut, Moon, ShieldCheck, Sun, UserRound, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";

function GenderIcon({ female, label }: { female: boolean; label: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      role="img"
      aria-label={label}
    >
      {female ? (
        <>
          <circle cx="12" cy="9" r="5" />
          <line x1="12" y1="14" x2="12" y2="21" />
          <line x1="8.5" y1="17.5" x2="15.5" y2="17.5" />
        </>
      ) : (
        <>
          <circle cx="10" cy="14" r="5" />
          <line x1="13.5" y1="10.5" x2="20" y2="4" />
          <line x1="20" y1="4" x2="15" y2="4" />
          <line x1="20" y1="4" x2="20" y2="9" />
        </>
      )}
    </svg>
  );
}

export function UserMenu({ variant = "avatar", label }: { variant?: "avatar" | "nav"; label?: string }) {
  const { state, viewer, update, logout } = useStore();
  const locale = state.locale;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const verified = viewer.verification === "verified";
  const initials = viewer.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  const female = viewer.gender === "female";
  const genderLabel = female
    ? locale === "en" ? "Women" : "Perempuan"
    : locale === "en" ? "Men" : "Laki-laki";

  const signOut = () => {
    logout();
    setOpen(false);
  };
  const dark = state.mode === "dark";
  const toggleMode = () => {
    update({ mode: dark ? "light" : "dark" });
  };

  return (
    <div className={"usermenu" + (variant === "nav" ? " usermenu--nav" : "")} ref={ref}>
      <button
        type="button"
        className={variant === "nav" ? "bottomnav__link usermenu__navbtn" : "usermenu__btn"}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label ?? viewer.name}
      >
        {variant === "nav" ? (
          <>
            <UserRound size={22} aria-hidden="true" />
            <span>{label}</span>
          </>
        ) : (
          <span className="avatar avatar--sm" aria-hidden="true">
            {initials}
          </span>
        )}
      </button>
      {open && (
        <div className={"usermenu__pop card" + (variant === "nav" ? " usermenu__pop--above" : "")} role="menu" aria-label={t(locale, "menu.account")}>
          <button
            type="button"
            className="usermenu__theme"
            onClick={toggleMode}
            aria-label={locale === "en" ? `Theme: ${state.mode} (tap to change)` : `Tema: ${state.mode} (ketuk untuk ganti)`}
            aria-pressed={dark}
            title={locale === "en" ? "Toggle light / dark" : "Ganti terang / gelap"}
          >
            {dark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>
          <button type="button" className="usermenu__close" onClick={() => setOpen(false)} aria-label={locale === "en" ? "Close menu" : "Tutup menu"}>
            <X size={16} aria-hidden="true" />
          </button>
          <div className="usermenu__id">
            <span className="avatar avatar--lg" aria-hidden="true">
              {initials}
            </span>
            <p className="usermenu__name">
              <strong>{viewer.name}</strong>
            </p>
            <p className="usermenu__meta small muted">
              <GenderIcon female={female} label={genderLabel} />
              {viewer.mbti ? <span> · {viewer.mbti}</span> : null}
            </p>
            <span className={verified ? "tag tag--verified" : "tag tag--plain"}>
              <ShieldCheck size={14} aria-hidden="true" />
              {verified ? t(locale, "home.viewerVerified") : t(locale, "home.viewerUnverified")}
            </span>
          </div>
          <hr className="divider usermenu__divider" />
          <Link
            className="btn btn--quiet btn--sm usermenu__item"
            href="/you"
            onClick={() => setOpen(false)}
          >
            {t(locale, "menu.profile")}
          </Link>
          <button
            type="button"
            className="btn btn--quiet btn--sm usermenu__item"
            onClick={signOut}
          >
            <LogOut size={16} aria-hidden="true" />
            {t(locale, "login.logout")}
          </button>
        </div>
      )}
    </div>
  );
}
