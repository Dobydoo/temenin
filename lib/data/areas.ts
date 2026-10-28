import type { Area } from "../types";

export const AREAS: Area[] = [
  { id: "tebet", name: "Tebet", city: "Jakarta Selatan", zone: "jaksel", center: { lat: -6.2266, lng: 106.8582 } },
  { id: "kemang", name: "Kemang", city: "Jakarta Selatan", zone: "jaksel", center: { lat: -6.2607, lng: 106.8138 } },
  { id: "pasar-minggu", name: "Pasar Minggu", city: "Jakarta Selatan", zone: "jaksel", center: { lat: -6.2843, lng: 106.8449 } },
  { id: "menteng", name: "Menteng", city: "Jakarta Pusat", zone: "jakpus", center: { lat: -6.1954, lng: 106.8322 } },
  { id: "kemanggisan", name: "Kemanggisan", city: "Jakarta Barat", zone: "jakbar", center: { lat: -6.1906, lng: 106.7892 } },
  { id: "grogol", name: "Grogol", city: "Jakarta Barat", zone: "jakbar", center: { lat: -6.1672, lng: 106.7886 } },
  { id: "kelapa-gading", name: "Kelapa Gading", city: "Jakarta Utara", zone: "jakut", center: { lat: -6.1606, lng: 106.9055 } },
  { id: "sunter", name: "Sunter", city: "Jakarta Utara", zone: "jakut", center: { lat: -6.1389, lng: 106.8888 } },
  { id: "jatinegara", name: "Jatinegara", city: "Jakarta Timur", zone: "jaktim", center: { lat: -6.2251, lng: 106.8703 } },
  { id: "cakung", name: "Cakung", city: "Jakarta Timur", zone: "jaktim", center: { lat: -6.1807, lng: 106.9445 } },
  { id: "beji", name: "Beji", city: "Depok", zone: "depok", center: { lat: -6.3766, lng: 106.8266 } },
  { id: "margonda", name: "Margonda", city: "Depok", zone: "depok", center: { lat: -6.3725, lng: 106.8306 } },
  { id: "bintaro", name: "Bintaro", city: "Tangerang Selatan", zone: "tangerang", center: { lat: -6.2761, lng: 106.7202 } },
  { id: "ciputat", name: "Ciputat", city: "Tangerang Selatan", zone: "tangerang", center: { lat: -6.3112, lng: 106.7463 } },
  { id: "bekasi-barat", name: "Bekasi Barat", city: "Bekasi", zone: "bekasi", center: { lat: -6.2416, lng: 106.9895 } },
  { id: "bekasi-timur", name: "Bekasi Timur", city: "Bekasi", zone: "bekasi", center: { lat: -6.2383, lng: 107.0042 } },
];

export const AREA_BY_ID = new Map(AREAS.map((area) => [area.id, area]));

export const CORE_ZONES = ["jaksel", "jakpus", "jakbar"] as const;
