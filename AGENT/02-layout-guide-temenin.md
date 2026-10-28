# Layout Guide Temenin
Panduan layout resmi untuk mockup dan build Temenin. Pasangan dokumen: Brand Identity Temenin (warna, font, filosofi) dan Rencana Pengembangan Temenin (fitur). Dibuat 27 Okt 2026 malam.

## 1. Breakpoint dan kontainer

Temenin adalah web responsif satu codebase:
- **Di bawah 1024 px (HP dan tablet): tampilan aplikasi mobile.** Bottom navigation, tombol aksi utama sticky, kartu membulat besar.
- **1024 px ke atas: tampilan web desktop.** Top navigation bar, konten grid, lebar terbatas.

Kontainer konten:
- HP: lebar konten maksimum 480 px, rata tengah, padding sisi 20 px.
- Tablet (768–1023 px): tetap gaya aplikasi, lebar maksimum 720 px, daftar aktivitas dan match memakai grid 2 kolom.
- Desktop: lebar maksimum 1200 px, rata tengah, padding sisi 40 px (minimum 24 px di jendela sempit).

Sistem jarak (spacing) memakai skala kelipatan 4: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Jarak antar seksi: 24–32 px di mobile, 48–64 px di desktop. Jangan memakai angka di luar skala ini.

## 2. Logo di layout

Unit ruang aman: **x = diameter lingkaran kepala pink** pada figur T. Jarak logo ke tepi dan ke elemen lain minimum 1x di semua sisi.

Ukuran logo per konteks:
- Top bar mobile: figur T tinggi 32 px berdampingan dengan wordmark setinggi sekitar 20 px, rata kiri, padding bar 16 px.
- Header desktop: lockup lengkap tinggi 40 px.
- Splash screen dan onboarding: figur T saja, 96 px di mobile, 120 px di desktop, di tengah.
- Footer desktop: lockup monokrom cream di atas navy, tinggi 36 px.
- Ukuran minimum: lockup lengkap lebar 120 px; figur T saja 32 px (di bawah itu senyum hilang).

Penempatan yang dilarang: logo biru muda di atas sky blue (menyatu), logo warna penuh di atas foto ramai, memutar atau meregangkan logo. Detail lengkap di dokumen brand identity.

## 3. Navigasi

### Mobile dan tablet (di bawah 1024 px)
Bottom navigation, tinggi 64 px + safe area bawah perangkat:
- 5 menu: Home, Explore, Create, Messages, Profile.
- Menu Create di tengah sebagai tombol menonjol: lingkaran atau pill 56 px, background navy, ikon plus cream.
- Ikon 24 px, label Plus Jakarta Sans Medium 11–12 px di bawah ikon.
- Status aktif: ikon dan label navy penuh plus titik pink kecil di atas ikon. Status tidak aktif: navy dengan opacity 50 persen.
- Di halaman detail chat, bottom navigation disembunyikan dan digantikan kolom pengetikan (composer) yang sticky di bawah.

### Desktop (1024 px ke atas)
Top navigation bar, tinggi 72 px, background cream, sticky, dengan garis bawah tipis navy opacity 10 persen:
- Kiri: logo lockup 40 px.
- Tengah atau kiri setelah logo: menu Home, Explore, How It Works, Safety. Plus Jakarta Sans SemiBold 15 px, item aktif diberi garis bawah pink 3 px.
- Kanan: pengalih bahasa EN | ID, lalu tombol pill "Create Activity" (navy, teks cream).
- Tidak memakai sidebar, supaya halaman terasa seperti produk konsumen, bukan dashboard.

## 4. Tipografi

Font teks: Plus Jakarta Sans. Pacifico hanya untuk wordmark, tagline, dan judul brand sesekali (splash, halaman kosong), tidak untuk teks fungsional.

Skala mobile:
- H1: 26 px Bold, line height 34
- H2: 20 px Bold, line height 28
- H3: 16 px SemiBold, line height 22
- Body: 15 px Regular, line height 24
- Body kecil: 13 px Regular, line height 20
- Caption dan label kecil: 12 px, tidak lebih kecil dari ini
- Tombol: 15 px SemiBold

