"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { parseFreeText } from "@/lib/engine";
import { AREAS } from "@/lib/data/areas";
import { CategoryChips, FieldShell, RulesEditor, Select } from "@/components/RulesEditor";
import type { Activity, ActivityRules, Category } from "@/lib/types";

const emptyRules = (): ActivityRules => ({
  chatLevel: { value: "moderate", required: false },
  mbti: { mode: "any", types: [], required: false },
  interest: { id: null, required: false },
  mode: { value: "one_on_one", required: false },
  radius: { value: "km10", hardFilter: false },
  gender: { value: "any", hardFilter: false },
});

export default function CreatePage() {
  const { state, update, viewer } = useStore();
  const router = useRouter();
  const locale = state.locale;
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("movie");
  const [areaId, setAreaId] = useState(state.profile.areaId);
  const [startsAt, setStartsAt] = useState("2026-10-31T16:30");
  const [budget, setBudget] = useState(100000);
  const [partySize, setPartySize] = useState(2);
  const [rules, setRules] = useState<ActivityRules>(() => state.savedRules ?? emptyRules());
  const [remember, setRemember] = useState(!state.savedRules);
  const [parsed, setParsed] = useState(false);
  const fromPreference = Boolean(state.savedRules) && !parsed;

  const preview = parseFreeText(text);

  const handleParse = () => {
    if (!text.trim()) return;
    setDescription(text.trim());
    setCategory(preview.category);
    setAreaId(preview.areaId ?? areaId);
    setBudget(preview.budgetMax);
    setRules((current) => ({ ...current, chatLevel: { ...current.chatLevel, value: preview.chatLevel } }));
    setParsed(true);
  };

  const post = () => {
    const activity: Activity = {
      id: `a-${Date.now()}`,
      creatorId: viewer.id,
      category,
      description: description.trim() || text.trim(),
      startsAt: new Date(startsAt).toISOString(),
      createdAt: new Date().toISOString(),
      areaId,
      venueName: null,
      budgetMin: Math.round(budget * 0.7),
      budgetMax: budget,
      partySize,
      source: text.trim() && parsed ? "free_text" : "form",
      status: "open",
      rules,
    };
    update((current) => ({
      activities: [activity, ...current.activities],
      savedRules: remember ? rules : current.savedRules,
    }));
    router.push(`/match/${activity.id}`);
  };

  const disabled = !description.trim() && !text.trim();

  return (
    <>
      <div className="pagehead">
        <div className="pagehead__text">
          <h1>{t(locale, "create.title")}</h1>
          <p className="lead">
            {locale === "en"
              ? "Write it like you would tell a friend. Check the draft, then post."
              : "Tulis seperti cerita ke teman. Cek drafnya, lalu posting."}
          </p>
        </div>
      </div>

      <div className="split">
        <div className="stack sticky">
          <section className="card stack">
            <FieldShell label={t(locale, "create.freeTextLabel")} help={t(locale, "create.freeTextHelp")} htmlFor="free-text">
              <textarea
                id="free-text"
                className="textarea"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={locale === "en" ? "Saturday afternoon, a film in Tebet, about 100k" : "Sabtu sore mau nonton di Tebet, budget 100 ribuan"}
                rows={4}
              />
            </FieldShell>
            <button type="button" className="btn btn--accent" onClick={handleParse} disabled={!text.trim()}>
              <Sparkles size={18} aria-hidden="true" />
              {t(locale, "create.parse")}
            </button>
            {text.trim() && (
              <div className="well stack" aria-live="polite">
                <strong className="small">{t(locale, "create.preview")}</strong>
                <div className="rows">
                  <span>
                    <span className="muted">{t(locale, "field.category")}</span>
                    <span>{t(locale, `category.${preview.category}`)}</span>
                  </span>
                  <span>
                    <span className="muted">{t(locale, "field.area")}</span>
                    <span>{preview.areaId ? AREAS.find((area) => area.id === preview.areaId)?.name : "?"}</span>
                  </span>
                  <span>
                    <span className="muted">{t(locale, "field.when")}</span>
                    <span>{preview.dayHint || "?"}</span>
                  </span>
                  <span>
                    <span className="muted">{t(locale, "field.chatLevel")}</span>
                    <span>{t(locale, `chat.${preview.chatLevel}`)}</span>
                  </span>
                </div>
                {preview.missing.length > 0 && (
                  <p className="small muted">
                    {locale === "en"
                      ? `Temenin could not read the ${preview.missing.join(" and ")}. Pick it by hand below.`
                      : `Temenin belum kebaca ${preview.missing.join(" dan ")}. Pilih manual di bawah.`}
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="card stack">
            <h3>{locale === "en" ? "Plan details" : "Detail rencana"}</h3>
            <FieldShell label={t(locale, "field.notes")} htmlFor="description">
              <textarea id="description" className="textarea" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
            </FieldShell>
            <FieldShell label={t(locale, "field.category")}>
              <CategoryChips value={category} onChange={setCategory} locale={locale} />
            </FieldShell>
            <FieldShell label={t(locale, "field.area")} htmlFor="area">
              <Select id="area" label={t(locale, "field.area")} value={areaId} onChange={setAreaId}>
                {AREAS.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}, {area.city}
                  </option>
                ))}
              </Select>
            </FieldShell>
            <FieldShell label={t(locale, "field.when")} htmlFor="starts">
              <input id="starts" className="input" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
            </FieldShell>
            <FieldShell
              label={t(locale, "field.budget")}
              htmlFor="budget"
              help={locale === "en" ? "Rounded to the nearest thousand rupiah." : "Dibulatkan ke ribuan rupiah terdekat."}
            >
              <div className="inputgroup">
                <span className="inputgroup__prefix" aria-hidden="true">
                  Rp
                </span>
                <input
                  id="budget"
                  className="input input--bare"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={budget.toLocaleString("id-ID")}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "");
                    setBudget(digits ? Number(digits) : 0);
                  }}
                />
              </div>
            </FieldShell>
            <FieldShell label={t(locale, "field.party")} htmlFor="party">
              <div className="stepper" role="group" aria-label={t(locale, "field.party")}>
                <button
                  type="button"
                  className="stepper__btn"
                  onClick={() => setPartySize((value) => Math.max(2, value - 1))}
                  disabled={partySize <= 2}
                  aria-label={locale === "en" ? "One fewer person" : "Kurangi satu orang"}
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>
                <output id="party" className="stepper__value" aria-live="polite">
                  {partySize} {t(locale, "common.people")}
                </output>
                <button
                  type="button"
                  className="stepper__btn"
                  onClick={() => setPartySize((value) => Math.min(4, value + 1))}
                  disabled={partySize >= 4}
                  aria-label={locale === "en" ? "One more person" : "Tambah satu orang"}
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </div>
            </FieldShell>
          </section>
        </div>

        <div className="stack">
          <RulesEditor rules={rules} locale={locale} onChange={setRules} fromPreference={fromPreference} />
          <label className="check">
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
            <span className="check__text">
              {t(locale, "create.savePref")}
              <span className="field__help">{locale === "en" ? "Your next plan starts filled from this one." : "Rencana berikutnya terisi otomatis dari aturan ini."}</span>
            </span>
          </label>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button type="button" className="btn" onClick={post} disabled={disabled}>
              {t(locale, "action.post")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
