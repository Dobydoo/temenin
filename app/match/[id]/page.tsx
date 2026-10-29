"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { ShieldAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { WEIGHTS, bandLabel, composeMatch } from "@/lib/engine";
import { PERSONAS, USER_BY_ID } from "@/lib/data/users";
import { AREA_BY_ID } from "@/lib/data/areas";
import { formatDate } from "@/lib/format";
import { ScoreRing, VerifiedBadge } from "@/components/ui";

function RequestButton({ activityId, pickLabel }: { activityId: string; pickLabel: string }) {
  const { update, viewer } = useStore();
  const ask = () => {
    update((store) => ({
      joins: {
        ...store.joins,
        [activityId]: store.joins[activityId]?.includes(viewer.id)
          ? (store.joins[activityId] as string[])
          : [...(store.joins[activityId] ?? []), viewer.id],
      },
    }));
  };
  return (
    <button type="button" className="btn" onClick={ask}>
      {pickLabel}
    </button>
  );
}

function RequestRow({
  activityId,
  startsAt,
  posterId,
  index,
  requesterId,
  isHost,
  approved,
  viewerId,
  locale,
}: {
  activityId: string;
  startsAt: string;
  posterId: string;
  index: number;
  requesterId: string;
  isHost: boolean;
  approved: boolean;
  viewerId: string;
  locale: "en" | "id";
}) {
  const { state, update } = useStore();
  const confirms = state.confirms[activityId] ?? [];
  const confirmed = confirms.includes(requesterId);
  const isMe = requesterId === viewerId;
  const user = USER_BY_ID.get(requesterId);

  const approve = (on: boolean) => {
    update((store) => {
      const cur = store.approved[activityId] ?? [];
      return { approved: { ...store.approved, [activityId]: on ? [...cur.filter((x) => x !== requesterId), requesterId] : cur.filter((x) => x !== requesterId) } };
    });
  };
  const confirmStay = () => {
    update((store) => ({
      confirms: {
        ...store.confirms,
        [activityId]: store.confirms[activityId]?.includes(requesterId)
          ? (store.confirms[activityId] as string[])
          : [...(store.confirms[activityId] ?? []), requesterId],
      },
    }));
  };
  const inWindow = (() => {
    const ms = new Date(startsAt).getTime() - Date.now();
    return Number.isFinite(ms) && ms > 24 * 3600 * 1000;
  })();
  const drop = (block: boolean) => {
    update((store) => {
      const cur = store.removed[activityId] ?? [];
      const blocked = store.blocked[requesterId] ?? [];
      return {
        removed: { ...store.removed, [activityId]: cur.includes(requesterId) ? cur : [...cur, requesterId] },
        ...(block ? { blocked: { ...store.blocked, [requesterId]: [...blocked, posterId].filter(Boolean) } } : {}),
      };
    });
  };
  const reportIt = () => {
    update((store) => ({
      reported: { ...store.reported, [requesterId]: [...(store.reported[requesterId] ?? []), activityId] },
    }));
  };

  return (
    <li className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="avatar" aria-hidden="true">
          {(isHost || isMe ? user?.avatarInitials : `#${index + 1}`) ?? "?"}
        </span>
        <span className="stack" style={{ gap: 0, flex: 1, alignItems: "center", textAlign: "center" }}>
          <strong>{isHost || isMe ? user?.name : `${t(locale, "match.censored")} ${index + 1}`}</strong>
          {approved ? (
            <span className="tag tag--verified">{t(locale, "match.approved")}</span>
          ) : (
            <span className="tag tag--plain">{isHost ? t(locale, "match.requests") : t(locale, "match.waitingAuthor")}</span>
          )}
        </span>
        <span className="row">
          {isHost && !approved && (
            <button type="button" className="btn btn--sm" onClick={() => approve(true)}>
              {t(locale, "match.approve")}
            </button>
          )}
          {isHost && approved && (
            <details>
              <summary className="btn btn--quiet btn--sm">{t(locale, "match.manage")}</summary>
              <div className="stack" style={{ marginBlockStart: "var(--space-xs)" }}>
                {inWindow && !confirmed ? (
                  <>
                    <button type="button" className="btn btn--quiet btn--sm" onClick={() => drop(false)}>
                      {t(locale, "match.dropOnly")}
                    </button>
                    <button type="button" className="btn btn--quiet btn--sm" onClick={() => drop(true)}>
                      {t(locale, "match.dropBlock")}
                    </button>
                    <p className="tiny muted">{t(locale, "match.dropWindow")}</p>
                  </>
                ) : (
                  <p className="tiny muted">{t(locale, "match.dropLate")}</p>
                )}
                <button type="button" className="btn btn--quiet btn--sm" onClick={reportIt}>
                  {t(locale, "match.report")}
                </button>
              </div>
            </details>
          )}
          {isMe && approved && !confirmed && (
            <button type="button" className="btn btn--sm" onClick={confirmStay}>
              {t(locale, "match.confirmStay")}
            </button>
          )}
          {isMe && approved && confirmed && <span className="tag tag--verified">{t(locale, "match.confirmed")}</span>}
        </span>
      </div>
    </li>
  );
}

