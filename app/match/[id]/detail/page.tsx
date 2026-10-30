"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { MapPin, ShieldCheck, Star } from "lucide-react";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { bandLabel, recommendVenues, scoreRows } from "@/lib/engine";
import { PERSONAS, USER_BY_ID } from "@/lib/data/users";
import { VENUES } from "@/lib/data/venues";
import { AREA_BY_ID } from "@/lib/data/areas";
import { formatDate } from "@/lib/format";
import { ScoreRing, VerifiedBadge } from "@/components/ui";
import { SealedPlan } from "@/components/SealedPlan";
import { useState } from "react";

const CHECK_LABEL: Record<string, { en: string; id: string }> = {
  gender: { en: "Gender fits your preference", id: "Gender sesuai preferensimu" },
  interest: { en: "Shares the interest you asked for", id: "Punya minat yang kamu minta" },
  chat: { en: "Talking level matches", id: "Level ngobrol cocok" },
  radius: { en: "Inside your radius", id: "Masuk radiusmu" },
  mbti: { en: "MBTI fits your rule", id: "MBTI sesuai aturanmu" },
  verified: { en: "Identity verified", id: "Identitas terverifikasi" },
};

const ROW_LABEL: Record<string, string> = {
  gender: "match.gender",
  interest: "match.interest",
  energy: "match.energyFit",
  context: "match.context",
  trust: "match.trust",
};

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const candidateId = search.get("candidate") ?? "";
  const { state, update, viewer, match } = useStore();
  const router = useRouter();
  const locale = state.locale;
  const [shared, setShared] = useState(false);

  const resolved = match(id, candidateId);

  if (!resolved || resolved.index < 0) {
    return (
      <div className="stack">
        <h1>{t(locale, "match.title")}</h1>
        <p className="muted">{t(locale, "match.none")}</p>
        <Link className="btn btn--sm" href={`/match/${id}`}>
          {t(locale, "action.back")}
        </Link>
      </div>
    );
  }

  const { activity, candidate, ranked } = resolved;
  const mine = activity.creatorId === viewer.id;
  if (state.verification !== "verified" && !mine) return <SealedPlan activity={activity} locale={state.locale} />;
  const current = ranked[resolved.index];
  if (!current) {
    return (
      <div className="stack">
        <p className="muted">{t(locale, "match.none")}</p>
        <Link className="btn btn--sm" href={`/match/${id}`}>
          {t(locale, "action.back")}
        </Link>
      </div>
    );
  }
  const area = AREA_BY_ID.get(activity.areaId);
  const venues = recommendVenues(activity, VENUES, locale);
  const creator = USER_BY_ID.get(activity.creatorId) ?? viewer;
  const rows = scoreRows(current);
  const metRequired = current.checklist.filter((item) => item.required);

  const pick = () => {
    const matchId = `${activity.id}:${candidate.id}`;
    update((store) => ({
      selected: { ...store.selected, [activity.id]: candidate.id },
      joins: {
        ...store.joins,
        [activity.id]: store.joins[activity.id]?.includes(candidate.id)
          ? (store.joins[activity.id] as string[])
          : [...(store.joins[activity.id] ?? []), candidate.id],
      },
      meetups: store.meetups.some((meetup) => meetup.matchId === matchId)
        ? store.meetups
        : [
            ...store.meetups,
            {
              id: `mu-${matchId}`,
              matchId,
              venueName: venues[0]?.venue.name ?? "",
              areaId: venues[0]?.venue.areaId ?? activity.areaId,
              scheduledAt: activity.startsAt,
              checklistCreator: false,
              checklistCandidate: false,
              confirmedByCreatorAt: null,
              confirmedByCandidateAt: null,
              planSharedAt: null,
              status: "pending",
            },
          ],
    }));
    router.push(`/messages/${matchId}`);
  };

  return (
    <>
      <div className="pagehead">
        <div className="pagehead__text">
          <Link className="small" href={`/match/${activity.id}`}>
            {t(locale, "action.back")}
          </Link>
          <h1>{candidate.name}</h1>
          <div className="row">
            <VerifiedBadge user={candidate} locale={locale} />
            <span className="small muted">{bandLabel(current.distanceBand, locale)}</span>
            <span className="small muted">{candidate.mbti ?? (locale === "en" ? "MBTI left blank" : "MBTI dikosongkan")}</span>
          </div>
        </div>
      </div>

      <div className="split">
        <aside className="stack sticky">
          <section className="card stack">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="avatar avatar--lg" aria-hidden="true">
                {candidate.avatarInitials}
              </span>
              <ScoreRing value={current.total} locale={locale} />
            </div>
            <p className="small">{candidate.bio[locale]}</p>
            <div className="rows">
              <span>
                <span className="muted">{locale === "en" ? "Trust score" : "Skor kepercayaan"}</span>
                <span className="row" style={{ gap: "var(--space-2xs)" }}>
                  <Star size={14} aria-hidden="true" />
                  {candidate.trustScore.toFixed(1)}
                </span>
              </span>
              <span>
                <span className="muted">{t(locale, "safety.reliability")}</span>
                <span>{candidate.reliability}%</span>
              </span>
              <span>
                <span className="muted">{locale === "en" ? "Plans finished" : "Rencana selesai"}</span>
                <span>{candidate.activitiesCompleted}</span>
              </span>
              <span>
                <span className="muted">{locale === "en" ? "Area" : "Area"}</span>
                <span>{AREA_BY_ID.get(candidate.areaId)?.name}</span>
              </span>
            </div>
            <button type="button" className="btn btn--block" onClick={pick}>
              {t(locale, "match.pick")}
            </button>
            <span className="tiny muted">
              {locale === "en"
                ? "Contact details stay in the app until you both confirm the meetup."
                : "Info kontak tetap di app sampai kalian berdua konfirmasi ketemuan."}
            </span>
          </section>
        </aside>

        <div className="stack">
          <section className="card stack">
            <h2>{t(locale, "match.breakdown")}</h2>
            <div className="bars">
              {rows.map((row) => (
                <div className="bar" key={row.key}>
                  <span>{t(locale, ROW_LABEL[row.key] ?? row.key)}</span>
                  <span className="bar__track" aria-hidden="true">
                    <span
                      className="bar__fill"
                      style={{ display: "block", width: `${Math.round(row.value * 100)}%`, background: row.value < 0.35 ? "var(--color-muted)" : undefined }}
                    />
                  </span>
                  <span className="bar__value">
                    {Math.round(row.value * 100)} · {Math.round(row.weight * 100)}%
                  </span>
                </div>
              ))}
            </div>
            <p className="small">{current.explanation[locale]}</p>
          </section>

          <section className="card stack">
            <div className="spread">
              <h2>{t(locale, "match.checklist")}</h2>
              <span className={metRequired.every((item) => item.met) ? "tag" : "tag tag--plain"}>
                {metRequired.filter((item) => item.met).length} {t(locale, "common.of")} {metRequired.length}
              </span>
            </div>
            <ul className="rows">
              {current.checklist.map((item) => (
                <li key={item.key}>
                  <span>{CHECK_LABEL[item.key]?.[locale] ?? item.key}</span>
                  <span className="row" style={{ gap: "var(--space-xs)" }}>
                    {item.required && <span className="tag tag--plain">{t(locale, "create.required")}</span>}
                    <span className={item.met ? "tag" : "tag tag--plain"}>{item.met ? (locale === "en" ? "met" : "terpenuhi") : locale === "en" ? "not met" : "belum"}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card stack">
            <h2>{t(locale, "match.icebreakers")}</h2>
            <ol className="listrows">
              {current.icebreakers[locale].map((line, index) => (
                <li key={line}>
                  <span className="listrows__n">{index + 1}</span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="card stack">
            <h2>{t(locale, "match.venues")}</h2>
            <p className="small muted">
              {area?.name}, {area?.city}. {formatDate(activity.startsAt, locale)}
            </p>
            <ul className="rows">
              {venues.map(({ venue, reason }) => (
                <li key={venue.id}>
                  <span className="stack" style={{ gap: "var(--space-3xs)" }}>
                    <strong>{venue.name}</strong>
                    <span className="small muted">{reason}</span>
                  </span>
                  <span className="row tiny muted">
                    <MapPin size={14} aria-hidden="true" />
                    {AREA_BY_ID.get(venue.areaId)?.name}
                  </span>
                </li>
              ))}
            </ul>
            <div className="well stack">
              <strong className="row" style={{ gap: "var(--space-2xs)" }}>
                <ShieldCheck size={16} aria-hidden="true" />
                {t(locale, "match.safety")}
              </strong>
              <ul className="rows">
                <li>
                  <span>{t(locale, "meetup.check1")}</span>
                </li>
                <li>
                  <span>{t(locale, "meetup.check2")}</span>
                </li>
                <li>
                  <span>{t(locale, "meetup.check3")}</span>
                </li>
              </ul>
              <button type="button" className="btn btn--quiet btn--sm" onClick={() => setShared(true)}>
                {shared ? t(locale, "meetup.shareNow") : t(locale, "action.sharePlan")}
              </button>
              {shared && <span className="tiny muted">{t(locale, "common.notConnected")}</span>}
            </div>
          </section>

          <section className="card stack">
            <h2>{locale === "en" ? "Others for this plan" : "Kandidat lain"}</h2>
            <ul className="rows">
              {ranked
                .filter((item) => item.candidateId !== candidate.id)
                .slice(0, 4)
                .map((item) => {
                  const person = PERSONAS.find((entry) => entry.id === item.candidateId);
                  return (
                    <li key={item.candidateId}>
                      <Link className="row" href={`/match/${activity.id}/detail?candidate=${item.candidateId}`} style={{ gap: "var(--space-sm)" }}>
                        <span className="avatar" aria-hidden="true">
                          {person?.avatarInitials}
                        </span>
                        <span>{person?.name}</span>
                      </Link>
                      <span className="mono-figures muted">{item.total}</span>
                    </li>
                  );
                })}
            </ul>
            <span className="tiny muted">
              {locale === "en" ? `Requested by ${creator.name}` : `Diminta oleh ${creator.name}`}
            </span>
          </section>
        </div>
      </div>
    </>
  );
}
