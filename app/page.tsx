"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { USER_BY_ID } from "@/lib/data/users";
import { formatDate, planEndsAt } from "@/lib/format";
import { AREA_BY_ID } from "@/lib/data/areas";
import { PlanCard } from "@/components/PlanCard";
import { PostCard } from "@/components/PostCard";
import { Composer } from "@/components/Composer";
import { visiblePosts } from "@/lib/social";

export default function HomePage() {
  const { state, viewer } = useStore();
  const locale = state.locale;
  const viewerVerified = state.verification === "verified";
  const [showAllMine, setShowAllMine] = useState(false);
  const [tab, setTab] = useState<"foryou" | "following" | "nearby">("foryou");
  const [now] = useState(() => Date.now());
  const myPlans = useMemo(() => {
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
  }, [state, viewer.id, now]);
  const nearestMine = myPlans[0] ?? null;
  const finishedPlans = useMemo(() => {
    const done = state.activities.filter((activity) => {
      const time = Date.parse(activity.startsAt);
      return !Number.isNaN(time) && planEndsAt(activity.startsAt, activity.durationMin) < now;
    });
    done.sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt));
    return done
      .map((activity) => ({
        activity,
        moments: visiblePosts(state.posts, viewer.id, state.joins).filter((post) => post.activityId === activity.id).length,
      }))
      .filter((entry) => entry.moments > 0);
  }, [state.activities, state.posts, state.joins, viewer.id, now]);
  const feed = useMemo(() => {
    const seen = visiblePosts(state.posts, viewer.id, state.joins).filter((post) => {
      if ((state.blocked[viewer.id] ?? []).includes(post.authorId)) return false;
      return true;
    });
    const newest = [...seen].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    if (tab === "following") return newest.filter((post) => state.following.includes(post.authorId));
    if (tab === "nearby") {
      const zone = AREA_BY_ID.get(viewer.areaId)?.zone;
      return newest.filter((post) => AREA_BY_ID.get(post.areaId)?.zone === zone);
    }
    // ponytail: For You is plan memories only; Following/Nearby keep all visible posts.
    if (tab === "foryou") return newest.filter((post) => post.kind === "recap" && post.activityId);
    return newest;
  }, [state.posts, state.joins, state.blocked, state.following, viewer.id, viewer.areaId, tab]);

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

      <div className="home-grid">
      {finishedPlans.length > 0 && (
        <section className="section finished home-grid__side" aria-label={t(locale, "home.finished")}>
          <div className="section__head">
            <h2>{t(locale, "home.finished")}</h2>
          </div>
          <div className="threads-box">
            <div className="threads">
              {finishedPlans.map(({ activity, moments }) => {
                const host = USER_BY_ID.get(activity.creatorId);
                const area = AREA_BY_ID.get(activity.areaId);
                const reviews = state.authorReviews.filter((review) => review.activityId === activity.id);
                const average = reviews.length > 0
                  ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
                  : null;
                return (
                  <Link key={activity.id} className="thread thread--link" href={`/match/${activity.id}`}>
                    <span className="thread__head">
                      <span className="avatar avatar--sm" aria-hidden="true">
                        {host?.avatarInitials ?? "?"}
                      </span>
                      <span className="thread__who">
                        <strong className="thread__name">{activity.description}</strong>
                      </span>
                      <span className="muted thread__time">{formatDate(activity.startsAt, locale)}</span>
                    </span>
                    <span className="thread__main">
                      <span className="muted small">
                        {host?.name ?? ""}
                        {area ? ` · ${area.name}` : ""}
                        {` · ${moments} ${locale === "en" ? "moments" : "momen"}`}
                        {average ? ` · ★ ${average} (${reviews.length})` : ""}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
            <section className="card thread-wrap home-grid__feed" aria-label={t(locale, "feed.title")}>
        <h2 className="visually-hidden">{t(locale, "feed.title")}</h2>
        <div className="thread-wrap__composer">
          <Composer locale={locale} activityId={null} areaId={viewer.areaId} allowVisibility={false} titleKey="composer.moment" bodyKey="recap.body" />
        </div>
        <div className="thread-tabs chips" role="tablist" aria-label={t(locale, "feed.title")}>
          {(["foryou", "following", "nearby"] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className="chip"
              onClick={() => setTab(key)}
            >
              {t(locale, `feed.${key}`)}
            </button>
          ))}
        </div>
        <div className="threads">
          {feed.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              author={USER_BY_ID.get(post.authorId) ?? null}
              activity={state.activities.find((item) => item.id === post.activityId) ?? null}
              locale={locale}
            />
          ))}
        </div>
        {feed.length === 0 && <p className="muted thread-wrap__empty">{t(locale, "feed.empty")}</p>}
        
      </section>
      </div>
    </>
  );
}
