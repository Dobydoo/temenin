"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { PERSONAS, USER_BY_ID } from "@/lib/data/users";

export default function MessagesPage() {
  const { state } = useStore();
  const locale = state.locale;
  const threads = Object.entries(state.selected).map(([activityId, candidateId]) => {
    const activity = state.activities.find((item) => item.id === activityId);
    const candidate = PERSONAS.find((person) => person.id === candidateId);
    const messages = state.messages.filter((message) => message.matchId === `${activityId}:${candidateId}`);
    return { activity, candidate, messages, matchId: `${activityId}:${candidateId}` };
  });

  return (
    <>
      <div className="pagehead">
        <div className="pagehead__text">
          <h1>{t(locale, "nav.messages")}</h1>
          <p className="lead">{locale === "en" ? "Plans you picked a buddy for." : "Rencana yang sudah kamu pilih temannya."}</p>
        </div>
      </div>

      {threads.length === 0 ? (
        <div className="well stack">
          <strong className="row" style={{ gap: "var(--space-2xs)" }}>
            <MessageCircle size={18} aria-hidden="true" />
            {t(locale, "empty.noMessages")}
          </strong>
          <Link className="btn btn--sm" href="/">
            {t(locale, "home.boardTitle")}
          </Link>
        </div>
      ) : (
        <ul className="stack">
          {threads.map(({ activity, candidate, messages, matchId }) => (
            <li key={matchId}>
              <Link className="card row" href={`/messages/${matchId}`} style={{ justifyContent: "space-between", textDecoration: "none" }}>
                <span className="row" style={{ gap: "var(--space-md)" }}>
                  <span className="avatar" aria-hidden="true">
                    {candidate?.avatarInitials}
                  </span>
                  <span className="stack" style={{ gap: "var(--space-3xs)" }}>
                    <strong>{candidate?.name}</strong>
                    <span className="small muted">{activity?.description}</span>
                    <span className="tiny muted">
                      {messages.length > 0 ? messages[messages.length - 1]?.body.slice(0, 64) : t(locale, "chat.empty")}
                    </span>
                  </span>
                </span>
                <span className="tiny muted">{USER_BY_ID.get(activity?.creatorId ?? "")?.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
