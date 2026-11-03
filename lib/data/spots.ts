import type { Category, Spot } from "../types";

export const SPOTS: Spot[] = [
  { id: "jakarta", name: "Jakarta", region: "DKI Jakarta", country: "Indonesia", lat: -6.2, lng: 106.85 },
  { id: "bandung", name: "Bandung", region: "Jawa Barat", country: "Indonesia", lat: -6.9, lng: 107.6 },
  { id: "surabaya", name: "Surabaya", region: "Jawa Timur", country: "Indonesia", lat: -7.25, lng: 112.75 },
  { id: "denpasar", name: "Denpasar", region: "Bali", country: "Indonesia", lat: -8.65, lng: 115.22 },
  { id: "medan", name: "Medan", region: "Sumatera Utara", country: "Indonesia", lat: 3.59, lng: 98.67 },
  { id: "makassar", name: "Makassar", region: "Sulawesi Selatan", country: "Indonesia", lat: -5.15, lng: 119.42 },
  { id: "singapore", name: "Singapore", region: "Singapore", country: "Singapore", lat: 1.35, lng: 103.82 },
  { id: "kl", name: "Kuala Lumpur", region: "Wilayah Persekutuan", country: "Malaysia", lat: 3.14, lng: 101.69 },
];

export const SPOT_BY_ID = new Map(SPOTS.map((spot) => [spot.id, spot]));

export type SpotTrend = {
  spotId: string;
  joins7d: number;
  category: Category;
  text: { en: string; id: string };
};

export const SPOT_TRENDS: SpotTrend[] = [
  { spotId: "bandung", joins7d: 34, category: "coffee", text: { en: "Ngopi sore is peaking in Dago", id: "Ngopi sore lagi rame di Dago" } },
  { spotId: "surabaya", joins7d: 27, category: "food", text: { en: "Late-night kuliner runs in Tunjungan", id: "Kuliner malam di Tunjungan" } },
  { spotId: "denpasar", joins7d: 41, category: "sports", text: { en: "Sunrise surf (+ coffee after) in Canggu", id: "Surfing sunrise (+ ngopi) di Canggu" } },
  { spotId: "medan", joins7d: 12, category: "food", text: { en: "Durian season meetups", id: "Kumpul musim durian" } },
  { spotId: "makassar", joins7d: 9, category: "coffee", text: { en: "Losari sunset hangs", id: "Nongkrong sunset Losari" } },
  { spotId: "singapore", joins7d: 22, category: "movie", text: { en: "Weekend cinema + hawker crawls", id: "Bioskop weekend + hawker" } },
  { spotId: "kl", joins7d: 15, category: "shopping", text: { en: "Bukit Bintang thrift walks", id: "Thrift walk Bukit Bintang" } },
];
