"use client";

import { CATEGORIES, CATEGORY_INTEREST, INTERESTS } from "@/lib/data/interests";
import { requiredFieldCount } from "@/lib/engine";
import { t } from "@/lib/i18n";
import type { ActivityRules, Category, ChatLevel, GenderPreference, InterestId, Locale, MatchMode, MbtiPreferenceMode, RadiusOption } from "@/lib/types";
import { ChevronDown } from "lucide-react";

type Props = {
  rules: ActivityRules;
  locale: Locale;
  onChange: (rules: ActivityRules) => void;
  fromPreference?: boolean;
};

const MBTI_TYPES = ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"];

export function RulesEditor({ rules, locale, onChange, fromPreference = false }: Props) {
  const requiredUsed = requiredFieldCount(rules);
  const limitReached = requiredUsed >= 2;
  const ruleToggle = (key: "required" | "hardFilter", value: boolean) => value;

  return (
    <section className="card stack" aria-labelledby="rules-heading">
      <div className="spread">
        <h3 id="rules-heading">{t(locale, "create.rules")}</h3>
        {fromPreference && <span className="tag tag--plain">{t(locale, "create.fromPref")}</span>}
      </div>
      <p className="small muted">{t(locale, "create.rulesHelp")}</p>

      <div className="rulefield">
        <div className="rulefield__head">
          <span className="rulefield__label">{t(locale, "field.chatLevel")}</span>
          <button
            type="button"
            className="toggle"
            aria-pressed={rules.chatLevel.required}
            disabled={!rules.chatLevel.required && limitReached}
            onClick={() => onChange({ ...rules, chatLevel: { ...rules.chatLevel, required: ruleToggle("required", !rules.chatLevel.required) } })}
          >
            {rules.chatLevel.required ? t(locale, "create.required") : t(locale, "create.plus")}
          </button>
        </div>
        <div className="chips">
          {(["quiet", "moderate", "chatty"] as ChatLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              className="chip"
              aria-pressed={rules.chatLevel.value === level}
              onClick={() => onChange({ ...rules, chatLevel: { ...rules.chatLevel, value: level } })}
            >
              {t(locale, `chat.${level}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="rulefield">
        <div className="rulefield__head">
          <span className="rulefield__label">{t(locale, "field.gender")}</span>
          <button
            type="button"
            className="toggle"
            aria-pressed={rules.gender.hardFilter}
            onClick={() => onChange({ ...rules, gender: { ...rules.gender, hardFilter: !rules.gender.hardFilter } })}
          >
            {rules.gender.hardFilter ? t(locale, "create.required") : t(locale, "create.plus")}
          </button>
        </div>
        <div className="chips">
          {(["any", "female", "male"] as GenderPreference[]).map((value) => (
            <button
              key={value}
              type="button"
              className="chip"
              aria-pressed={rules.gender.value === value}
              onClick={() => onChange({ ...rules, gender: { ...rules.gender, value } })}
            >
              {t(locale, `gender.${value}`)}
            </button>
          ))}
        </div>
        <span className="tiny muted">
          {locale === "en"
            ? "Gender preference carries the heaviest weight in the score, 30 percent."
            : "Preferensi gender punya bobot terbesar di skor, 30 persen."}
        </span>
      </div>

      <div className="rulefield">
        <div className="rulefield__head">
          <span className="rulefield__label">{t(locale, "field.interest")}</span>
          <button
            type="button"
            className="toggle"
            aria-pressed={rules.interest.required}
            disabled={!rules.interest.required && limitReached}
            onClick={() => onChange({ ...rules, interest: { ...rules.interest, required: !rules.interest.required } })}
          >
            {rules.interest.required ? t(locale, "create.required") : t(locale, "create.plus")}
          </button>
        </div>
        <div className="chips">
          {INTERESTS.map((interest) => (
            <button
              key={interest.id}
              type="button"
              className="chip"
              aria-pressed={rules.interest.id === interest.id}
              onClick={() => onChange({ ...rules, interest: { ...rules.interest, id: interest.id as InterestId } })}
            >
              {locale === "en" ? interest.en : interest.id_}
            </button>
          ))}
        </div>
      </div>

      <div className="rulefield">
        <div className="rulefield__head">
          <span className="rulefield__label">{t(locale, "field.mode")}</span>
          <button
            type="button"
            className="toggle"
            aria-pressed={rules.mode.required}
            disabled={!rules.mode.required && limitReached}
            onClick={() => onChange({ ...rules, mode: { ...rules.mode, required: !rules.mode.required } })}
          >
            {rules.mode.required ? t(locale, "create.required") : t(locale, "create.plus")}
          </button>
        </div>
        <div className="chips">
          {(["one_on_one", "small_group", "any"] as MatchMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className="chip"
              aria-pressed={rules.mode.value === mode}
              onClick={() => onChange({ ...rules, mode: { ...rules.mode, value: mode } })}
            >
              {t(locale, `mode.${mode}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="rulefield">
        <div className="rulefield__head">
          <span className="rulefield__label">{t(locale, "field.mbti")}</span>
          <button
            type="button"
            className="toggle"
            aria-pressed={rules.mbti.required}
            disabled={!rules.mbti.required && limitReached}
            onClick={() => onChange({ ...rules, mbti: { ...rules.mbti, required: !rules.mbti.required } })}
          >
            {rules.mbti.required ? t(locale, "create.required") : t(locale, "create.plus")}
          </button>
        </div>
        <div className="chips">
          {(["any", "same", "specific"] as MbtiPreferenceMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className="chip"
              aria-pressed={rules.mbti.mode === mode}
              onClick={() => onChange({ ...rules, mbti: { ...rules.mbti, mode } })}
            >
              {mode === "any" ? (locale === "en" ? "No MBTI rule" : "Tanpa aturan MBTI") : mode === "same" ? (locale === "en" ? "Same as me" : "Sama seperti saya") : locale === "en" ? "Pick types" : "Pilih tipe"}
            </button>
          ))}
        </div>
        {rules.mbti.mode === "specific" && (
          <div className="chips">
            {MBTI_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className="chip"
                aria-pressed={rules.mbti.types.includes(type)}
                onClick={() =>
                  onChange({
                    ...rules,
                    mbti: {
                      ...rules.mbti,
                      types: rules.mbti.types.includes(type) ? rules.mbti.types.filter((item) => item !== type) : [...rules.mbti.types, type],
                    },
                  })
                }
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rulefield">
        <div className="rulefield__head">
          <span className="rulefield__label">{t(locale, "field.radius")}</span>
          <button
            type="button"
            className="toggle"
            aria-pressed={rules.radius.hardFilter}
            onClick={() => onChange({ ...rules, radius: { ...rules.radius, hardFilter: !rules.radius.hardFilter } })}
          >
            {rules.radius.hardFilter ? t(locale, "radius.hardFilter") : t(locale, "create.plus")}
          </button>
        </div>
        <div className="chips">
          {(["own_area", "km5", "km10", "km25", "jabodetabek"] as RadiusOption[]).map((value) => (
            <button
              key={value}
              type="button"
              className="chip"
              aria-pressed={rules.radius.value === value}
              onClick={() => onChange({ ...rules, radius: { ...rules.radius, value } })}
            >
              {t(locale, `radius.${value}`)}
            </button>
          ))}
        </div>
        <span className="tiny muted">
          {locale === "en" ? "Distance is measured between area centres and shown as a band." : "Jarak dihitung antar titik tengah area dan tampil sebagai pita."}
        </span>
      </div>

      <span className={limitReached ? "tiny muted" : "tiny"}>{limitReached ? t(locale, "create.limitReached") : t(locale, "create.requiredLimit")}</span>
    </section>
  );
}

export function FieldShell({ label, help, children, htmlFor }: { label: string; help?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {help && <span className="field__help">{help}</span>}
    </div>
  );
}

export function Select({ id, value, onChange, children, label }: { id: string; value: string; onChange: (value: string) => void; children: React.ReactNode; label: string }) {
  return (
    <div className="selectwrap">
      <select id={id} className="select" value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>
        {children}
      </select>
      <ChevronDown size={18} aria-hidden="true" />
    </div>
  );
}

export function CategoryChips({ value, onChange, locale }: { value: Category; onChange: (value: Category) => void; locale: Locale }) {
  return (
    <div className="chips">
      {CATEGORIES.map((category) => (
        <button key={category} type="button" className="chip" aria-pressed={value === category} onClick={() => onChange(category)}>
          {t(locale, `category.${category}`)}
        </button>
      ))}
    </div>
  );
}

export { CATEGORY_INTEREST };
