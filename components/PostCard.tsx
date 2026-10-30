"use client";

import Link from "next/link";
import { Lock, Music2 } from "lucide-react";
import { AREA_BY_ID } from "@/lib/data/areas";
import { PHOTO_BY_ID } from "@/lib/data/photos";
import { SONG_BY_ID } from "@/lib/data/songs";
import { timeAgo } from "@/lib/format";
import { t } from "@/lib/i18n";
import { authorAggregate } from "@/lib/social";
import { useStore } from "@/lib/store";
import type { Activity, Locale, Post, User } from "@/lib/types";
import { VerifiedBadge } from "@/components/ui";

type Props = {
  post: Post;
  author: User | null;
  activity: Activity | null;
  locale: Locale;
};

export function PostCard({ post, author, activity, locale }: Props) {
  const { state, update, viewer } = useStore();
  const isOwn = post.authorId === viewer.id;
  const following = state.following.includes(post.authorId);
  const photo = post.photoId ? (PHOTO_BY_ID.get(post.photoId) ?? null) : null;
  const song = post.songId ? (SONG_BY_ID.get(post.songId) ?? null) : null;
  const area = AREA_BY_ID.get(post.areaId);
  const aggregate = authorAggregate(state.authorReviews, post.authorId);

  const toggleFollow = () =>
    update({
      following: following
        ? state.following.filter((id) => id !== post.authorId)
        : [...state.following, post.authorId],
    });

  return (
    <article className="card plan">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="row" style={{ gap: "var(--space-xs)" }}>
          <span className="avatar avatar--sm" aria-hidden="true">
            {author?.avatarInitials ?? "?"}
          </span>
          <span>
            <strong>{author?.name ?? (locale === "en" ? "Unknown buddy" : "Temen tak dikenal")}</strong>{" "}
            {author && author.verification === "verified" && <VerifiedBadge user={author} locale={locale} />}
            <br />
            <span className="muted" style={{ fontSize: "var(--text-xs)" }}>
              {timeAgo(post.createdAt, locale)}
              {area ? ` · ${area.name}` : ""}
              {aggregate ? ` · ★ ${aggregate.average} (${aggregate.count})` : ""}
            </span>
          </span>
        </span>
        {!isOwn && author && (
          <button
            type="button"
            className="btn btn--quiet btn--sm"
            aria-pressed={following}
            onClick={toggleFollow}
          >
            {following ? t(locale, "feed.followingBtn") : t(locale, "feed.follow")}
          </button>
        )}
      </div>

      <p className="plan__desc" style={{ textAlign: "start" }}>{post.body}</p>

      {photo && (
        <div
          className="post__photo"
          style={{ background: photo.gradient }}
          role="img"
          aria-label={photo.label}
        >
          <span>{photo.label}</span>
        </div>
      )}

      {song && (
        <p className="note" style={{ marginBlockStart: "var(--space-sm)" }}>
          <Music2 size={16} aria-hidden="true" />
          <span><strong>{song.title}</strong> · {song.artist}</span>
        </p>
      )}

      <div className="plan__foot">
        {post.visibility === "members" && (
          <span className="tag">
            <Lock size={12} aria-hidden="true" /> {t(locale, "feed.membersOnly")}
          </span>
        )}
        {activity && (
          <Link className="btn btn--quiet btn--sm" href={`/match/${activity.id}`}>
            {t(locale, "feed.aboutPlan")}
          </Link>
        )}
      </div>
    </article>
  );
}
