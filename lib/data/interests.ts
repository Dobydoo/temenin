import type { Category, InterestId } from "../types";

export const INTERESTS: { id: InterestId; en: string; id_: string }[] = [
  { id: "film", en: "Film", id_: "Film" },
  { id: "coffee", en: "Coffee", id_: "Ngopi" },
  { id: "study", en: "Study", id_: "Belajar" },
  { id: "sports", en: "Sports", id_: "Olahraga" },
  { id: "food", en: "Food", id_: "Kuliner" },
  { id: "music", en: "Music", id_: "Musik" },
  { id: "books", en: "Books", id_: "Buku" },
  { id: "gaming", en: "Gaming", id_: "Gim" },
  { id: "art", en: "Art", id_: "Seni" },
  { id: "photography", en: "Photography", id_: "Fotografi" },
];

export const INTEREST_BY_ID = new Map(INTERESTS.map((item) => [item.id, item]));

export const CATEGORY_INTEREST: Record<Category, InterestId> = {
  movie: "film",
  coffee: "coffee",
  study: "study",
  shopping: "art",
  sports: "sports",
  food: "food",
  music: "music",
  other: "coffee",
};

export const CATEGORIES: Category[] = [
  "movie",
  "coffee",
  "study",
  "food",
  "sports",
  "music",
  "shopping",
  "other",
];
