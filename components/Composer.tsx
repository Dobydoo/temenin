"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Check, ImagePlus, Music2, X } from "lucide-react";
import { PHOTOS, PHOTO_BY_ID } from "@/lib/data/photos";
import { SONGS } from "@/lib/data/songs";
import { t, type I18nKey } from "@/lib/i18n";
import { suggestSongs } from "@/lib/social";
import { useSession } from "@/lib/store";
import type { Locale, PostVisibility } from "@/lib/types";

type Props = {
  locale: Locale;
  activityId: string | null;
  areaId: string;
  allowVisibility: boolean;
  titleKey: I18nKey;
  bodyKey: I18nKey;
  onPosted?: () => void;
};

export function Composer({ locale, activityId, areaId, allowVisibility, titleKey, bodyKey, onPosted }: Props) {
  const { update, viewer } = useSession();
  const [open, setOpen] = useState(activityId !== null);
  const [body, setBody] = useState("");
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [songId, setSongId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [done, setDone] = useState(false);

  const firstName = viewer.name.split(" ")[0] ?? viewer.name;
  const initials = viewer.name.split(" ").map((part) => part[0]).join("").slice(0, 2);
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

  const close = () => {
    setOpen(false);
    setDone(false);
  };

  if (!open) {
    return (
      <button type="button" className="fb__pill" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <span className="avatar avatar--sm" aria-hidden="true">{initials}</span>
        <span className="fb__prompt">
          {t(locale, titleKey)}, {firstName}…
        </span>
      </button>
    );
  }

  return (
    <div role="dialog" aria-label={t(locale, titleKey)} className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="row" style={{ gap: "var(--space-xs)" }}>
          <span className="avatar avatar--sm" aria-hidden="true">{initials}</span>
          <strong>{viewer.name}</strong>
        </span>
        <button type="button" className="usermenu__close" onClick={close} aria-label={t(locale, "action.cancel")}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {done ? (
        <p className="note">{t(locale, "recap.posted")}</p>
      ) : (
        <>
          <textarea
            className="input fb__text"
            rows={3}
            autoFocus
            placeholder={t(locale, bodyKey)}
            aria-label={t(locale, bodyKey)}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />

          {photo && (
            <div className="fb__preview">
              <Image src={photo.src} alt={photo.label} width={800} height={600} sizes="(max-width: 640px) 100vw, 560px" loading="lazy" />
              <button
                type="button"
                className="fb__remove"
                onClick={() => setPhotoId(null)}
                aria-label={`${t(locale, "action.cancel")}: ${photo.label}`}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          )}

          <div className="field">
            <span className="field__label">
              <ImagePlus size={14} aria-hidden="true" style={{ display: "inline" }} /> {t(locale, "composer.pickPhoto")}
            </span>
            <div className="fb__strip">
              {PHOTOS.map((item) => {
                const selected = photoId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`fb__thumb${selected ? " fb__thumb--on" : ""}`}
                    aria-pressed={selected}
                    aria-label={item.label}
                    title={item.label}
                    onClick={() => setPhotoId(selected ? null : item.id)}
                  >
                    <Image src={item.src} alt="" width={144} height={108} sizes="72px" loading="lazy" />
                    {selected && (
                      <span className="fb__check" aria-hidden="true">
                        <Check size={12} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="tiny muted">{t(locale, "composer.credit")}</p>
          </div>

          <div className="field">
            <span className="field__label">
              <Music2 size={14} aria-hidden="true" style={{ display: "inline" }} />{" "}
              {photo ? t(locale, "composer.suggested") : t(locale, "composer.song")}
            </span>
            <div className="fb__strip">
              {(photo ? suggested.slice(0, 4) : SONGS.slice(0, 6)).map((song) => (
                <button
                  key={song.id}
                  type="button"
                  className="chip"
                  aria-pressed={songId === song.id}
                  onClick={() => setSongId(songId === song.id ? null : song.id)}
                >
                  {song.title} · {song.artist}
                </button>
              ))}
            </div>
          </div>

          {allowVisibility && (
            <div className="chips">
              <button type="button" className="chip" aria-pressed={visibility === "public"} onClick={() => setVisibility("public")}>
                {t(locale, "recap.public")}
              </button>
              <button type="button" className="chip" aria-pressed={visibility === "members"} onClick={() => setVisibility("members")}>
                {t(locale, "recap.members")}
              </button>
            </div>
          )}

          <div className="fb__foot">
            <span />
            <button type="button" className="btn" disabled={!body.trim()} onClick={publish}>
              {t(locale, "recap.publish")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
