"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Flame } from "lucide-react";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { SPOTS, SPOT_BY_ID, SPOT_TRENDS } from "@/lib/data/spots";
import { trendingScores } from "@/lib/social";

const Globe = dynamic(() => import("@/components/Globe").then((mod) => mod.Globe), {
  ssr: false,
  loading: () => (
    <div className="card" role="status" aria-label="Loading globe" style={{ aspectRatio: "1", maxHeight: 420 }}>
      <p className="muted" style={{ textAlign: "center" }}>…</p>
    </div>
  ),
});

export default function TrendingPage() {
  const { state } = useStore();
  const locale = state.locale;
  const [spotId, setSpotId] = useState<string | null>(null);
  // Seeded demo location (Jakarta HQ persona). Real GPS comes after the hackathon.
  const userLoc = useMemo(() => {
    const jakarta = SPOT_BY_ID.get("jakarta");
    return jakarta ? { lat: jakarta.lat, lng: jakarta.lng } : null;
  }, []);

  const scores = useMemo(
    () => trendingScores(state.activities, state.joins, state.authorReviews),
    [state.activities, state.joins, state.authorReviews],
  );
  const top = scores.slice(0, 6);
  const spot = spotId ? SPOT_BY_ID.get(spotId) : undefined;
  const spotTrend = SPOT_TRENDS.find((item) => item.spotId === spotId);

  const pins = useMemo(() => {
    const jakartaScore = top.reduce((sum, item) => sum + item.score, 0);
    return SPOTS.map((item) => ({
      id: item.id,
      label: item.name,
      lat: item.lat,
      lng: item.lng,
      score:
        item.id === "jakarta"
          ? Math.max(1, jakartaScore)
          : (SPOT_TRENDS.find((trend) => trend.spotId === item.id)?.joins7d ?? 1),
    }));
  }, [top]);

  const topEntry = spotId === "jakarta" ? top[0] ?? null : null;
  const topPlan = topEntry ? state.activities.find((plan) => plan.id === topEntry.activityId) ?? null : null;

  const popup = spot ? (
    <div className="stack" style={{ gap: "var(--space-3xs)" }}>
      <strong>
        {spot.name} · {spot.region}
      </strong>
      {topPlan && topEntry ? (
        <>
          <span className="chip" style={{ alignSelf: "flex-start" }}>
            {t(locale, `category.${topPlan.category}`)}
          </span>
          <p className="tiny" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0 }}>
            {topPlan.description}
          </p>
          <p className="tiny muted" style={{ display: "flex", alignItems: "center", gap: 4, margin: 0 }}>
            <Flame size={12} aria-hidden="true" /> {topEntry.facts.joins} {t(locale, "trending.joins")}
            {topEntry.facts.authorAvg != null && <> · ★ {topEntry.facts.authorAvg}</>}
          </p>
          <Link className="chip" href={`/match/${topPlan.id}`} style={{ textDecoration: "none", textAlign: "center" }}>
            {t(locale, "action.seeMatches")} →
          </Link>
        </>
      ) : (
        <>
          {spotTrend && (
            <span className="chip" style={{ alignSelf: "flex-start" }}>
              {t(locale, `category.${spotTrend.category}`)}
            </span>
          )}
          <p className="tiny" style={{ margin: 0 }}>
            {spotTrend ? spotTrend.text[locale] : t(locale, "trending.quiet")}
          </p>
          {spotTrend && (
            <p className="tiny muted" style={{ display: "flex", alignItems: "center", gap: 4, margin: 0 }}>
              <Flame size={12} aria-hidden="true" /> {spotTrend.joins7d} {t(locale, "trending.joins")}
            </p>
          )}
        </>
      )}
    </div>
  ) : null;

  return (
    <>
      <div className="pagehead">
        <div className="pagehead__text">
          <h1>{t(locale, "trending.title")}</h1>
          <p className="lead">{t(locale, "trending.sub")}</p>
        </div>
      </div>

      <Globe
        pins={pins}
        selectedId={spotId}
        onSelect={setSpotId}
        label={t(locale, "trending.mapLabel")}
        zoomInLabel={t(locale, "trending.zoomIn")}
        zoomOutLabel={t(locale, "trending.zoomOut")}
        resetLabel={t(locale, "trending.resetView")}
        popup={popup}
        onClosePopup={() => setSpotId(null)}
        userLoc={userLoc}
        userLabel={t(locale, "trending.you")}
      />
      <p className="tiny muted" style={{ textAlign: "center" }}>{t(locale, "trending.demo")}</p>
    </>
  );
}
