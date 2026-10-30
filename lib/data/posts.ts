import type { AuthorReview, Post } from "../types";

const at = (day: number, hour: number) => `2026-10-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00+07:00`;

export const SEED_POSTS: Post[] = [
  { id: "p-arif-gig", authorId: "u-arif", activityId: null, kind: "moment", body: "Endingnya masih diperdebatkan sampai parkiran. 10/10 would argue again.", photoId: "ph-gig", songId: "s-feast", visibility: "public", areaId: "tebet", createdAt: at(30, 21) },
  { id: "p-sekar-coffee", authorId: "u-sekar", activityId: "a-sekar-coffee", kind: "recap", body: "Ngopi sore bareng Rani, bahas drakor sampai lupa waktu. Makasih udah gas!", photoId: "ph-coffee", songId: "s-tulus", visibility: "public", areaId: "tebet", createdAt: at(29, 17) },
  { id: "p-rani-recap", authorId: "u-rani", activityId: "a-sekar-coffee", kind: "recap", body: "First plan done! Sekar tahu semua kafe hidden gem di Tebet.", photoId: null, songId: "s-maliq", visibility: "members", areaId: "tebet", createdAt: at(29, 20) },
  { id: "p-bagas-run", authorId: "u-bagas", activityId: null, kind: "moment", body: "Lari pagi Minggu, ada yang mau bareng minggu depan?", photoId: "ph-run", songId: null, visibility: "public", areaId: "menteng", createdAt: at(28, 8) },
  { id: "p-lia-study", authorId: "u-lia", activityId: "a-lia-study", kind: "recap", body: "Study session pakai timer beneran works. Putri the MVP.", photoId: "ph-study", songId: "s-kunto", visibility: "public", areaId: "beji", createdAt: at(27, 19) },
  { id: "p-putri-recap", authorId: "u-putri", activityId: "a-lia-study", kind: "recap", body: "Dua jam fokus, satu jam curhat. Balance.", photoId: null, songId: null, visibility: "members", areaId: "beji", createdAt: at(27, 21) },
  { id: "p-hanif-gig2", authorId: "u-hanif", activityId: null, kind: "moment", body: "Gig semalam selesai sebelum kereta terakhir. Rare W.", photoId: "ph-city", songId: "s-barasuara", visibility: "public", areaId: "kemanggisan", createdAt: at(26, 23) },
  { id: "p-tari-sketch", authorId: "u-tari", activityId: null, kind: "moment", body: "Sketsa + kopi + hening. Perfect afternoon.", photoId: "ph-coffee", songId: "s-yura", visibility: "public", areaId: "kemang", createdAt: at(26, 16) },
  { id: "p-eko-badminton", authorId: "u-eko", activityId: null, kind: "moment", body: "Badminton malam ini kurang satu orang lagi. Siapa gas?", photoId: null, songId: null, visibility: "public", areaId: "grogol", createdAt: at(25, 18) },
  { id: "p-maya-film", authorId: "u-maya", activityId: null, kind: "moment", body: "Nonton bareng minggu lalu seru — next: film horor, yang berani aja.", photoId: "ph-gig", songId: "s-ran", visibility: "public", areaId: "kelapa-gading", createdAt: at(24, 20) },
  { id: "p-dim-food", authorId: "u-dim", activityId: null, kind: "moment", body: "Nemu warung baru di Sunter, soto-nya juara.", photoId: "ph-picnic", songId: null, visibility: "public", areaId: "sunter", createdAt: at(23, 13) },
  { id: "p-nisa-warung", authorId: "u-nisa", activityId: null, kind: "moment", body: "Kulineran sore, dompet aman di bawah 50k.", photoId: "ph-picnic", songId: "s-maliq", visibility: "public", areaId: "jatinegara", createdAt: at(22, 17) },
  { id: "p-arya-commute", authorId: "u-arya", activityId: null, kind: "moment", body: "Rencana dekat stasiun = anti telat. Noted.", photoId: null, songId: null, visibility: "public", areaId: "cakung", createdAt: at(21, 9) },
  { id: "p-sari-night", authorId: "u-sari", activityId: null, kind: "moment", body: "City lights + hujan rintik. Melankolis dikit.", photoId: "ph-rain", songId: "s-hindia", visibility: "public", areaId: "bintaro", createdAt: at(20, 22) },
  { id: "p-yoga-recap", authorId: "u-yoga", activityId: null, kind: "moment", body: "Tiga rekomendasi film sudah terkirim. Menunggu balasan.", photoId: null, songId: "s-raisa", visibility: "public", areaId: "margonda", createdAt: at(19, 20) },
];

export const SEED_AUTHOR_REVIEWS: AuthorReview[] = [
  { id: "ar-1", activityId: "a-sekar-coffee", reviewerId: "u-rani", authorId: "u-sekar", rating: 5, tags: ["on-time", "fun"], comment: "Sekar datang duluan dan udah pesenin tempat!", createdAt: at(29, 21) },
  { id: "ar-2", activityId: "a-lia-study", reviewerId: "u-putri", authorId: "u-lia", rating: 5, tags: ["focused", "kind"], comment: "Timer-nya works, snack-nya works.", createdAt: at(27, 22) },
  { id: "ar-3", activityId: "a-lia-study", reviewerId: "u-lia", authorId: "u-putri", rating: 4, tags: ["fun"], comment: "Putri seru, next bawa lebih banyak jajanan.", createdAt: at(27, 22) },
];
