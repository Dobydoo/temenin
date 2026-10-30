"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Activity, Locale } from "@/lib/types";

/**
 * Privacy gate for plan pages: unverified viewers (who did not create the
 * plan) see the description only — never area, time, host, or requests.
 * Mirrors lib/privacy.ts visibleActivityFor.
 */
export function SealedPlan({ activity, locale }: { activity: Activity; locale: Locale }) {
  return (
    <>
      <nav className="tiny muted" aria-label="Breadcrumb" style={{ marginBlockEnd: "var(--space-sm)" }}>
        <Link href="/explore">{t(locale, "nav.explore")}</Link>
        {" / "}
        <span aria-current="page">{activity.description.slice(0, 32)}{activity.description.length > 32 ? "…" : ""}</span>
      </nav>
      <div className="pagehead">
        <div className="pagehead__text">
          <span className="tag">{t(locale, `category.${activity.category}`)}</span>
          <h1>{activity.description}</h1>
          <p className="lead">{t(locale, "sealed.blurb")}</p>
        </div>
      </div>
      <div className="card stack">
        <span className="locked">
          <Lock size={16} aria-hidden="true" />
          <span className="locked__value">{t(locale, "privacy.nameHidden")}</span>
        </span>
        <span className="locked">
          <Lock size={16} aria-hidden="true" />
          <span className="locked__value">{t(locale, "privacy.placeHidden")}</span>
        </span>
        <span className="locked">
          <Lock size={16} aria-hidden="true" />
          <span className="locked__value">{t(locale, "privacy.timeHidden")}</span>
        </span>
        <div>
          <Link className="btn" href="/safety">
            {t(locale, "action.verify")}
          </Link>
        </div>
      </div>
    </>
  );
}
