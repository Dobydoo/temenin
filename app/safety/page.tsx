"use client";

import { useMemo, useState } from "react";
import { Check, FileImage, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { TRUSTED_CONTACT_SEED } from "@/lib/data/users";

export default function SafetyPage() {
  const { state, update } = useStore();
  const locale = state.locale;
  const verified = state.verification === "verified";
  const [step, setStep] = useState<0 | 1 | 2>(() => (state.verification === "verified" ? 2 : state.verification === "pending" ? 1 : 0));

  const advance = () => {
    if (step === 0) {
      setStep(1);
      update({ verification: "pending" });
      return;
    }
    setStep(2);
    update({ verification: "verified" });
  };

  const steps = useMemo(
    () => [
      { label: t(locale, "safety.verifyStep1"), icon: FileImage },
      { label: t(locale, "safety.verifyStep2"), icon: ShieldCheck },
    ],
    [locale],
  );

  return (
    <>
      <div className="pagehead">
        <div className="pagehead__text">
          <h1>{t(locale, "safety.title")}</h1>
          <p className="lead">
            {locale === "en"
              ? "Names, places and times stay locked until identity is verified. The exact meeting point needs both sides to confirm."
              : "Nama, tempat, dan waktu terkunci sampai identitas terverifikasi. Titik temu persis butuh konfirmasi dua pihak."}
          </p>
        </div>
      </div>

      <div className="board">
        <section className="card stack">
          <div className="spread">
            <h2>{t(locale, "safety.verifyTitle")}</h2>
            <span className={verified ? "tag" : "tag tag--plain"}>{verified ? t(locale, "safety.verified") : t(locale, "home.viewerUnverified")}</span>
          </div>
          <p className="small muted">{t(locale, "safety.verifyBody")}</p>
          <ol className="stack" style={{ gap: "var(--space-sm)" }}>
            {steps.map(({ label, icon: Icon }, index) => (
              <li key={label} className="step" data-done={verified || step > index}>
                <span className="step__dot">{verified || step > index ? <Check size={14} aria-hidden="true" /> : index + 1}</span>
                <span className="row" style={{ gap: "var(--space-2xs)" }}>
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </span>
              </li>
            ))}
          </ol>
          {verified ? (
            <p className="note">
              <Check size={18} aria-hidden="true" />
              {t(locale, "safety.verified")}
            </p>
          ) : (
            <button type="button" className="btn" onClick={advance}>
              {step === 0 ? t(locale, "action.verify") : t(locale, "action.continue")}
            </button>
          )}
          <span className="tiny muted">{t(locale, "status.simulated")}</span>
        </section>

        <section className="card stack">
          <h2>{t(locale, "safety.contacts")}</h2>
          <p className="small muted">{t(locale, "safety.contactsBody")}</p>
          <div className="rows">
            <span>
              <span className="muted">{locale === "en" ? "Name" : "Nama"}</span>
              <span>{TRUSTED_CONTACT_SEED.name}</span>
            </span>
            <span>
              <span className="muted">{locale === "en" ? "Channel" : "Saluran"}</span>
              <span>{TRUSTED_CONTACT_SEED.channel}</span>
            </span>
          </div>
          <span className="tiny muted">{t(locale, "common.notConnected")}</span>
        </section>

        <section className="card stack">
          <h2>{t(locale, "safety.checklist")}</h2>
          <ul className="rows">
            <li>{t(locale, "meetup.check1")}</li>
            <li>{t(locale, "meetup.check2")}</li>
            <li>{t(locale, "meetup.check3")}</li>
          </ul>
          <p className="small muted">{t(locale, "safety.noLiveLocation")}</p>
        </section>

        <section className="card stack">
          <h2>{locale === "en" ? "Your numbers" : "Angkamu"}</h2>
          <div className="rows">
            <span>
              <span className="muted">{locale === "en" ? "Trust score" : "Skor kepercayaan"}</span>
              <span className="mono-figures">{state.reviews.length > 0 ? "4.7 / 5" : "4.6 / 5"}</span>
            </span>
            <span>
              <span className="muted">{t(locale, "safety.reliability")}</span>
              <span className="mono-figures">92%</span>
            </span>
            <span>
              <span className="muted">{locale === "en" ? "Plans finished" : "Rencana selesai"}</span>
              <span className="mono-figures">{7 + state.reviews.length}</span>
            </span>
          </div>
          <span className="tiny muted">
            {locale === "en" ? "Reliability drops when a confirmed plan is reported as a no-show." : "Skor keandalan turun saat rencana terkonfirmasi dilaporkan tidak datang."}
          </span>
        </section>
      </div>
    </>
  );
}
