"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { AREAS } from "@/lib/data/areas";
import { INTERESTS } from "@/lib/data/interests";
import { Select } from "@/components/RulesEditor";

const QUIZ = [
  {
    key: "socialEnergy",
    label: { en: "A room full of new people feels", id: "Ruangan penuh orang baru terasa" },
    options: [
      { value: "low", label: { en: "draining", id: "menguras" } },
      { value: "medium", label: { en: "fine for a while", id: "oke untuk sementara" } },
      { value: "high", label: { en: "energising", id: "menambah energi" } },
    ],
  },
  {
    key: "chatStyle",
    label: { en: "During a film you", id: "Selama film kamu" },
    options: [
      { value: "quiet", label: { en: "stay quiet", id: "diam saja" } },
      { value: "moderate", label: { en: "whisper once or twice", id: "bisik sekali dua kali" } },
      { value: "chatty", label: { en: "comment all the way", id: "komentar terus" } },
    ],
  },
  {
    key: "spontaneity",
    label: { en: "Your plans usually", id: "Rencanamu biasanya" },
    options: [
      { value: "planner", label: { en: "start a week ahead", id: "disiapkan seminggu sebelumnya" } },
      { value: "balanced", label: { en: "come together the day before", id: "matang sehari sebelumnya" } },
      { value: "spontaneous", label: { en: "begin the same afternoon", id: "dimulai sore itu juga" } },
    ],
  },
  {
    key: "setting",
    label: { en: "You rather meet", id: "Kamu lebih suka ketemu" },
    options: [
      { value: "indoor", label: { en: "indoors", id: "di dalam ruangan" } },
      { value: "outdoor", label: { en: "outdoors", id: "di luar ruangan" } },
      { value: "both", label: { en: "either", id: "dua-duanya" } },
    ],
  },
] as const;

