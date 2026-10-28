"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { PERSONAS } from "@/lib/data/users";
import { USER_BY_ID } from "@/lib/data/users";
import { PlanCard } from "@/components/PlanCard";
import { composeMatch } from "@/lib/engine";

function fullLast<T extends { id: string; partySize: number }>(list: T[], joins: Record<string, string[]>) {
  const isFull = (a: T) => (joins[a.id]?.length ?? 0) >= Math.max(a.partySize - 1, 1);
  return [...list].sort((a, b) => Number(isFull(a)) - Number(isFull(b)));
}

const postedTime = (activity: { startsAt: string; createdAt?: string }) => {
  const created = activity.createdAt ? Date.parse(activity.createdAt) : Number.NaN;
  return Number.isNaN(created) ? Date.parse(activity.startsAt) : created;
};

export default function HomePage() {
  const { state, viewer } = useStore();
  const locale = state.locale;
  const viewerVerified = state.verification === "verified";
  const [showAllMine, setShowAllMine] = useState(false);
  const [sort, setSort] = useState<"match" | "newest">("match");
  const myPlans = useMemo(() => {
    const now = Date.now();
    const upcoming: typeof state.activities = [];
    const past: typeof state.activities = [];
    for (const activity of state.activities) {
      if (activity.creatorId !== viewer.id) continue;
      const time = Date.parse(activity.startsAt);
      if (Number.isNaN(time) || time >= now) upcoming.push(activity);
      else past.push(activity);
    }
    upcoming.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
    past.sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt));
    return [...upcoming, ...past];
  }, [state.activities, viewer.id]);
  const nearestMine = myPlans[0] ?? null;
  const others = useMemo(() => {
    const base = fullLast(
      state.activities.filter((activity) => {
        if (activity.creatorId === viewer.id) return false;
        if ((state.removed[activity.id] ?? []).includes(viewer.id)) return false;
        if ((state.blocked[viewer.id] ?? []).includes(activity.creatorId)) return false;
        return true;
      }),
      state.joins,
    );
    if (sort === "newest") return [...base].sort((a, b) => postedTime(b) - postedTime(a));
    // Most match: best host score first, full plans sink via fullLast above.
    const scoreOf = (activity: (typeof base)[number]) => {
      try {
        const host = USER_BY_ID.get(activity.creatorId) ?? null;
        if (!host) return -1;
        return composeMatch(activity, viewer, host).total;
      } catch {
        return -1;
      }
    };
    return [...base].sort((a, b) => scoreOf(b) - scoreOf(a));
  }, [state.activities, state.joins, state.removed, state.blocked, viewer, sort]);

  return (
    <>
      <div className={`hero${nearestMine ? " hero--split" : ""}`}>
        <div className="hero__main">
          <h1 className="greeting">{t(locale, "home.greeting")}, {(viewer.name.split(' ')[0] ?? viewer.name)}!</h1>
          <p className="lead">
            {t(locale, "home.headline")}
          </p>
          <div className="row">
            <Link className="btn" href="/create">
              {t(locale, "action.findBuddy")}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className="btn btn--quiet" href="/explore">
              {t(locale, "nav.explore")}
            </Link>
          </div>
        </div>
        {nearestMine && (
          // ponytail: hero previews closest own plan at board-card size; toggle reveals the rest inline.
          <section className="hero__plan" aria-label={locale === "en" ? "Your plan" : "Rencanamu"}>
            <div className="section__head">
              <h2>{locale === "en" ? "Your plan" : "Rencanamu"}</h2>
              {myPlans.length > 1 && (
                <button
                  type="button"
                  className="btn btn--quiet btn--sm"
                  aria-expanded={showAllMine}
                  onClick={() => setShowAllMine((value) => !value)}
                >
                  {showAllMine ? t(locale, "home.showLess") : `${t(locale, "home.showAll")} (${myPlans.length})`}
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              )}
            </div>
            {(showAllMine ? myPlans : [nearestMine]).map((activity) => (
              <PlanCard key={activity.id} activity={activity} creator={viewer} locale={locale} viewerVerified={viewerVerified} own lead />
            ))}
          </section>
        )}
      </div>

      <section className="section">
        <div className="section__head">
          <h2>{t(locale, "home.boardTitle")}</h2>
          <span className="row" style={{ gap: "var(--space-sm)" }}>
            <span className="board__count">
              <ShieldCheck size={14} aria-hidden="true" />
              {locale === "en" ? `${PERSONAS.length} demo buddies in Jabodetabek` : `${PERSONAS.length} temen demo di Jabodetabek`}
            </span>
            <span className="selectwrap">
              <select
                className="select select--sm"
                value={sort}
                onChange={(event) => setSort(event.target.value as "match" | "newest")}
                aria-label={t(locale, "home.sort")}
              >
                <option value="match">{t(locale, "home.sortMatch")}</option>
                <option value="newest">{t(locale, "home.sortNewest")}</option>
              </select>
              <ChevronDown size={16} aria-hidden="true" />
            </span>
          </span>
        </div>
        <div className="board">
          {others.slice(0, 20).map((activity) => (
            <PlanCard
              key={activity.id}
              activity={activity}
              creator={USER_BY_ID.get(activity.creatorId) ?? null}
              locale={locale}
              viewerVerified={viewerVerified}
              shine
            />
          ))}
        </div>
        {others.length === 0 && <p className="muted">{t(locale, "board.empty")}</p>}
        {others.length > 20 && (
          <div className="board__more">
            <Link className="btn btn--quiet" href="/explore">
              {t(locale, "home.showMore")}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
