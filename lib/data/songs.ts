import type { Song } from "../types";

export const SONGS: Song[] = [
  { id: "s-hindia", title: "Evaluasi", artist: "Hindia", moods: ["blue", "chill"] },
  { id: "s-tulus", title: "Hati-Hati di Jalan", artist: "Tulus", moods: ["cozy", "romantic"] },
  { id: "s-raisa", title: "Kali Kedua", artist: "Raisa", moods: ["romantic", "chill"] },
  { id: "s-feast", title: "Tarot", artist: ".Feast", moods: ["hype", "focus"] },
  { id: "s-hivi", title: "Siapkah Kau Tuk Jatuh Cinta Lagi", artist: "HIVI!", moods: ["romantic", "hype"] },
  { id: "s-pamungkas", title: "To the Bone", artist: "Pamungkas", moods: ["blue", "romantic"] },
  { id: "s-kunto", title: "Sulung", artist: "Kunto Aji", moods: ["chill", "focus"] },
  { id: "s-ran", title: "Pandangan Pertama", artist: "RAN", moods: ["hype", "romantic"] },
  { id: "s-noah", title: "Separuh Aku", artist: "NOAH", moods: ["blue", "chill"] },
  { id: "s-yura", title: "Dunia Tipu-Tipu", artist: "Yura Yunita", moods: ["cozy", "blue"] },
  { id: "s-barasuara", title: "Pikiran dan Perjalanan", artist: "Barasuara", moods: ["hype", "focus"] },
  { id: "s-maliq", title: "Pilihanku", artist: "Maliq & D'Essentials", moods: ["cozy", "chill"] },
];

export const SONG_BY_ID = new Map(SONGS.map((song) => [song.id, song]));
