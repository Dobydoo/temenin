import type { Photo } from "../types";

// Demo photos: free to use via picsum.photos (Unsplash-licensed). Committed so the demo works offline.
export const PHOTOS: Photo[] = [
  { id: "ph-gig", label: "Starry night", src: "/photos/gig.jpg", gradient: "linear-gradient(135deg,#2c3e68,#566a9c)", moods: ["hype", "blue"] },
  { id: "ph-coffee", label: "Slow coffee", src: "/photos/coffee.jpg", gradient: "linear-gradient(135deg,#f6e3b6,#ff95a5)", moods: ["cozy", "chill"] },
  { id: "ph-rain", label: "Overcast afternoon", src: "/photos/rain.jpg", gradient: "linear-gradient(135deg,#425b9a,#76c0ec)", moods: ["blue", "chill"] },
  { id: "ph-run", label: "Morning run", src: "/photos/run.jpg", gradient: "linear-gradient(135deg,#2e6b4f,#76c0ec)", moods: ["hype", "focus"] },
  { id: "ph-study", label: "Study desk", src: "/photos/study.jpg", gradient: "linear-gradient(135deg,#566a9c,#fff6dc)", moods: ["focus", "chill"] },
  { id: "ph-date", label: "Dusk by the lake", src: "/photos/date.jpg", gradient: "linear-gradient(135deg,#ff95a5,#fbeecb)", moods: ["romantic", "cozy"] },
  { id: "ph-city", label: "City towers", src: "/photos/city.jpg", gradient: "linear-gradient(135deg,#2c3e68,#566a9c)", moods: ["blue", "hype"] },
  { id: "ph-picnic", label: "Autumn park", src: "/photos/picnic.jpg", gradient: "linear-gradient(135deg,#2e6b4f,#fbeecb)", moods: ["cozy", "hype"] },
];

export const PHOTO_BY_ID = new Map(PHOTOS.map((photo) => [photo.id, photo]));
