"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { VIEWER, PERSONAS } from "@/lib/data/users";
import { AREA_BY_ID } from "@/lib/data/areas";

const ACCOUNTS = [VIEWER.id, "u-arif"];

export function Gate() {
  const { state, login, hydrate } = useStore();
  const locale = state.locale;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hydrate) setVisible(!state.viewerId);
  }, [hydrate, state.viewerId]);

  if (!hydrate || state.viewerId) return null;

  const pick = (id: string) => login(id);

  return (
    <div className={`gate${visible ? " gate--on" : ""}`} role="dialog" aria-modal="true" aria-label={t(locale, "login.title")}>
      <div className="gate__card card">
        <p className="gate__kicker">{t(locale, "app.tagline")}</p>
        <h1>{t(locale, "login.title")}</h1>
        <p className="small muted">{t(locale, "login.lead")}</p>
        <div className="stack">
          {ACCOUNTS.map((id) => {
            const account = id === VIEWER.id ? VIEWER : PERSONAS.find((p) => p.id === id);
            if (!account) return null;
            const area = AREA_BY_ID.get(account.areaId);
            const verified = account.verification === "verified";
            const initials = account.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2);
            return (
              <div key={id} className="gate__account">
                <span className="avatar" aria-hidden="true">
                  {initials}
                </span>
                <span className="gate__who">
                  <strong>{account.name}</strong>
                  <span className="tiny muted">
                    {area ? `${area.name}, ${area.city}` : account.areaId}
                    {account.mbti ? ` · ${account.mbti}` : ""}
                  </span>
                  {verified ? (
                    <span className="tag tag--verified">
                      <ShieldCheck size={14} aria-hidden="true" />
                      {locale === "en" ? "Verified" : "Terverifikasi"}
                    </span>
                  ) : (
                    <span className="tag tag--plain">
                      {locale === "en" ? "Not verified" : "Belum verifikasi"}
                    </span>
                  )}
                </span>
                <button type="button" className="btn btn--sm" onClick={() => pick(id)}>
                  {t(locale, "login.pick")}
                </button>
              </div>
            );
          })}
        </div>
        <p className="tiny muted">{t(locale, "login.hint")}</p>
      </div>
    </div>
  );
}