Skala desktop:
- H1: 40 px Bold, line height 48
- H2: 30 px Bold, line height 38
- H3: 22 px SemiBold, line height 30
- Body: 16 px Regular, line height 26
- Body kecil: 14 px Regular, line height 22
- Caption: 12–13 px
- Tombol: 16 px SemiBold

Warna teks utama navy #425B9A di atas cream atau putih. Teks di atas sky blue dan pink memakai navy, bukan putih. Panjang baris teks bacaan di desktop dibatasi sekitar 65–75 karakter.

## 5. Button

Semua tombol berbentuk pill (radius penuh), font Plus Jakarta Sans SemiBold, target sentuh minimum 48 px tingginya.

- **Primary:** background navy #425B9A, teks cream #FFF6DC. Tinggi 52 px di mobile, 48 px di desktop, padding horizontal 24 px. Dipakai untuk satu aksi utama per layar, misalnya "Find a Buddy" atau "Confirm Meetup".
- **Secondary:** background transparan atau cream, border 1,5 px navy, teks navy. Buat aksi pendamping seperti "See Details".
- **Accent:** background sky blue #76C0EC, teks navy. Buat aksi positif sekunder seperti "Create Activity" di dalam halaman. Teks di atas sky selalu navy.
- **Text button:** tanpa background, teks navy SemiBold, untuk aksi ringan seperti "Skip" atau "Report". Aksi report dan blokir memakai gaya ini dengan ikon peringatan, bukan tombol merah besar.
- **Disabled:** background navy opacity 30 persen, teks cream opacity 60 persen, tidak bisa ditekan.
- Lebar tombol di mobile mengikuti lebar konten (full width) untuk aksi utama di bagian bawah layar; di desktop tombol mengikuti lebar teksnya plus padding.

## 6. Kartu, form, dan komponen

- **Kartu aktivitas dan kartu match:** radius 24 px, padding 20 px di mobile dan 24 px di desktop, background putih di atas halaman cream, border 1 px sky blue opacity 40 persen atau bayangan lembut navy opacity 8 persen (pilih satu gaya dan konsisten).
- **Foto pada kartu:** rasio 4:3, radius 20 px di sisi atas kartu atau semua sisi bila berdiri sendiri.
- **Input form:** tinggi 52 px, radius 16 px, border 1,5 px navy opacity 20 persen; status fokus border navy penuh plus ring sky blue opacity 30 persen. Label 13 px SemiBold navy di atas input, teks bantuan 12 px di bawahnya.
- **Blok Aturan Main di form buat aktivitas:** tampil sebagai satu grup berjudul "Aturan Main" berisi pilihan chip untuk level obrolan, MBTI yang dicari, interest wajib, mode, preferensi gender, dan radius jarak (Area saya saja, ±5 km, ±10 km, ±25 km, Se-Jabodetabek); tiap baris punya pilihan status syarat wajib atau nilai plus. Di bagian bawah blok ada checkbox "Simpan sebagai preferensi saya". Bila form terisi dari preferensi tersimpan, blok diberi label kecil "Dari preferensi tersimpan".
- **Pita jarak pada kartu:** jarak ke kandidat atau aktivitas ditampilkan sebagai pita teks di chip kecil ("Satu area", "Sekitar 5–10 km"), tidak pernah sebagai angka presisi ke profil orang.
- **Chips dan tag interest:** pill, background sky blue opacity 25 persen, teks navy 13 px Medium, padding 8 x 14 px. Status terpilih: background navy, teks cream.
- **Badge terverifikasi:** ikon centang dalam lingkaran sky blue dengan centang navy, 16–18 px, selalu menempel di kanan nama user. Tidak ada badge berarti belum terverifikasi.
- **Indikator skor match:** angka besar Plus Jakarta Sans Bold di dalam lingkaran ring navy, diameter 56 px pada kartu, disertai label kecil "match" di bawah angka. Rincian skor ditampilkan sebagai bar horizontal membulat, bukan angka mentah saja.
- **Avatar:** lingkaran penuh, ukuran 40 px di daftar, 64 px di kartu match, 96 px di halaman profil. Untuk penampil yang belum terverifikasi (lihat aturan privasi di dokumen brand identity), kartu postingan hanya menampilkan deskripsi: avatar tampil sebagai inisial generik, nama sebagai titik-titik, dan baris lokasi serta waktu diganti penanda kunci bertuliskan "Tampil setelah verifikasi". Setelah penampil terverifikasi, kartu tampil utuh.

