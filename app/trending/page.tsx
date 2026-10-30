"use client";

import { useMemo, useState } from "react";
import { Flame } from "lucide-react";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { SPOTS, SPOT_BY_ID, SPOT_TRENDS } from "@/lib/data/spots";
import { USER_BY_ID } from "@/lib/data/users";
import { trendingScores } from "@/lib/social";
import { PlanCard } from "@/components/PlanCard";
import { Globe } from "@/components/Globe";

export default function TrendingPage() {
  const { state } = useStore();
  const locale = state.locale;
  const viewerVerified = state.verification === "verified";
  const [spotId, setSpotId] = useState<string>("jakarta");

  const scores = useMemo(
    () => trendingScores(state.activities, state.joins, state.authorReviews),
    [state.activities, state.joins, state.authorReviews],
  );
  const top = scores.slice(0, 6);
  const spot = SPOT_BY_ID.get(spotId);
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

  const why = (activityId: string) => {
    const facts = scores.find((item) => item.activityId === activityId)?.facts;
    if (!facts) return "";
    const parts = [
      locale === "en" ? `${facts.joins} joins` : `${facts.joins} gabung`,
      facts.daysAgo <= 0
        ? locale === "en" ? "posted today" : "diposting hari ini"
        : locale === "en" ? `${facts.daysAgo}d ago` : `${facts.daysAgo} hari lalu`,
    ];
    if (facts.authorAvg != null) parts.push(`★ ${facts.authorAvg}`);
    return parts.join(" · ");
  };

  return (
    <>
      <div className="pagehead">
        <div className="pagehead__text">
          <h1>{t(locale, "trending.title")}</h1>
          <p className="lead">{t(locale, "trending.sub")}</p>
        </div>
      </div>

      <div className="split">
        <Globe
          pins={pins}
          selectedId={spotId}
          onSelect={setSpotId}
          label={t(locale, "trending.mapLabel")}
          zoomInLabel={t(locale, "trending.zoomIn")}
          zoomOutLabel={t(locale, "trending.zoomOut")}
          resetLabel={t(locale, "trending.resetView")}
        />
        <div className="stack">
          <div className="chips">
            {SPOTS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="chip"
                aria-pressed={spotId === item.id}
                onClick={() => setSpotId(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>
          {spot && (
            <section className="card stack">
              <h2>
                {spot.name} · {spot.region}, {spot.country}
              </h2>
              {spotId === "jakarta" ? (
                <div className="stack">
                  {top.map((item) => {
                    const activity = state.activities.find((plan) => plan.id === item.activityId);
                    if (!activity) return null;
                    return (
                      <div key={item.activityId} className="stack" style={{ gap: "var(--space-2xs)" }}>
                        <PlanCard
                          activity={activity}
                          creator={USER_BY_ID.get(activity.creatorId) ?? null}
                          locale={locale}
                          viewerVerified={viewerVerified}
                        />
                        <p className="tiny muted">
                          <Flame size={12} aria-hidden="true" style={{ display: "inline" }} /> {why(item.activityId)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="lead">
                  <Flame size={14} aria-hidden="true" style={{ display: "inline" }} />{" "}
                  {spotTrend
                    ? `${spotTrend.joins7d} ${t(locale, "trending.joins")} · ${spotTrend.text[locale]}`
                    : t(locale, "trending.quiet")}
                </p>
              )}
              <p className="tiny muted">{t(locale, "trending.demo")}</p>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
