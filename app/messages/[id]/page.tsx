"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Check, Lock, Send, Share2, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { inspectMessage, recommendVenues } from "@/lib/engine";
import { VENUES } from "@/lib/data/venues";
import { formatDate } from "@/lib/format";
import { VerifiedBadge } from "@/components/ui";

export default function ThreadPage() {
  const { id } = useParams<{ id: string }>();
  const { state, update, viewer, match } = useStore();
  const locale = state.locale;
  const [draft, setDraft] = useState("");
  const matchId = decodeURIComponent(id);
  const [activityId, candidateId] = matchId.split(":");
  const resolved = match(activityId ?? "", candidateId ?? "");
  const meetup = state.meetups.find((item) => item.matchId === matchId);
  const ticks: [boolean, boolean, boolean] = meetup?.checklistTicks ?? [false, false, false];
  const confirmed = Boolean(meetup?.confirmedByCreatorAt && meetup?.confirmedByCandidateAt);
  const messages = state.messages.filter((message) => message.matchId === matchId);
  const checkin = state.checkins.find((item) => item.meetupId === meetup?.id && item.userId === viewer.id);

  if (!resolved) {
    return <p className="muted">{locale === "en" ? "This chat does not exist." : "Chat ini tidak ada."}</p>;
  }

  const { activity, candidate } = resolved;
  const venues = recommendVenues(activity, VENUES, locale);
  const shared = Boolean(state.planShared[matchId]);

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    const verdict = inspectMessage(body, confirmed);
    const messageId = `msg-${Date.now()}`;
    update((store) => ({
      messages: [
        ...store.messages,
        {
          id: messageId,
          matchId,
          senderId: viewer.id,
          body,
          createdAt: new Date().toISOString(),
          held: verdict.held,
          heldReason: verdict.reason,
        },
      ],
    }));
    setDraft("");
    if (verdict.held || confirmed) return;
    if (!/(\d|@|nomor|nomer|hub|kontak|\bwa\b|\big\b|line|tele|email|pindah|lanjut|off\s*app?|keluar\s*app|nol|kosong|zero|satu|dua|tiga|empat|lima|enam|tujuh|delapan|lapan|sembilan)/i.test(body)) return;
    try {
      const ctrl = new AbortController();
      const killer = setTimeout(() => ctrl.abort(), 9000);
      const res = await fetch("/api/ai/safety", {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.slice(0, 500), locale }),
      });
      clearTimeout(killer);
      if (!res.ok) return;
      const json = (await res.json()) as { source?: string; data?: { risky?: boolean } };
      if (json.source === "ai" && json.data?.risky) {
        update((store) => ({
          messages: store.messages.map((message) =>
            message.id === messageId ? { ...message, held: true, heldReason: "ai_safety_check" as const } : message,
          ),
        }));
      }
    } catch {
      // ponytail: silent fallback keeps pattern-filter verdict; upgrade path is a retry affordance.
    }
  };

  const toggleCheck = (index: 0 | 1 | 2) => {
    if (!meetup) return;
    const next = ticks.map((value, position) => (position === index ? !value : value)) as [boolean, boolean, boolean];
    update((store) => ({
      meetups: store.meetups.map((item) => (item.id === meetup.id ? { ...item, checklistTicks: next, checklistCreator: next.every(Boolean) } : item)),
    }));
  };

  const togglePartnerChecklist = () => {
    if (!meetup) return;
    update((store) => ({
      meetups: store.meetups.map((item) => (item.id === meetup.id ? { ...item, checklistCandidate: !item.checklistCandidate } : item)),
    }));
  };

  const confirmFor = (side: "creator" | "candidate") => {
    if (!meetup) return;
    const key = side === "creator" ? "confirmedByCreatorAt" : "confirmedByCandidateAt";
    update((store) => ({
      meetups: store.meetups.map((item) =>
        item.id === meetup.id
          ? {
              ...item,
              [key]: item[key] ?? new Date().toISOString(),
              status: "pending" as const,
            }
          : item,
      ),
    }));
  };

  const sharePlan = () => {
    if (!meetup) return;
    update((store) => ({
      planShared: { ...store.planShared, [matchId]: true },
      meetups: store.meetups.map((item) => (item.id === meetup.id ? { ...item, planSharedAt: new Date().toISOString() } : item)),
    }));
  };

  const finishPlan = () => {
    if (!meetup) return;
    update((store) => ({
      meetups: store.meetups.map((item) => (item.id === meetup.id ? { ...item, status: "completed" as const } : item)),
      checkins: store.checkins.some((item) => item.meetupId === meetup.id && item.userId === viewer.id)
        ? store.checkins
        : [...store.checkins, { id: `ci-${meetup.id}`, meetupId: meetup.id, userId: viewer.id, status: "prompted", respondedAt: null }],
    }));
  };

  const checkIn = () => {
    if (!meetup) return;
    update((store) => ({
      checkins: store.checkins.some((item) => item.meetupId === meetup.id && item.userId === viewer.id)
        ? store.checkins.map((item) =>
            item.meetupId === meetup.id && item.userId === viewer.id ? { ...item, status: "safe" as const, respondedAt: new Date().toISOString() } : item,
          )
        : [...store.checkins, { id: `ci-${meetup.id}`, meetupId: meetup.id, userId: viewer.id, status: "safe" as const, respondedAt: new Date().toISOString() }],
    }));
  };

  const checklistDone = Boolean(meetup?.checklistCreator);
  const bothReady = checklistDone && Boolean(meetup?.checklistCandidate);

  return (
    <>
      <div className="pagehead">
        <div className="pagehead__text">
          <Link className="small" href="/messages">
            {t(locale, "action.back")}
          </Link>
          <h1>{candidate.name}</h1>
          <div className="row">
            <VerifiedBadge user={candidate} locale={locale} />
            <span className="small muted">{activity.description}</span>
          </div>
        </div>
      </div>

      <div className="split split--chat">
        <div className="card stack sticky">
          <div className="spread">
            <h2>{locale === "en" ? "Meetup" : "Ketemuan"}</h2>
            <span className={confirmed ? "tag" : "tag tag--plain"}>{confirmed ? t(locale, "meetup.bothConfirmed") : t(locale, "meetup.venueAfter")}</span>
          </div>
          <div className="rows">
            <span>
              <span className="muted">{t(locale, "field.when")}</span>
              <time dateTime={meetup?.scheduledAt ?? activity.startsAt}>{formatDate(meetup?.scheduledAt ?? activity.startsAt, locale)}</time>
            </span>
            <span>
              <span className="muted">{locale === "en" ? "Suggested place" : "Tempat usulan"}</span>
              <span className={confirmed ? undefined : "locked"}>
                {confirmed ? (
                  meetup?.venueName ?? venues[0]?.venue.name
                ) : (
                  <>
                    <Lock size={16} aria-hidden="true" />
                    {t(locale, "privacy.venueHidden")}
                  </>
                )}
              </span>
            </span>
            <span>
              <span className="muted">{locale === "en" ? "Your side" : "Sisimu"}</span>
              <span>{meetup?.confirmedByCreatorAt ? t(locale, "meetup.youConfirmed") : locale === "en" ? "Not yet" : "Belum"}</span>
            </span>
            <span>
              <span className="muted">{locale === "en" ? "Buddy side" : "Sisi temen"}</span>
              <span>{meetup?.confirmedByCandidateAt ? t(locale, "meetup.partnerConfirmed") : locale === "en" ? "Not yet" : "Belum"}</span>
            </span>
          </div>

          <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="field__label">{t(locale, "meetup.checklist")}</legend>
            {(
              [
                ["check1", "meetup.check1"],
                ["check2", "meetup.check2"],
                ["check3", "meetup.check3"],
              ] as const
            ).map(([key, label], index) => (
              <label className="check" key={key}>
                <input type="checkbox" checked={ticks[index] ?? false} onChange={() => toggleCheck(index as 0 | 1 | 2)} />
                <span>{t(locale, label)}</span>
              </label>
            ))}
            <label className="check">
              <input type="checkbox" checked={Boolean(meetup?.checklistCandidate)} onChange={togglePartnerChecklist} />
              <span className="small muted">{t(locale, "meetup.simulatePartner")}</span>
            </label>
          </fieldset>

          <button type="button" className="btn btn--block" disabled={!bothReady || confirmed} onClick={() => confirmFor("creator")}>
            <ShieldCheck size={18} aria-hidden="true" />
            {confirmed ? t(locale, "meetup.bothConfirmed") : t(locale, "action.confirmMeetup")}
          </button>
          {!bothReady && <span className="tiny muted">{t(locale, "meetup.needBoth")}</span>}
          <button type="button" className="btn btn--quiet btn--block" disabled={!checklistDone} onClick={() => confirmFor("candidate")}>
            {t(locale, "meetup.simulatePartner")}
          </button>

          <button type="button" className="btn btn--quiet btn--block" onClick={sharePlan} disabled={!confirmed}>
            <Share2 size={18} aria-hidden="true" />
            {shared ? t(locale, "meetup.shareNow") : t(locale, "action.sharePlan")}
          </button>
          {shared && <span className="tiny muted">{t(locale, "common.notConnected")}</span>}

          {meetup?.status === "completed" && checkin?.status !== "safe" && (
            <button type="button" className="btn btn--quiet btn--block" onClick={checkIn}>
              <Check size={18} aria-hidden="true" />
              {t(locale, "action.checkin")}
            </button>
          )}
          {checkin?.status === "safe" && (
            <span className="note">
              <Check size={18} aria-hidden="true" />
              {t(locale, "checkin.done")}
            </span>
          )}
          <button type="button" className="btn btn--quiet btn--block" onClick={finishPlan} disabled={!confirmed || meetup?.status === "completed"}>
            {t(locale, "meetup.simulateComplete")}
          </button>
          {meetup?.status === "completed" && (
            <Link className="btn btn--accent btn--block" href={`/feedback/${matchId}`}>
              {t(locale, "action.giveFeedback")}
            </Link>
          )}
        </div>

        <div className="card stack">
          <div className="spread">
            <h2>{t(locale, "chat.title")}</h2>
            <span className="tiny muted">{confirmed ? t(locale, "chat.confirmedNote") : t(locale, "chat.filterNote")}</span>
          </div>

          <div className="thread" aria-live="polite">
            {messages.length === 0 && <p className="small muted">{t(locale, "chat.empty")}</p>}
            {messages.map((message) => {
              const own = message.senderId === viewer.id;
              return (
                <div key={message.id} className={`bubble${own ? " bubble--own" : ""}${message.held ? " bubble--held" : ""}`}>
                  <span>{message.body}</span>
                  {message.held && (
                    <span className="bubble__note">
                      {message.heldReason === "social_handle"
                        ? t(locale, "chat.heldSocial")
                        : message.heldReason === "ai_safety_check"
                          ? t(locale, "chat.heldAi")
                          : t(locale, "chat.held")}{" "}
                      {message.heldReason === "ai_safety_check" && <span className="tag tag--accent">{t(locale, "ai.badge")}</span>}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="composer">
            <label className="visually-hidden" htmlFor="message">
              {t(locale, "chat.placeholder")}
            </label>
            <textarea
              id="message"
              className="textarea"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t(locale, "chat.placeholder")}
              rows={2}
            />
            <button type="button" className="btn" onClick={send} disabled={!draft.trim()}>
              <Send size={18} aria-hidden="true" />
              {t(locale, "action.send")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
