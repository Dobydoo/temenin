"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Flame } from "lucide-react";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { SPOTS, SPOT_BY_ID, SPOT_TRENDS } from "@/lib/data/spots";
import { trendingScores } from "@/lib/social";
import { Globe } from "@/components/Globe";

export default function TrendingPage() {
  const { state } = useStore();
  const locale = state.locale;
  const [spotId, setSpotId] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  const locateMe = () => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 8000 },
    );
  };

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

  const topPlan = spotId === "jakarta" ? state.activities.find((plan) => plan.id === top[0]?.activityId) ?? null : null;

  const popup = spot ? (
    <div className="stack" style={{ gap: "var(--space-3xs)" }}>
      <strong>
        {spot.name} · {spot.region}
      </strong>
      <p className="tiny muted" style={{ display: "flex", alignItems: "center", gap: 4 } as React.CSSProperties}>
        <Flame size={12} aria-hidden="true" />{" "}
        {spotId === "jakarta"
          ? `${top.length} ${t(locale, "trending.joins")}`
          : spotTrend
            ? `${spotTrend.joins7d} ${t(locale, "trending.joins")}`
            : t(locale, "trending.quiet")}
      </p>
      {topPlan && (
        <Link className="chip" href={`/match/${topPlan.id}`} style={{ textDecoration: "none", textAlign: "center" }}>
          {t(locale, "action.seeMatches")} →
        </Link>
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
        onLocate={locateMe}
        locateLabel={t(locale, "trending.locateMe")}
      />
      <p className="tiny muted" style={{ textAlign: "center" }}>{t(locale, "trending.demo")}</p>
    </>
  );
}
