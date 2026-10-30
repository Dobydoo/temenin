"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { USER_BY_ID } from "@/lib/data/users";
import { AREA_BY_ID } from "@/lib/data/areas";
import { PlanCard } from "@/components/PlanCard";
import { PostCard } from "@/components/PostCard";
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

      <section className="section">
        <div className="section__head">
          <h2>{t(locale, "feed.title")}</h2>
          <div className="chips" role="tablist" aria-label={t(locale, "feed.title")}>
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
        </div>
        <div className="board">
          {feed.slice(0, 20).map((post) => (
            <PostCard
              key={post.id}
              post={post}
              author={USER_BY_ID.get(post.authorId) ?? null}
              activity={state.activities.find((item) => item.id === post.activityId) ?? null}
              locale={locale}
            />
          ))}
        </div>
        {feed.length === 0 && <p className="muted">{t(locale, "feed.empty")}</p>}
        {feed.length > 20 && (
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
