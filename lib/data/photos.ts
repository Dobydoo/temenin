import type { Photo } from "../types";

export const PHOTOS: Photo[] = [
  { id: "ph-gig", label: "Night gig", gradient: "linear-gradient(135deg,#2c3e68,#ff95a5)", moods: ["hype", "romantic"] },
  { id: "ph-coffee", label: "Slow coffee", gradient: "linear-gradient(135deg,#f6e3b6,#ff95a5)", moods: ["cozy", "chill"] },
  { id: "ph-rain", label: "Rainy window", gradient: "linear-gradient(135deg,#425b9a,#76c0ec)", moods: ["blue", "chill"] },
  { id: "ph-run", label: "Morning run", gradient: "linear-gradient(135deg,#2e6b4f,#76c0ec)", moods: ["hype", "focus"] },
  { id: "ph-study", label: "Study desk", gradient: "linear-gradient(135deg,#566a9c,#fff6dc)", moods: ["focus", "chill"] },
  { id: "ph-date", label: "Golden hour", gradient: "linear-gradient(135deg,#ff95a5,#fbeecb)", moods: ["romantic", "cozy"] },
  { id: "ph-city", label: "City lights", gradient: "linear-gradient(135deg,#2c3e68,#566a9c)", moods: ["blue", "hype"] },
  { id: "ph-picnic", label: "Park picnic", gradient: "linear-gradient(135deg,#2e6b4f,#fbeecb)", moods: ["cozy", "hype"] },
];

export const PHOTO_BY_ID = new Map(PHOTOS.map((photo) => [photo.id, photo]));
