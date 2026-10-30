"use client";

import { useMemo, useState } from "react";
import { Music2 } from "lucide-react";
import { PHOTOS, PHOTO_BY_ID } from "@/lib/data/photos";
import { SONGS } from "@/lib/data/songs";
import { t } from "@/lib/i18n";
import { suggestSongs } from "@/lib/social";
import { useStore } from "@/lib/store";
import type { Locale, PostVisibility } from "@/lib/types";

type Props = {
  locale: Locale;
  activityId: string | null;
  areaId: string;
  allowVisibility: boolean;
  titleKey: string;
  bodyKey: string;
  onPosted?: () => void;
};

export function Composer({ locale, activityId, areaId, allowVisibility, titleKey, bodyKey, onPosted }: Props) {
  const { update, viewer } = useStore();
  const [body, setBody] = useState("");
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [songId, setSongId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [done, setDone] = useState(false);

  const photo = photoId ? (PHOTO_BY_ID.get(photoId) ?? null) : null;
  const suggested = useMemo(() => suggestSongs(photo, SONGS), [photo]);

  const publish = () => {
    const text = body.trim();
    if (!text) return;
    update((store) => ({
      posts: [
        {
          id: `p-${Date.now().toString(36)}`,
          authorId: viewer.id,
          activityId,
          kind: activityId ? "recap" : "moment",
          body: text,
          photoId,
          songId,
          visibility: allowVisibility ? visibility : "public",
          areaId,
          createdAt: new Date().toISOString(),
        },
        ...store.posts,
      ],
    }));
    setBody("");
    setPhotoId(null);
    setSongId(null);
    setDone(true);
    onPosted?.();
  };

  if (done) return <p className="note">{t(locale, "recap.posted")}</p>;

  return (
    <div className="stack">
      <h3>{t(locale, titleKey)}</h3>
      <div className="field">
        <label className="field__label" htmlFor={`composer-${activityId ?? "moment"}`}>{t(locale, bodyKey)}</label>
        <textarea
          id={`composer-${activityId ?? "moment"}`}
          className="input"
          rows={3}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </div>
      <div className="field">
        <span className="field__label">{t(locale, "composer.pickPhoto")}</span>
        <div className="chips">
          {PHOTOS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="chip"
              aria-pressed={photoId === item.id}
              onClick={() => setPhotoId(photoId === item.id ? null : item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span className="field__label">
          {photo ? t(locale, "composer.suggested") : t(locale, "composer.song")}
        </span>
        <div className="chips">
          {(photo ? suggested.slice(0, 4) : SONGS).map((song) => (
            <button
              key={song.id}
              type="button"
              className="chip"
              aria-pressed={songId === song.id}
              onClick={() => setSongId(songId === song.id ? null : song.id)}
            >
              <Music2 size={14} aria-hidden="true" /> {song.title} · {song.artist}
            </button>
          ))}
        </div>
      </div>
      {allowVisibility && (
        <div className="field">
          <span className="field__label">{t(locale, "recap.visibility")}</span>
          <div className="chips">
            <button type="button" className="chip" aria-pressed={visibility === "public"} onClick={() => setVisibility("public")}>
              {t(locale, "recap.public")}
            </button>
            <button type="button" className="chip" aria-pressed={visibility === "members"} onClick={() => setVisibility("members")}>
              {t(locale, "recap.members")}
            </button>
          </div>
        </div>
      )}
      <div>
        <button type="button" className="btn btn--sm" disabled={!body.trim()} onClick={publish}>
          {t(locale, "recap.publish")}
        </button>
      </div>
    </div>
  );
}
