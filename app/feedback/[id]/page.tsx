"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Check, Star } from "lucide-react";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { PERSONAS } from "@/lib/data/users";

const TAGS = [
  { en: "On time", id: "Tepat waktu" },
  { en: "Easy to talk to", id: "Enak diajak ngobrol" },
  { en: "Kept the plan", id: "Rencananya jalan" },
  { en: "Made me feel safe", id: "Bikin nyaman" },
];

export default function FeedbackPage() {
  const { id } = useParams<{ id: string }>();
  const { state, update, viewer } = useStore();
  const locale = state.locale;
  const matchId = decodeURIComponent(id);
  const [, candidateId] = matchId.split(":");
  const candidate = PERSONAS.find((person) => person.id === candidateId);
  const [rating, setRating] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [noShow, setNoShow] = useState(false);
  const [sent, setSent] = useState(false);
  const existing = state.reviews.find((review) => review.meetupId === `mu-${matchId}`);

  const submit = () => {
    update((store) => ({
      reviews: [
        ...store.reviews.filter((review) => review.meetupId !== `mu-${matchId}`),
        {
          id: `rev-${Date.now()}`,
          meetupId: `mu-${matchId}`,
          reviewerId: viewer.id,
          revieweeId: candidateId ?? "",
          rating,
          tags,
          comment: comment.trim(),
          reportedNoShow: noShow,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    setSent(true);
  };

  return (
    <>
      <div className="pagehead">
        <div className="pagehead__text">
          <Link className="small" href={`/messages/${matchId}`}>
            {t(locale, "action.back")}
          </Link>
          <h1>{t(locale, "feedback.title")}</h1>
          <p className="lead">
            {locale === "en"
              ? `Your feedback moves ${candidate?.name ?? "the buddy"}'s trust score and reliability.`
              : `Penilaianmu mengubah skor kepercayaan dan keandalan ${candidate?.name ?? "temenmu"}.`}
          </p>
        </div>
      </div>

      <section className="card stack" style={{ maxWidth: "640px" }}>
        <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="field__label">{t(locale, "feedback.rating")}</legend>
          <div className="chips" role="radiogroup" aria-label={t(locale, "feedback.rating")}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} type="button" className="chip" role="radio" aria-checked={rating === value} onClick={() => setRating(value)}>
                <Star size={16} aria-hidden="true" />
                {value}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="field__label">{t(locale, "feedback.tags")}</legend>
          <div className="chips">
            {TAGS.map((tag) => (
              <button
                key={tag.en}
                type="button"
                className="chip"
                aria-pressed={tags.includes(tag.en)}
                onClick={() => setTags((current) => (current.includes(tag.en) ? current.filter((item) => item !== tag.en) : [...current, tag.en]))}
              >
                {tag[locale]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label className="field__label" htmlFor="comment">
            {t(locale, "feedback.comment")}
          </label>
          <textarea id="comment" className="textarea" value={comment} onChange={(event) => setComment(event.target.value)} rows={3} />
          <span className="field__help">{locale === "en" ? "Short and specific helps the next person." : "Singkat dan spesifik membantu orang berikutnya."}</span>
        </div>

        <label className="check">
          <input type="checkbox" checked={noShow} onChange={(event) => setNoShow(event.target.checked)} />
          <span>{t(locale, "feedback.reportedNoShow")}</span>
        </label>

        {existing && !sent ? (
          <p className="note">
            <Check size={18} aria-hidden="true" />
            {t(locale, "feedback.sent")}
          </p>
        ) : null}

        <button type="button" className="btn" onClick={submit} disabled={sent}>
          {sent ? t(locale, "feedback.sent") : t(locale, "feedback.send")}
        </button>
        {sent && (
          <Link className="btn btn--quiet" href="/">
            {t(locale, "nav.home")}
          </Link>
        )}
      </section>
    </>
  );
}
