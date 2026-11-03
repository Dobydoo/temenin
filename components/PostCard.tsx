"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Heart, Lock, MapPin, MessageCircle, MoreHorizontal, Music2, Plus, Repeat2, Send, ShieldCheck, Users } from "lucide-react";
import { PHOTO_BY_ID } from "@/lib/data/photos";
import { SONG_BY_ID } from "@/lib/data/songs";
import { formatDate, timeAgo } from "@/lib/format";
import { AREA_BY_ID } from "@/lib/data/areas";
import { t } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { Activity, Locale, Post, User } from "@/lib/types";

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
  const planRemoved = activity ? (state.removed[activity.id] ?? []) : [];
  const planJoined = activity ? (state.approved[activity.id] ?? []).filter((rid) => !planRemoved.includes(rid)).length : 0;
  const planSpots = activity ? Math.max(activity.partySize - 1, 1) : 1;
  const planGroup = activity ? Boolean(activity.openGroup) || activity.rules.mode.value !== "one_on_one" || activity.partySize > 2 : false;

  const toggleFollow = () =>
    update({
      following: following
        ? state.following.filter((id) => id !== post.authorId)
        : [...state.following, post.authorId],
    });

  return (
    <article className="thread">
      <div className="thread__head">
        <span className="thread__avatar">
          <span className="avatar avatar--sm" aria-hidden="true">
            {author?.avatarInitials ?? "?"}
          </span>
          {!isOwn && author && !following && (
            <button
              type="button"
              className="thread__follow"
              aria-label={t(locale, "feed.follow")}
              aria-pressed={following}
              onClick={toggleFollow}
            >
              <Plus size={12} aria-hidden="true" />
            </button>
          )}
        </span>
        <span className="thread__who">
          <strong className="thread__name">{author?.name ?? (locale === "en" ? "Unknown buddy" : "Temen tak dikenal")}</strong>
          {author && author.verification === "verified" && (
            <ShieldCheck
              size={14}
              className="thread__check"
              aria-label={locale === "en" ? "Verified" : "Terverifikasi"}
              role="img"
            />
          )}
        </span>
        <span className="thread__topright">
          <span className="muted thread__time">
            {timeAgo(post.createdAt, locale)}
            {post.visibility === "members" && (
              <span title={t(locale, "feed.membersOnly")}>
                {" "}<Lock size={12} aria-hidden="true" />
              </span>
            )}
          </span>
          <button type="button" className="thread__more" aria-label="···">
            <MoreHorizontal size={18} aria-hidden="true" />
          </button>
        </span>
      </div>
      <div className="thread__main">

        <p className="thread__body">{post.body}</p>

        {photo && (
          <Image
            className="thread__photo"
            src={photo.src}
            alt={photo.label}
            width={800}
            height={600}
            sizes="(max-width: 560px) 100vw, 480px"
            loading="lazy"
            style={{ background: photo.gradient }}
          />
        )}

        {song && (
          <p className="thread__song">
            <Music2 size={14} aria-hidden="true" />
            <span><strong>{song.title}</strong> · {song.artist}</span>
          </p>
        )}

        <div className="thread__actions">
          <span className="thread__icons">
            <button type="button" className="thread__icon" aria-label={locale === "en" ? "Like" : "Suka"}>
              <Heart size={18} aria-hidden="true" />
            </button>
            <button type="button" className="thread__icon" aria-label={locale === "en" ? "Comment" : "Komentar"}>
              <MessageCircle size={18} aria-hidden="true" />
            </button>
            <button type="button" className="thread__icon" aria-label={locale === "en" ? "Repost" : "Repost"}>
              <Repeat2 size={18} aria-hidden="true" />
            </button>
            <button type="button" className="thread__icon" aria-label={locale === "en" ? "Share" : "Bagikan"}>
              <Send size={18} aria-hidden="true" />
            </button>
          </span>
          {activity && (
            <Link
              className="thread__planbox"
              href={`/match/${activity.id}`}
              aria-label={`${t(locale, "feed.aboutPlan")}: ${activity.description.slice(0, 60)}`}
            >
              <span className="thread__planbox-text">
                <MapPin size={14} aria-hidden="true" />
                <span>{AREA_BY_ID.get(activity.areaId)?.name ?? activity.venueName ?? activity.category}</span>
                <span aria-hidden="true">·</span>
                <CalendarDays size={14} aria-hidden="true" />
                <span>{formatDate(activity.startsAt, locale)}</span>
                <span aria-hidden="true">·</span>
                <Users size={14} aria-hidden="true" />
                <span>{planGroup ? (activity?.openGroup ? `${planJoined} · ${t(locale, "plan.open")}` : `${planJoined}/${planSpots}`) : t(locale, "match.needOne")}</span>
              </span>
              <span className="thread__planbox-cta">{t(locale, "feed.aboutPlan")}</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
