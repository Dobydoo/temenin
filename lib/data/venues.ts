import type { Venue } from "../types";

const venue = (
  id: string,
  name: string,
  areaId: string,
  category: Venue["category"],
  budgetBand: Venue["budgetBand"],
  en: string,
  idNote: string,
): Venue => ({ id, name, areaId, category, budgetBand, note: { en, id: idNote } });

export const VENUES: Venue[] = [
  venue("v-tebet-cinema", "Cinema 21 Tebet", "tebet", "movie", "mid", "Screenings until late, a taxi rank at the door.", "Nonton sampai malam, taksi ada di depan."),
  venue("v-tebet-kopi", "Kopi Tuku Tebet", "tebet", "coffee", "low", "Corner tables by the window, busy but not loud.", "Meja pojok dekat jendela, ramai tapi nggak berisik."),
  venue("v-tebet-food", "Warung Tekko Tebet", "tebet", "food", "low", "Family warung with long tables for groups.", "Warung keluarga, meja panjang buat rame-rame."),
  venue("v-tebet-books", "Perpustakaan Tebet", "tebet", "study", "low", "Reading room on the second floor, quiet after six.", "Ruang baca di lantai dua, sepi setelah jam enam."),
  venue("v-kemang-cafe", "Anomali Kemang", "kemang", "coffee", "mid", "Garden seating, single-origin brews.", "Duduk di taman, kopi single origin."),
  venue("v-kemang-film", "Menteng XXI", "menteng", "movie", "mid", "Spacious seats, lobby wide enough to talk.", "Kursinya lega, lobinya luas buat ngobrol."),
  venue("v-menteng-park", "Taman Situ Lembang", "menteng", "sports", "low", "Track around the pond, busy on weekend mornings.", "Lintasan di sekitar danau, ramai Minggu pagi."),
  venue("v-menteng-museum", "Museum Nasional", "menteng", "other", "low", "Cool halls, cheap tickets, open until four.", "Ruangannya sejuk, tiket murah, buka sampai jam empat."),
  venue("v-pasar-minggu-pool", "Kolam Renang Pasar Minggu", "pasar-minggu", "sports", "low", "Olympic pool with a sitting deck.", "Kolam olimpiade dengan tribun duduk."),
  venue("v-kemanggisan-study", "Perpustakaan Bina Nusantara", "kemanggisan", "study", "low", "Group rooms bookable by the hour.", "Ruang grup bisa dipesan per jam."),
  venue("v-grogol-cafe", "Kopi Kelana Grogol", "grogol", "coffee", "low", "Open late, plug points at every table.", "Buka sampai malam, tiap meja ada colokan."),
  venue("v-kelapa-gading-mall", "Mall Kelapa Gading", "kelapa-gading", "shopping", "mid", "Indoor, easy to meet at the main atrium.", "Di dalam ruangan, enak ketemu di atrium utama."),
  venue("v-sunter-futsal", "Futsal Sunter Jaya", "sunter", "sports", "mid", "Two courts, showers, night bookings.", "Dua lapangan, ada shower, bisa malam."),
  venue("v-jatinegara-food", "Pasar Jatinegara Food Court", "jatinegara", "food", "low", "Busy, bright, easy to leave in a hurry.", "Ramai, terang, gampang kalau mau cepat pulang."),
  venue("v-cakung-cafe", "Kopi Cakung Bersama", "cakung", "coffee", "low", "Wide tables for study groups.", "Meja lebar buat belajar kelompok."),
  venue("v-beji-study", "Perpustakaan UI Depok", "beji", "study", "low", "Big reading hall, ten minutes from the station.", "Aula baca luas, sepuluh menit dari stasiun."),
  venue("v-margonda-film", "Cinema Margo City", "margonda", "movie", "mid", "Inside the mall, close to the Depok busway.", "Di dalam mal, dekat busway Depok."),
  venue("v-bintaro-music", "Bintaro Music Room", "bintaro", "music", "mid", "Small acoustic room, weekend sets.", "Ruang akustik kecil, ada set akhir pekan."),
  venue("v-ciputat-food", "Sate Ciputat", "ciputat", "food", "low", "Roadside, familar, cash only.", "Pinggir jalan, akrab, hanya tunai."),
  venue("v-bekasi-sports", "GOR Bekasi Barat", "bekasi-barat", "sports", "low", "Badminton courts until ten.", "Lapangan badminton sampai jam sepuluh."),
  venue("v-bekasi-mall", "Summarecon Mall Bekasi", "bekasi-timur", "shopping", "mid", "Main hall meeting point by the info desk.", "Titik temu di aula utama dekat meja info."),
];
