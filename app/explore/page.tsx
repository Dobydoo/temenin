"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { PERSONAS, USER_BY_ID } from "@/lib/data/users";
import { AREAS } from "@/lib/data/areas";
import { CATEGORIES } from "@/lib/data/interests";
import { PlanCard } from "@/components/PlanCard";
import { composeMatch } from "@/lib/engine";
import type { Category } from "@/lib/types";

function fullLast<T extends { id: string; partySize: number }>(list: T[], joins: Record<string, string[]>) {
  const isFull = (a: T) => (joins[a.id]?.length ?? 0) >= Math.max(a.partySize - 1, 1);
  return [...list].sort((a, b) => Number(isFull(a)) - Number(isFull(b)));
}

export default function ExplorePage() {
  const { state, viewer } = useStore();
  const locale = state.locale;
  const [category, setCategory] = useState<Category | "all">("all");
  const [zone, setZone] = useState<string>("all");
  const [onlyVerified, setOnlyVerified] = useState(true);
  const [sort, setSort] = useState<"match" | "newest">("match");
  const viewerVerified = state.verification === "verified";
  const viewerId = viewer.id;

  const postedTime = (activity: { startsAt: string; createdAt?: string }) => {
    const created = activity.createdAt ? Date.parse(activity.createdAt) : Number.NaN;
    return Number.isNaN(created) ? Date.parse(activity.startsAt) : created;
  };
  const filtered = useMemo(() => {
    const base = fullLast(
      state.activities.filter((activity) => {
        if (category !== "all" && activity.category !== category) return false;
        if (zone !== "all" && AREAS.find((area) => area.id === activity.areaId)?.zone !== zone) return false;
        if ((state.removed[activity.id] ?? []).includes(viewerId)) return false;
        if ((state.blocked[viewerId] ?? []).includes(activity.creatorId)) return false;
        if (onlyVerified) {
          const creator = USER_BY_ID.get(activity.creatorId);
          const isOwn = activity.creatorId === viewerId;
          if (!isOwn && creator?.verification !== "verified") return false;
        }
        return true;
      }),
      state.joins,
    );
    if (sort === "newest") return [...base].sort((a, b) => postedTime(b) - postedTime(a));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- postedTime is a stable local helper
  }, [state.activities, state.joins, state.removed, state.blocked, category, zone, onlyVerified, viewerId, viewer, sort]);

  return (
    <>
      <div className="pagehead">
        <div className="pagehead__text">
          <h1>{t(locale, "nav.explore")}</h1>
          <p className="lead">
            {locale === "en"
              ? "Every plan is a specific activity. Read the description, then check who fits."
              : "Tiap rencana adalah aktivitas spesifik. Baca deskripsinya, lalu cek siapa yang cocok."}
          </p>
        </div>
      </div>

      <section className="card stack" aria-label={locale === "en" ? "Filters" : "Filter"}>
        <div className="row" style={{ gap: "var(--space-md)" }}>
          <div className="chips">
            <button type="button" className="chip" aria-pressed={category === "all"} onClick={() => setCategory("all")}>
              {locale === "en" ? "All" : "Semua"}
            </button>
            {CATEGORIES.map((item) => (
              <button key={item} type="button" className="chip" aria-pressed={category === item} onClick={() => setCategory(item)}>
                {t(locale, `category.${item}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="row" style={{ gap: "var(--space-md)" }}>
          <div className="chips">
            <button type="button" className="chip" aria-pressed={zone === "all"} onClick={() => setZone("all")}>
              {locale === "en" ? "Any zone" : "Semua zona"}
            </button>
            {["jaksel", "jakpus", "jakbar", "jakut", "jaktim", "depok", "tangerang", "bekasi"].map((item) => (
              <button key={item} type="button" className="chip" aria-pressed={zone === item} onClick={() => setZone(item)}>
                {item}
              </button>
            ))}
          </div>
          <label className="check">
            <input type="checkbox" checked={onlyVerified} onChange={(event) => setOnlyVerified(event.target.checked)} />
            <span>{locale === "en" ? "Verified hosts only" : "Hanya pemosting terverifikasi"}</span>
          </label>
        </div>
      </section>

      <section className="section section--tight">
        <div className="section__head">
          <h2>{filtered.length} {locale === "en" ? "plans" : "rencana"}</h2>
          <span className="row" style={{ gap: "var(--space-sm)" }}>
            <span className="tiny muted">{locale === "en" ? `${PERSONAS.length} demo buddies` : `${PERSONAS.length} temen demo`}</span>
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
        {filtered.length === 0 ? (
          <div className="well stack">
            <strong>{t(locale, "board.empty")}</strong>
          </div>
        ) : (
          <div className="board">
            {filtered.map((activity) => (
              <PlanCard
                key={activity.id}
                activity={activity}
                creator={USER_BY_ID.get(activity.creatorId) ?? null}
                locale={locale}
                viewerVerified={viewerVerified}
                crown
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
