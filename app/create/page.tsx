"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { parseFreeText, type ParsedActivity } from "@/lib/engine";
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
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("movie");
  const [areaId, setAreaId] = useState(state.profile.areaId);
  const [startsAt, setStartsAt] = useState("2026-10-31T16:30");
  const [budget, setBudget] = useState(100000);
  const [partySize, setPartySize] = useState(2);
const [openGroup, setOpenGroup] = useState(false);
  const [durationMin, setDurationMin] = useState(60);
  const [rules, setRules] = useState<ActivityRules>(() => state.savedRules ?? emptyRules());
  const [remember, setRemember] = useState(!state.savedRules);
  // Fields the user picked by hand; auto-detect never overwrites these.
  const [touched, setTouched] = useState({ category: false, area: false, budget: false, chat: false });
  const fromPreference = Boolean(state.savedRules);

  const local = parseFreeText(description);
  const [ai, setAi] = useState<ParsedActivity | null>(null);
  useEffect(() => {
    const text = description.trim();
    if (!text) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const ctrl = new AbortController();
        const killer = setTimeout(() => ctrl.abort(), 9000);
        const res = await fetch("/api/ai/parse", {
          method: "POST",
          signal: ctrl.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.slice(0, 500), locale }),
        });
        clearTimeout(killer);
        if (!res.ok) return;
        const json = (await res.json()) as { data?: ParsedActivity; source?: string };
        if (!cancelled && json.source === "ai" && json.data) setAi(json.data);
      } catch {
        // ponytail: silent fallback keeps local parse; upgrade path is a subtle "AI bantu" badge.
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [description, locale]);
  const detected = ai ?? local;
  const touch = (key: keyof typeof touched) => setTouched((current) => (current[key] ? current : { ...current, [key]: true }));
  const autoCategory = touched.category ? category : description.trim() ? detected.category : category;
  const autoAreaId = touched.area ? areaId : (description.trim() && detected.areaId ? detected.areaId : areaId);
  const autoBudget = touched.budget ? budget : description.trim() ? detected.budgetMax : budget;
  const displayRules =
    touched.chat || !description.trim() ? rules : { ...rules, chatLevel: { ...rules.chatLevel, value: detected.chatLevel } };
  const handleRulesChange = (next: ActivityRules) => {
    if (next.chatLevel.value !== displayRules.chatLevel.value) touch("chat");
    setRules(next);
  };
  const post = () => {
    const activity: Activity = {
      id: `a-${Date.now()}`,
      creatorId: viewer.id,
      category: autoCategory,
      description: description.trim(),
      startsAt: new Date(startsAt).toISOString(),
      createdAt: new Date().toISOString(),
      areaId: autoAreaId,
      venueName: null,
      budgetMin: Math.round(autoBudget * 0.7),
      budgetMax: autoBudget,
      partySize,
      openGroup,
      durationMin,
      source: "form",
      status: "open",
      rules: displayRules,
    };
    update((current) => ({
      activities: [activity, ...current.activities],
      savedRules: remember ? rules : current.savedRules,
    }));
    router.push(`/match/${activity.id}`);
  };

  const disabled = !description.trim();

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
            <h3>{locale === "en" ? "Plan details" : "Detail rencana"}</h3>
            <FieldShell
              label={t(locale, "field.notes")}
              htmlFor="description"
              help={locale === "en" ? "Mention the place, budget, or vibe — the form fills itself." : "Sebut tempat, budget, atau vibe — formnya terisi sendiri."}
            >
              <textarea
                id="description"
                className="textarea"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={locale === "en" ? "Saturday afternoon, a film in Tebet, about 100k" : "Sabtu sore mau nonton di Tebet, budget 100 ribuan"}
                rows={3}
              />
            </FieldShell>
            {description.trim() && (
              <p className="tiny muted" aria-live="polite">
                {locale === "en" ? "Detected: " : "Terbaca: "}
                {t(locale, `category.${autoCategory}`)}
                {detected.areaId ? ` · ${AREAS.find((area) => area.id === autoAreaId)?.name}` : ""}
                {` · ${t(locale, `chat.${displayRules.chatLevel.value}`)}`}
                {` · Rp ${autoBudget.toLocaleString("id-ID")}`}
              </p>
            )}
            <FieldShell label={t(locale, "field.category")}>
              <CategoryChips
                value={autoCategory}
                onChange={(value) => {
                  touch("category");
                  setCategory(value);
                }}
                locale={locale}
              />
            </FieldShell>
            <FieldShell label={t(locale, "field.area")} htmlFor="area">
              <Select
                id="area"
                label={t(locale, "field.area")}
                value={autoAreaId}
                onChange={(value) => {
                  touch("area");
                  setAreaId(value);
                }}
              >
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
                  value={autoBudget.toLocaleString("id-ID")}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "");
                    touch("budget");
                    setBudget(digits ? Number(digits) : 0);
                  }}
                />
              </div>
              <label className="check" style={{ marginBlockStart: "var(--space-sm)" }}>
                <input type="checkbox" checked={openGroup} onChange={(event) => setOpenGroup(event.target.checked)} />
                <span className="check__text">
                  {t(locale, "create.openGroup")}
                  <span className="field__help">{t(locale, "create.openGroupHelp")}</span>
                </span>
              </label>
            </FieldShell>
            <FieldShell label={t(locale, "field.duration")} htmlFor="duration">
              <div className="stepper" role="group" aria-label={t(locale, "field.duration")}>
                <button
                  type="button"
                  className="stepper__btn"
                  onClick={() => setDurationMin((value) => Math.max(30, value - 30))}
                  disabled={durationMin <= 30}
                  aria-label={locale === "en" ? "Shorter" : "Lebih singkat"}
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>
                <output id="duration" className="stepper__value" aria-live="polite">
                  {durationMin % 60 === 0 ? `${durationMin / 60} h` : `${durationMin} min`}
                </output>
                <button
                  type="button"
                  className="stepper__btn"
                  onClick={() => setDurationMin((value) => Math.min(480, value + 30))}
                  disabled={durationMin >= 480}
                  aria-label={locale === "en" ? "Longer" : "Lebih lama"}
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </div>
            </FieldShell>
            <FieldShell label={t(locale, "field.party")} htmlFor="party">
              <div className="stepper" role="group" aria-label={t(locale, "field.party")}>
                <button
                  type="button"
                  className="stepper__btn"
                  onClick={() => setPartySize((value) => Math.max(2, value - 1))}
                  disabled={openGroup || partySize <= 2}
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
                  disabled={openGroup || partySize >= 4}
                  aria-label={locale === "en" ? "One more person" : "Tambah satu orang"}
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </div>
            </FieldShell>
          </section>
        </div>

        <div className="stack">
          <RulesEditor rules={displayRules} locale={locale} onChange={handleRulesChange} fromPreference={fromPreference} />
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