export default function YouPage() {
  const { state, update, logout } = useStore();
  const locale = state.locale;
  const profile = state.profile;
  const saved = state.savedRules;

  return (
    <>
      <div className="pagehead">
        <div className="pagehead__text">
          <h1>{t(locale, "profile.title")}</h1>
          <p className="lead">
            {locale === "en"
              ? "Your energy profile shapes the score. MBTI stays a label you choose."
              : "Profil energimu menentukan skor. MBTI tetap label pilihanmu."}
          </p>
        <div className="row">
          <Link className="btn btn--quiet" href="/safety">
            {t(locale, "safety.title")}
          </Link>
          <button type="button" className="btn btn--quiet btn--sm" onClick={() => logout()}>
            {t(locale, "login.logout")}
          </button>
        </div>
      </div>
    </div>

      <div className="split">
        <aside className="stack sticky">
          <section className="card stack">
            <span className="avatar avatar--lg" aria-hidden="true">
              {profile.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </span>
            <div className="field">
              <label className="field__label" htmlFor="name">
                {t(locale, "onboarding.name")}
              </label>
              <input
                id="name"
                className="input"
                value={profile.name}
                onChange={(event) => update({ profile: { ...profile, name: event.target.value } })}
                autoComplete="name"
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="area">
                {t(locale, "onboarding.area")}
              </label>
              <Select id="area" label={t(locale, "onboarding.area")} value={profile.areaId} onChange={(value) => update({ profile: { ...profile, areaId: value } })}>
                {AREAS.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}, {area.city}
                  </option>
                ))}
              </Select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="mbti">
                {t(locale, "profile.mbti")}
              </label>
              <input
                id="mbti"
                className="input"
                value={profile.mbti ?? ""}
                maxLength={4}
                onChange={(event) => update({ profile: { ...profile, mbti: event.target.value.toUpperCase() || null } })}
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="aboutme">
                {t(locale, "profile.aboutMe")}
              </label>
              <textarea
                id="aboutme"
                className="input"
                rows={3}
                value={profile.aboutMe}
                onChange={(event) => update({ profile: { ...profile, aboutMe: event.target.value } })}
              />
            </div>
            <div className="field">
              <span className="field__label">{t(locale, "profile.language")}</span>
              <div className="langs" role="group" aria-label={t(locale, "profile.language")}>
                <button type="button" aria-pressed={locale === "en"} onClick={() => update({ locale: "en" })}>
                  EN
                </button>
                <button type="button" aria-pressed={locale === "id"} onClick={() => update({ locale: "id" })}>
                  ID
                </button>
              </div>
            </div>
            <div className="field">
              <span className="field__label">{t(locale, "profile.appearance")}</span>
              <div className="seg" role="group" aria-label={t(locale, "profile.appearance")}>
                {(["system", "light", "dark"] as const).map((mode) => (
                  <button key={mode} type="button" aria-pressed={state.mode === mode} onClick={() => update({ mode })}>
                    {mode === "system" ? (locale === "en" ? "System" : "Sistem") : mode === "light" ? t(locale, "profile.light") : t(locale, "profile.dark")}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </aside>

        <div className="stack">
          <section className="card stack">
            <h2>{t(locale, "profile.energy")}</h2>
            <div className="rows">
              <span>
                <span className="muted">Social energy</span>
                <span>{profile.energyProfile.socialEnergy}</span>
              </span>
              <span>
                <span className="muted">Talking level</span>
                <span>{profile.energyProfile.chatStyle}</span>
              </span>
              <span>
                <span className="muted">Spontaneity</span>
                <span>{profile.energyProfile.spontaneity}</span>
              </span>
              <span>
                <span className="muted">Setting</span>
                <span>{profile.energyProfile.setting}</span>
              </span>
            </div>
          </section>

          <section className="card stack">
            <h2>{t(locale, "profile.interests")}</h2>
            <div className="chips">
              {INTERESTS.map((interest) => (
                <button
                  key={interest.id}
                  type="button"
                  className="chip"
                  aria-pressed={profile.interests.includes(interest.id)}
                  onClick={() =>
                    update({
                      profile: {
                        ...profile,
                        interests: profile.interests.includes(interest.id)
                          ? profile.interests.filter((item) => item !== interest.id)
                          : [...profile.interests, interest.id],
                      },
                    })
                  }
                >
                  {locale === "en" ? interest.en : interest.id_}
                </button>
              ))}
            </div>
          </section>

          <section className="card stack">
            <h2>{t(locale, "profile.savedPref")}</h2>
            {saved ? (
              <div className="rows">
                <span>
                  <span className="muted">{t(locale, "field.chatLevel")}</span>
                  <span>{t(locale, `chat.${saved.chatLevel.value}`)}</span>
                </span>
                <span>
                  <span className="muted">{t(locale, "field.gender")}</span>
                  <span>{t(locale, `gender.${saved.gender.value}`)}</span>
                </span>
                <span>
                  <span className="muted">{t(locale, "field.radius")}</span>
                  <span>{t(locale, `radius.${saved.radius.value}`)}</span>
                </span>
              </div>
            ) : (
              <p className="small muted">{t(locale, "profile.noSavedPref")}</p>
            )}
            <Link className="btn btn--quiet btn--sm" href="/create">
              {locale === "en" ? "Post a plan" : "Posting rencana"}
            </Link>
          </section>

          <details className="card">
            <summary className="row" style={{ justifyContent: "space-between" }}>
              {locale === "en" ? "Four quick questions" : "Empat pertanyaan singkat"}
              <ArrowRight size={16} aria-hidden="true" />
            </summary>
            <div className="stack" style={{ marginBlockStart: "var(--space-md)" }}>
              {QUIZ.map((question) => (
                <fieldset key={question.key} className="stack" style={{ border: 0, padding: 0, margin: 0, gap: "var(--space-xs)" }}>
                  <legend className="field__label">{question.label[locale]}</legend>
                  <div className="chips">
                    {question.options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className="chip"
                        aria-pressed={profile.energyProfile[question.key] === option.value}
                        onClick={() => update({ profile: { ...profile, energyProfile: { ...profile.energyProfile, [question.key]: option.value } } })}
                      >
                        {option.label[locale]}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </details>
        </div>
      </div>
    </>
  );
}
