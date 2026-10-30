import type { Spot } from "../types";

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
