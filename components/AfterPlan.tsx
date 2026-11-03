"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { Activity, Locale } from "@/lib/types";
import { planEndsAt } from "@/lib/format";
import { Composer } from "@/components/Composer";

const TAGS = ["ontime", "fun", "kind", "focused"] as const;

export function AfterPlan({ activity, locale }: { activity: Activity; locale: Locale }) {
  const { state, update, viewer } = useStore();
  const [rating, setRating] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [now] = useState(() => Date.now());

  const finished = Number.isFinite(Date.parse(activity.startsAt)) && planEndsAt(activity.startsAt, activity.durationMin) < now;
  if (!finished) return null;
  const isAuthor = activity.creatorId === viewer.id;
  const involved = isAuthor || (state.approved[activity.id] ?? []).includes(viewer.id) || (state.joins[activity.id] ?? []).includes(viewer.id);
  if (!involved) return null;

  const already = state.authorReviews.some(
    (review) => review.activityId === activity.id && review.reviewerId === viewer.id,
  );

  const submitReview = () => {
    update((store) => ({
      authorReviews: [
        ...store.authorReviews,
        {
          id: `ar-${Date.now().toString(36)}`,
          activityId: activity.id,
          reviewerId: viewer.id,
          authorId: activity.creatorId,
          rating,
          tags,
          comment: comment.trim(),
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    setReviewed(true);
  };

  return (
    <section className="section section--tight">
      {!isAuthor && !already && !reviewed && (
        <div className="card stack">
          <h2>{t(locale, "review.title")}</h2>
          <div className="chips" role="radiogroup" aria-label={t(locale, "review.title")}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={rating === star}
                className="chip"
                onClick={() => setRating(star)}
              >
                {"★".repeat(star)}
              </button>
            ))}
          </div>
          <div className="chips">
            {TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className="chip"
                aria-pressed={tags.includes(tag)}
                onClick={() => setTags(tags.includes(tag) ? tags.filter((item) => item !== tag) : [...tags, tag])}
              >
                {t(locale, `review.tag.${tag}`)}
              </button>
            ))}
          </div>
          <div className="field">
            <label className="field__label" htmlFor={`review-${activity.id}`}>{t(locale, "review.comment")}</label>
            <input
              id={`review-${activity.id}`}
              className="input"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          </div>
          <div>
            <button type="button" className="btn btn--sm" onClick={submitReview}>
              {t(locale, "review.submit")}
            </button>
          </div>
        </div>
      )}
      {(already || reviewed) && !isAuthor && <p className="note">{t(locale, "review.done")}</p>}
      <div className="card stack">
        <Composer
          locale={locale}
          activityId={activity.id}
          areaId={activity.areaId}
          allowVisibility
          titleKey="recap.title"
          bodyKey="recap.body"
        />
      </div>
    </section>
  );
}
