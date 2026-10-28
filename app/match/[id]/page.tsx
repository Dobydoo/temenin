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
    <div className="row" style={{ justifyContent: "flex-end", marginBlockStart: "var(--space-md)" }}>
      <button type="button" className="btn btn--sm" onClick={ask}>
        {pickLabel}
      </button>
    </div>
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
        <span className="stack" style={{ gap: 0 }}>
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
      <div className="pagehead">
        <div className="pagehead__text">
          <h1>{activity.description}</h1>
          <p className="lead">{activity.description}</p>
          <div className="row small muted">
            <span className="tag tag--plain">
              {area?.name}, {area?.city}
            </span>
            <time dateTime={activity.startsAt}>{formatDate(activity.startsAt, locale)}</time>
            <span>
              {activity.budgetMin.toLocaleString("id-ID")} to {activity.budgetMax.toLocaleString("id-ID")} IDR
            </span>
          </div>
        </div>
        {myScore && !mine && (
          <Link className="btn btn--quiet" href={`/match/${activity.id}/detail?candidate=${posterUser.id}`}>
            {t(locale, "match.breakdown")}
          </Link>
        )}
      </div>

      <article className="card plan--lead">
        <div className="row" style={{ alignItems: "flex-start", justifyContent: "space-between" }}>
          <div className="row" style={{ gap: "var(--space-md)", alignItems: "flex-start" }}>
            <span className="avatar avatar--lg" aria-hidden="true">
              {posterUser.avatarInitials}
            </span>
            <div className="stack" style={{ gap: "var(--space-2xs)" }}>
              <span className="tiny muted">{t(locale, "match.hostedBy")}</span>
              <span className="row">
                <strong>{posterUser.name}</strong>
                <VerifiedBadge user={posterUser} locale={locale} />
              </span>
              <span className="small muted">
                {posterUser.mbti ?? (locale === "en" ? "Blank" : "Kosong")}, {posterUser.activitiesCompleted}{" "}
                {locale === "en" ? "plans done" : "rencana selesai"}, {posterUser.reliability}% {locale === "en" ? "showed up" : "datang"}
              </span>
              <span className="small">{posterUser.bio[locale]}</span>
              <span className="row tiny muted">
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
          {myScore && !mine && (
            <div className="stack" style={{ alignItems: "center", gap: "var(--space-2xs)" }}>
              <ScoreRing value={myScore.total} locale={locale} />
              <span className="tiny muted">{t(locale, "match.yourScore")}</span>
            </div>
          )}
        </div>
        {!mine && !myReq && !full && <RequestButton activityId={activity.id} pickLabel={t(locale, "match.pick")} />}
        {!mine && myReq && !myApproved && (
          <p className="note" style={{ marginBlockStart: "var(--space-md)" }}>{t(locale, "match.waitingAuthor")}</p>
        )}
      </article>

      <h2 className="section__head" style={{ marginBlockStart: "var(--space-xl)" }}>
        {t(locale, "match.requests")} ({liveIds.length})
      </h2>
      <p className="small muted">{group ? t(locale, "match.needMore") : t(locale, "match.needOne")}</p>

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

    </>
  );
}