## 7. Pola layout per halaman

- **Feed aktivitas:** mobile 1 kolom, jarak antar kartu 16 px. Tablet 2 kolom, jarak 20 px. Desktop 3 kolom, jarak 24 px, di dalam kontainer 1200 px.
- **Detail match:** desktop 2 kolom, kolom profil sticky selebar sekitar 380 px di kiri dan konten rincian di kanan. Mobile bertumpuk satu kolom, dengan tombol aksi utama sticky di bagian bawah di atas bottom navigation (area tombol: padding 16 px, background cream).
- **Chat:** satu kolom maksimum 720 px di semua ukuran layar. Pesan masuk rata kiri, pesan sendiri rata kanan, gelembung radius 20 px dengan satu sudut lebih kecil di sisi pengirim.
- **Onboarding dan verifikasi:** satu kolom maksimum 480 px juga di desktop, rata tengah, satu langkah per layar, indikator progres berupa titik atau bar membulat di atas. Alur sensitif seperti verifikasi ID tidak pernah ditampilkan dalam grid banyak kolom.
- **Halaman kosong dan error:** figur T kecil 72 px di tengah, satu kalimat penjelasan dengan tone brand, satu tombol primary. Tidak memakai ilustrasi stok generik.

## 8. Ikon dan aksesibilitas

- Set ikon resmi: Lucide. Emoji tidak dipakai sebagai ikon atau dekorasi di aplikasi (keputusan user 27 Okt 2026 malam).
- Ukuran ikon: 24 px standar, 20 px inline di dalam teks atau chip, 28 px untuk ikon besar di halaman kosong.
- Gaya ikon: filled membulat, ujung garis rounded, tanpa sudut tajam, mengikuti bahasa bentuk logo (lihat dokumen brand identity).
- Target sentuh minimum 44 x 44 px untuk semua elemen yang bisa ditekan, termasuk ikon tanpa label.
- Fokus keyboard harus terlihat: ring 2 px sky blue di sekeliling elemen yang sedang fokus.
- Aturan kontras mengikuti dokumen brand identity: teks hanya memakai navy di atas warna terang, atau cream di atas navy.

## 9. Mode gelap (dark mode)

Aplikasi mendukung dua mode tampilan penuh (FR-29 dan FR-30 di PRD). Pemetaan warnanya:

- Latar halaman: mode terang cream #FFF6DC; mode gelap navy #425B9A.
- Permukaan kartu dan panel: mode terang putih #FFFFFF; mode gelap navy yang diangkat 12 persen ke arah putih, #596FA6, supaya kartu tetap terpisah dari latar.
- Teks utama: mode terang navy; mode gelap cream. Teks sekunder memakai warna teks utama yang sama dengan kepekatan 70 persen.
- Garis pemisah dan border: mode terang navy 12 persen; mode gelap cream 16 persen.
- Warna aksen tidak berubah di kedua mode: sky blue #76C0EC, pink #FF95A5, dan titik "i" pink pada wordmark. Teks yang duduk di atas sky blue dan pink selalu navy di kedua mode, mengikuti aturan kontras brand.
- Top bar: mode terang cream (sticky); mode gelap navy dengan lockup teks cream. Header memakai lockup teks navy di mode terang dan lockup teks cream di mode gelap.
- Toggle mode berupa ikon matahari dan bulan dari set Lucide di top bar dan di halaman pengaturan. Default mengikuti pengaturan sistem perangkat; pilihan manual user menimpa dan tersimpan.
- Animasi logo mengikuti mode: versi latar cream untuk mode terang, versi latar navy untuk mode gelap, dan versi transparan boleh dipakai di keduanya.