export default function MatchListPage() {
  const { id } = useParams<{ id: string }>();
  const { state, viewer } = useStore();
  const locale = state.locale;
  const activity = state.activities.find((item) => item.id === id);
  const mine = activity ? activity.creatorId === viewer.id : false;
  const myScore = useMemo(() => {
    if (!activity || mine) return null;
    return composeMatch(activity, viewer, USER_BY_ID.get(activity.creatorId) ?? viewer);
  }, [activity, mine, viewer]);
  const requestIds = activity ? (state.joins[activity.id] ?? []) : [];
  const approvedIds = activity ? (state.approved[activity.id] ?? []) : [];
  const removedIds = activity ? (state.removed[activity.id] ?? []) : [];
  const liveIds = requestIds.filter((rid) => !removedIds.includes(rid));
  const spots = activity ? Math.max(activity.partySize - 1, 1) : 1;
  const group = activity ? activity.rules.mode.value !== "one_on_one" || activity.partySize > 2 : false;

  if (!activity) return <p className="muted">{locale === "en" ? "That plan is gone." : "Rencana itu tidak ada."}</p>;

  const area = AREA_BY_ID.get(activity.areaId);
  const selected = state.selected[activity.id];
  const poster = USER_BY_ID.get(activity.creatorId) ?? null;

  const posterUser = poster ?? viewer;
  const isHost = mine;
  const myReq = !mine && liveIds.includes(viewer.id);
  const myApproved = !mine && approvedIds.includes(viewer.id);
  const myConfirmed = !mine && (state.confirms[activity.id] ?? []).includes(viewer.id);
  const needCount = group ? spots : 1;
  const approvedCount = approvedIds.filter((rid) => !removedIds.includes(rid)).length;
  const full = approvedCount >= needCount;

  return (
    <>
      <nav className="tiny muted" aria-label="Breadcrumb" style={{ marginBlockEnd: "var(--space-sm)" }}>
        <Link href="/explore">{t(locale, "nav.explore")}</Link>
        {" / "}
        <span aria-current="page">{activity.description.slice(0, 32)}{activity.description.length > 32 ? "…" : ""}</span>
      </nav>
      <div className="matchgrid">
        <div className="pagehead matchgrid__plan">
          <div className="pagehead__text">
            <span className="row" style={{ gap: "var(--space-xs)" }}>
              <span className="tag">{t(locale, `category.${activity.category}`)}</span>
              <span className="tag tag--plain">
                {area?.name}, {area?.city}
              </span>
            </span>
            <h1>{activity.description}</h1>
            <div className="row small muted">
              <time dateTime={activity.startsAt}>{formatDate(activity.startsAt, locale)}</time>
              <span aria-hidden="true">·</span>
              <span>
                {activity.budgetMin.toLocaleString("id-ID")}–{activity.budgetMax.toLocaleString("id-ID")} IDR
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {group
                  ? locale === "en"
                    ? `${approvedCount} out of ${spots} joined`
                    : `${approvedCount} dari ${spots} gabung`
                  : locale === "en"
                    ? `Needs 1 temen`
                    : `Butuh 1 temen`}
              </span>
            </div>
          </div>
        </div>

        <article className="card host matchgrid__host">
          <div className="stack host__who">
            <span className="row" style={{ gap: "var(--space-sm)", alignItems: "flex-start" }}>
              <span className="avatar avatar--lg" aria-hidden="true">
                {posterUser.avatarInitials}
              </span>
              <span className="stack" style={{ gap: 0, flex: 1, minWidth: 0 }}>
                <span className="tiny muted">{t(locale, "match.hostedBy")}</span>
                <strong>{posterUser.name}</strong>
                <span style={{ alignSelf: "flex-start" }}>
                  <VerifiedBadge user={posterUser} locale={locale} />
                </span>
              </span>
              {myScore && !mine && (
                <Link
                  className="host__score"
                  href={`/match/${activity.id}/detail?candidate=${posterUser.id}`}
                  title={t(locale, "match.yourScore")}
                  aria-label={`${t(locale, "match.yourScore")}: ${myScore.total}. ${t(locale, "match.breakdown")}`}
                >
                  <ScoreRing value={myScore.total} locale={locale} />
                </Link>
              )}
            </span>
            <span className="small muted">
              {posterUser.mbti ?? (locale === "en" ? "Blank" : "Kosong")}, {posterUser.activitiesCompleted}{" "}
              {locale === "en" ? "plans done" : "rencana selesai"}, {posterUser.reliability}% {locale === "en" ? "showed up" : "datang"}
            </span>
            <span className="small">{posterUser.bio[locale]}</span>
            <span className="host__cta">
              {!mine && !myReq && !full && <RequestButton activityId={activity.id} pickLabel={t(locale, "match.pick")} />}
              {!mine && myReq && !myApproved && (
                <span className="note">{t(locale, "match.waitingAuthor")}</span>
              )}
              {!mine && full && (
                <span className="tag tag--plain">{t(locale, "match.full")}</span>
              )}
              {mine && (
                <span className="tag tag--accent">{t(locale, "board.yourPlan")}</span>
              )}
            </span>
          </div>
        </article>
      </div>

      <section className="section section--tight">
        <div className="section__head">
          <h2>
            {t(locale, "match.requests")} ({liveIds.length})
          </h2>
          <span className="tiny muted">{group ? t(locale, "match.needMore") : t(locale, "match.needOne")}</span>
        </div>

      {liveIds.length === 0 ? (
        <div className="well stack">
          <h2>{t(locale, "match.none")}</h2>
        </div>
      ) : (
        <ul className="stack">
          {liveIds.map((rid, i) => (
            <RequestRow
              key={rid}
              activityId={activity.id}
              startsAt={activity.startsAt}
              posterId={activity.creatorId}
              index={i}
              requesterId={rid}
              isHost={isHost}
              approved={approvedIds.includes(rid)}
              viewerId={viewer.id}
              locale={locale}
            />
          ))}
        </ul>
      )}
      </section>
    </>
  );
}
