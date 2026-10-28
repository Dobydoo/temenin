"use client";

import Link from "next/link";
import { AREA_BY_ID } from "@/lib/data/areas";
import { visibleActivityFor } from "@/lib/privacy";
import type { Activity, Locale, User } from "@/lib/types";
import { formatDate, timeAgo } from "@/lib/format";
import { useMemo } from "react";
import { t } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { composeMatch } from "@/lib/engine";
import { USER_BY_ID } from "@/lib/data/users";
import { ArrowRight, Lock, MapPin, Users } from "lucide-react";

type Props = {
  activity: Activity;
  creator: User | null;
  locale: Locale;
  viewerVerified: boolean;
  own?: boolean;
  lead?: boolean;
  shine?: boolean;
};


export function PlanCard({ activity, creator, locale, viewerVerified, own = false, lead = false, shine = false }: Props) {
  const view = visibleActivityFor(activity, viewerVerified ? "verified" : "unverified");
  const sealed = view.sealed && !own;
  const area = view.areaId ? AREA_BY_ID.get(view.areaId) : null;
  const when = view.startsAt ? formatDate(view.startsAt, locale) : "";
  const posted = activity.createdAt ? timeAgo(activity.createdAt, locale) : "";
  const { state, viewer } = useStore();
  const joined = state.joins[activity.id]?.length ?? 0;
  const spots = Math.max(activity.partySize - 1, 1);
  const full = joined >= spots;
  const hostScore = useMemo(() => {
    try {
      const host = creator ?? (USER_BY_ID.get(activity.creatorId) ?? null);
      if (!host) return null;
      return composeMatch(activity, viewer, host).total;
    } catch {
      return null;
    }
  }, [activity, creator, viewer]);
  const tier = !shine || hostScore == null || hostScore < 70 ? "" : hostScore >= 90 ? " plan--rain" : " plan--shine";
  return (
    <article className={`card plan${sealed ? " sealed" : ""}${lead ? " plan--lead" : ""}${tier}`}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="tag">{t(locale, `category.${view.category}`)}</span>
        <span className="row" style={{ gap: "var(--space-2xs)" }}>
          {posted && <span className="tiny muted">{posted}</span>}
          <span className="tiny muted">
            {locale === "en" ? `${joined} out of ${spots} joined` : `${joined} dari ${spots} gabung`}
          </span>
        </span>
      </div>
      {tier === " plan--rain" && (
        <span className="plan__stars" aria-hidden="true">
          {Array.from({ length: 14 }).map((_, i) => (
            <i key={i} className={`plan__star plan__star--${(i % 5) + 1}`} />
          ))}
        </span>
      )}
      <div className="plan__body">
        <p className="plan__desc">{view.description}</p>
        <div className="plan__meta">
          {!own && (
            <span className={sealed ? "locked" : "locked locked--unlocked"}>
              {sealed ? <Lock size={16} aria-hidden="true" /> : <Users size={16} aria-hidden="true" />}
              <span className="locked__value">
                {sealed ? t(locale, "privacy.nameHidden") : creator ? creator.name : t(locale, "board.yourPlan")}
              </span>
            </span>
          )}
          <span className={sealed ? "locked" : "locked locked--unlocked"}>
            {sealed ? <Lock size={16} aria-hidden="true" /> : <MapPin size={16} aria-hidden="true" />}
            <span className="locked__value">
              {sealed ? t(locale, "privacy.placeHidden") : area ? `${area.name}, ${area.city}` : "Area unknown"}
            </span>
          </span>
          <span className={sealed ? "locked" : "locked locked--unlocked"}>
            {sealed ? <Lock size={16} aria-hidden="true" /> : <Users size={16} aria-hidden="true" />}
            <span className="locked__value">{sealed ? t(locale, "privacy.timeHidden") : when}</span>
          </span>
        </div>
      </div>
      <div className="plan__foot">
        {full && !own ? (
          <span className="btn btn--sm btn--full" aria-disabled="true">
            {t(locale, "match.full")}
          </span>
        ) : (
          <Link className="btn btn--sm" href={`/match/${activity.id}`} aria-label={`${t(locale, "action.seeMatches")}: ${view.description.slice(0, 40)}`}>
            {t(locale, "action.seeMatches")}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
        {sealed && (
          <Link className="small" href="/safety">
            {locale === "en" ? "Verify to unseal" : "Verifikasi untuk membuka"}
          </Link>
        )}
      </div>
    </article>
  );
}
