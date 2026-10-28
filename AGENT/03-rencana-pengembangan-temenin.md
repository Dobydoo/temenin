# Rencana Pengembangan Temenin
Meta Global AI Developer Hackathon, building period 27 Okt sampai 4 Nov 2026
Deadline submission: Kamis 5 Nov 2026, 09:00 WIB
Dokumen dibuat 27 Okt 2026 malam. Target internal: sudah tersubmit Rabu 4 Nov sebelum 18:00 WIB.

## 1. Positioning yang dikunci

Temenin bukan aplikasi dating. Satu kalimat yang dipakai konsisten di README, demo, dan pitch:

Temenin mencocokkan orang dengan teman aktivitas harian yang kompatibel dan terverifikasi, dengan AI yang menjelaskan alasan kecocokannya dan safety plan yang jelas sebelum ketemu.

Pembeda yang harus terlihat di demo:
- Aktivitasnya spesifik (nonton, ngopi, belajar bareng, belanja, olahraga ringan), bukan open-ended cari kenalan.
- Setiap match punya alasan yang bisa dibaca user, bukan sekadar angka.
- Safety bukan tempelan: badge verifikasi, rating komunitas, tempat publik, dan feedback setelah aktivitas masuk ke alur utama.
- Privasi sebelum verifikasi (ditegaskan user 27 Okt malam, dirinci di dokumen brand identity): sebelum user verifikasi ID, postingan aktivitas hanya menampilkan deskripsinya; nama, lokasi, dan waktu terkunci ("verified eyes only"). Ini pembeda langsung dari aplikasi sejenis yang ditemukan di riset, yang menampilkan rencana lengkap dengan tempat dan jam secara publik atau berbasis berbagi lokasi real-time. Perbedaan tampilan sebelum dan sesudah verifikasi harus jadi salah satu momen utama demo.

## 2. Cerita demo (alur yang dinilai juri)

Satu skenario utama, dipakai untuk build dan video demo:

1. Nadia, 24 tahun, baru pindah ke Jakarta. Sabtu sore dia mau nonton film tapi tidak ada teman yang bisa.
2. Dia mengetik dengan bahasa bebas: "Sabtu sore mau nonton di daerah Tebet, budget 100 ribuan, pengen teman yang asik diajak ngobrol setelah film."
3. AI concierge mengubah kalimat itu jadi activity card terstruktur: kategori, waktu, area, budget, vibe.
4. Matching engine menampilkan 3 kandidat dengan skor dan rincian alasannya. Daftarnya sudah menghormati Aturan Main dari activity card Nadia, termasuk preferensi gendernya sebagai komponen skor tertinggi; satu kandidat yang tidak memenuhi syarat level obrolannya tampil turun peringkat dengan penjelasan terbuka, dan tiap kandidat membawa checklist pemenuhan syarat.
5. Nadia memilih kandidat dengan badge verified dan rating tinggi. AI memberi icebreaker dan rekomendasi tempat publik dari daftar kurasi beserta alasan pemilihannya sesuai konteks aktivitas.
6. Mereka chat singkat di dalam app (filter chat menahan nomor HP yang coba dibagikan sebelum meetup terkonfirmasi), lalu sama-sama confirm meetup. Titik temu persis baru tampil setelah konfirmasi dua arah, dan Nadia membagikan ringkasan rencana ke kontak terpercaya lewat tombol bagikan rencana.
7. Setelah jam aktivitas selesai, Nadia menekan check-in "sudah pulang aman", lalu memberi rating dan tag ("tepat waktu", "bikin nyaman"). Trust score dan skor keandalan partner naik dan tercatat di profilnya.

Kalau alur 7 langkah ini jalan mulus, demo sudah kuat. Fitur di luar alur ini adalah bonus.

## 3. Scope MVP

### Wajib (must have)

1. **Onboarding dan profil**
   - Gerbang usia 18+: Temenin hanya untuk pengguna 18 tahun ke atas (keputusan user 27 Okt, demi keamanan). Tanggal lahir dicek di onboarding dan verifikasi ID menjadi syarat sebelum user bisa menerima atau mengirim permintaan match.
   - Nama, gender, area domisili (level kecamatan atau kawasan, bukan alamat persis), foto atau avatar inisial. Gender dicatat karena menjadi dasar komponen preferensi gender saat matching (lihat item 3).
   - MBTI, opsional: boleh diisi, boleh kosong, boleh "tidak tahu". Diisi sendiri oleh user, tampil sebagai badge label di profil. MBTI bukan penentu skor dan aplikasi tidak memakai tabel kecocokan MBTI; yang diukur untuk energy fit tetap hasil kuis kepribadian.
   - Pilih interest dari daftar tag.
   - Kuis kepribadian singkat, 6 pertanyaan, hasilnya berupa trait sederhana: social energy, spontanitas, gaya ngobrol, suka indoor atau outdoor.
   - Preferensi keamanan: hanya tempat publik, boleh grup atau harus 1-on-1, preferensi partner.

2. **Buat aktivitas, dua cara**
   - Form biasa: kategori, waktu, area, budget, jumlah orang, catatan.
   - Bahasa bebas: user mengetik kalimat, AI memecahnya jadi activity card yang bisa diedit sebelum diposting. Ini bagian "agent" dari Temenin, jadi jangan dipotong.
   - **Aturan Main aktivitas** (disetujui user 27 Okt malam): syarat temen yang dicari untuk aktivitas ini, ditempel ke postingan, bukan ke profil, karena kebutuhan berubah per aktivitas. Bidangnya: level obrolan (minim ngobrol, seperlunya, banyak ngobrol), MBTI yang dicari (tidak masalah, sama seperti saya, atau tipe tertentu pilihan user sendiri), interest wajib dari tag yang ada, mode (1-on-1 atau grup kecil), radius jarak (aturan mainnya sendiri di bawah), dan preferensi gender. Setiap bidang berstatus syarat wajib (filter) atau nilai plus (penambah skor); syarat wajib dibatasi maksimal 2 bidang, di luar preferensi gender yang aturannya sendiri di item 3.
   - AI concierge ikut mengekstrak Aturan Main dari kalimat bebas ("pengen yang pendiam aja" menjadi level obrolan minim ngobrol) dan hasilnya tampil di activity card untuk dikoreksi user sebelum posting.
   - **Radius jarak versi aman-privasi** (disetujui user 27 Okt malam): pilihan chip "Area saya saja", ±5 km, ±10 km, ±25 km, atau "Se-Jabodetabek", default 10 km. Jarak selalu dihitung antar titik tengah area level kecamatan, bukan dari lokasi persis siapa pun, karena Temenin tidak memakai live location sama sekali. Yang ditampilkan ke user adalah pita jarak ("satu area", "sekitar 3–5 km", "sekitar 5–10 km"), bukan angka presisi ke profil orang, supaya posisi seseorang tidak bisa ditebak dari angka jarak. Status default-nya nilai plus di komponen konteks, dengan opsi "hanya dalam radius ini" untuk menjadikannya filter.
   - **Save Preference** (diminta user 27 Okt malam): checkbox "Simpan sebagai preferensi saya" menyimpan Aturan Main terakhir termasuk preferensi gender dan radius jarak. Saat membuat aktivitas baru, Aturan Main otomatis terisi dari preferensi tersimpan, diberi label "dari preferensi tersimpan", dan tetap bisa diubah untuk aktivitas itu saja tanpa mengubah yang tersimpan. Preferensi tersimpan hanya diperbarui bila checkbox dicentang lagi saat posting, dan bisa juga dilihat serta diubah dari halaman profil.

3. **Matching engine yang bisa dijelaskan**
   - Skor deterministik dari 5 komponen (bobot diatur ulang 27 Okt malam atas keputusan user: preferensi gender adalah komponen bernilai tertinggi): preferensi gender 30%, interest sama 25%, profil energi (kepribadian dari kuis) 20%, konteks (area, waktu, budget) 15%, trust score 10%.
   - Cara kerja preferensi gender: bila pemosting memilih gender tertentu, kandidat dengan gender itu menerima nilai penuh komponen 30% dan kandidat lain menerima nol, sehingga turun jauh di peringkat dan diberi label terbuka "di luar preferensi gendermu". Bila pemosting memilih "tidak masalah", semua kandidat menerima nilai penuh dan komponen ini netral. Pemosting juga boleh menaikkan preferensi gender menjadi syarat wajib yang memfilter penuh.
   - Pemenuhan Aturan Main ditampilkan di detail match sebagai checklist "Syaratmu yang terpenuhi", misalnya 3 dari 3, supaya user melihat sendiri kenapa kandidat ini cocok dengan aturan yang dia pasang.
   - Komponen konteks memakai radius: kandidat di dalam radius menerima nilai konteks lebih tinggi mengikuti seberapa dekat pitanya, kandidat di luar radius menerima nilai konteks minimum, atau tersaring penuh bila user mengaktifkan "hanya dalam radius ini".
   - LLM hanya bertugas menjelaskan skor itu dengan bahasa natural, menonjolkan titik cocok dan potensi gesekan, plus memberi 2 sampai 3 icebreaker.
   - Penamaan ke user mengikuti tagline: hasil kuis kepribadian disebut "profil energi" dan komponen kepribadian di rincian match ditampilkan sebagai "energy fit", supaya janji tagline "Vibes click. Plans stick." terasa di dalam produk, bukan hanya di logo.
   - Hasil penjelasan untuk match demo utama disimpan sebagai cadangan, jadi demo tidak tergantung API live.
   
4. **Profil companion (data seeded)**
   - 14 sampai 18 persona fiktif untuk area Jakarta dan sekitarnya. Label jelas di README bahwa ini data demo.
   - Tiap persona: gender, MBTI (sebagian persona sengaja dikosongkan untuk menunjukkan kolom ini opsional), interest, trait, badge verifikasi, rating, jumlah aktivitas selesai, skor keandalan (persentase rencana yang benar-benar terlaksana, lihat item 7), review singkat. Komposisi gender persona dibuat beragam supaya preferensi gender dan Aturan Main terlihat bekerja di demo. Area domisili persona mengelompok di beberapa zona (misalnya klaster Tebet dan Jakarta Selatan, klaster Depok, klaster Tangerang) lengkap dengan titik tengah area per kecamatan, supaya radius jarak terlihat mengubah daftar kandidat secara nyata saat diganti dari 5 ke 25 km.

5. **Trust and Safety Center**
   - Alur verifikasi identitas simulasi: langkah upload ID dan selfie, status berubah jadi verified. Di demo diberi label simulasi, bukan verifikasi beneran.
   - Aturan privasi sebelum verifikasi (keputusan user 27 Okt, diperluas hari yang sama): user yang belum terverifikasi hanya melihat deskripsi aktivitas. Nama pembuat postingan, lokasi, dan waktu aktivitas disembunyikan (penanda "tampil setelah verifikasi", avatar inisial generik), karena kombinasi lokasi dan waktu menunjukkan seseorang akan berada di mana dan kapan. Setelah penampil terverifikasi, postingan terlihat utuh dengan badge. Di demo ditunjukkan lewat dua akun contoh, satu belum terverifikasi dan satu sudah.
   - Rekomendasi tempat publik per area dari daftar kurasi statis (mal, kafe, perpustakaan, ruang publik). AI memilih dan menjelaskan rekomendasi dari daftar ini berdasarkan konteks aktivitas (pemanggilan AI keempat, fallback urutan kurasi default); AI tidak mengarang tempat di luar daftar.
   - Checklist sebelum ketemu: ketemu di tempat publik, bagikan rencana ke kontak terpercaya, chat tetap di dalam app.
   - Tombol report dan block di profil dan di chat.
   - Pengungkapan dua tahap (disetujui user 27 Okt malam): tahap pertama, verifikasi ID membuka nama, area, dan waktu. Tahap kedua, titik temu persis (nama tempat dan alamatnya) hanya tampil setelah kedua pihak sama-sama menekan confirm meetup. Tidak ada yang tahu persis seseorang akan berada di mana sebelum ada komitmen dua arah.
   - Tombol "Bagikan rencana" di kartu konfirmasi: mengirim ringkasan aktivitas (kegiatan, tempat, jam, nama partner) ke kontak terpercaya yang didaftarkan user saat onboarding. Di demo berupa tampilan simulasi terkirim, bukan pengiriman beneran.
   - Check-in keamanan: setelah jam aktivitas selesai, user menerima prompt "Sudah pulang dengan aman?" dengan tombol konfirmasi. Di demo berupa status yang tercatat di halaman aktivitas saya.

6. **Chat dan confirm meetup**
   - Thread chat sederhana dengan partner terpilih.
   - Kartu konfirmasi meetup: aktivitas, waktu, tempat, safety checklist yang harus dicentang sebelum tombol confirm aktif.
   - Filter info kontak di chat (disetujui user 27 Okt malam): sebelum meetup terkonfirmasi dua arah, pesan yang memuat pola nomor telepon atau handle media sosial ditahan dan pengirim menerima pengingat lembut untuk tetap berkomunikasi di dalam app sampai bertemu. Setelah meetup terkonfirmasi, filter berhenti menahan. Lapisan keduanya adalah AI Safety Check (pemanggilan AI ketiga): pesan mencurigakan yang lolos pola, misalnya nomor yang ditulis dengan kata atau disisipi spasi dan titik, serta ajakan menekan untuk pindah platform, dinilai AI dan ditahan bila berisiko. Fallback-nya adalah hasil filter pola apa adanya.

7. **Feedback setelah aktivitas**
   - Rating bintang, tag cepat, review singkat.
   - Trust score dan jumlah aktivitas partner bertambah. Loop ini yang membuktikan klaim "community feedback loop" di deskripsi pengajuan.
   - Skor keandalan (disetujui user 27 Okt malam): setiap profil menampilkan persentase rencana terkonfirmasi yang benar-benar terlaksana. Aktivitas yang selesai menaikkannya; laporan no-show dari partner menurunkannya. Skor ini pasangan trust score dan menjadi bukti terukur dari janji tagline "Plans stick": rencana di Temenin benar-benar jalan, bukan berhenti jadi wacana.

### Kalau waktu sisa (should have)
- Aktivitas grup 3 sampai 4 orang (nilai plus untuk safety dan membedakan dari dating app).
- Filter browse: kategori, area, waktu.
- Halaman "aktivitas saya" berisi rencana yang sudah confirm.
- Mode gelap (dark mode) mengikuti sistem dengan toggle manual, memakai pemetaan warna dan varian logo resmi per mode (FR-29 dan FR-30 di PRD). Ditambahkan user 27 Okt 2026 malam setelah seluruh aset logo dan animasi dinyatakan lengkap berpasangan light dan dark.

### Dipotong dari scope hackathon (masuk roadmap saja)
- Pembayaran atau booking tiket beneran.
- Verifikasi KTP beneran dengan OCR atau vendor KYC.
- Live location tracking.
- Registrasi user publik dan akuisisi user beneran.
- Aplikasi native Android/iOS. Cukup web mobile-first yang tampil seperti aplikasi HP.

## 4. Arsitektur yang disarankan

- **Frontend:** web app responsif (Next.js + TypeScript + Tailwind, dikunci 27 Okt malam), satu repo publik di GitHub, deploy ke Vercel supaya juri bisa buka link demo langsung.
  - Layar kecil dan tablet (di bawah 1024px): tampilan seperti aplikasi mobile, termasuk tablet. Bottom navigation, kartu full-width, tombol aksi utama sticky di bawah. Di HP satu kolom dengan lebar konten dibatasi sekitar 480px dan rata tengah. Di tablet (sekitar 768 sampai 1023px) layout aplikasi tetap dipakai, tapi daftar aktivitas dan match boleh jadi grid 2 kolom supaya ruang tidak kosong. Tablet landscape yang lebarnya 1024px atau lebih ikut layout web.
  - Layar besar (1024px ke atas): tampilan web normal. Sidebar atau top navigation menggantikan bottom nav, daftar match dan aktivitas jadi grid 2 sampai 3 kolom, halaman detail match bisa dua kolom (profil di kiri, rincian skor dan safety plan di kanan).
  - Yang berubah hanya layout, bukan isi atau alur. Satu codebase, satu alur demo yang sama di semua ukuran layar.
- **Data:** mulai dari data seeded lokal (JSON) supaya alur demo beres dulu. Supabase (auth + Postgres) hanya ditambahkan kalau checkpoint Jumat 30 Okt hijau. Backend tidak boleh mengancam jadwal demo.
- **Login demo:** pilih persona sebagai user yang login. Tidak perlu sistem auth penuh untuk MVP.
- **AI:** empat pemanggilan (diperluas 27 Okt malam atas persetujuan user; prinsipnya "AI understands you, rules protect you"). Pertama, parsing kalimat bebas jadi activity card plus draf Aturan Main. Kedua, penjelasan match dan icebreaker. Ketiga, AI Safety Check: lapisan kedua filter chat untuk pesan mencurigakan yang lolos pola teks (nomor ditulis dengan kata, disisipi spasi/titik, ajakan menekan pindah platform), hanya berjalan untuk pesan yang ditandai mencurigakan. Keempat, rekomendasi konteks lokal: AI memilih dan menjelaskan tempat dari daftar kurasi tempat publik sesuai area, jam, budget, dan Aturan Main; AI tidak mengarang tempat di luar daftar. Keempatnya punya fallback non-AI kalau API gagal (template, filter pola saja, atau urutan kurasi default). Skor match dan keputusan verifikasi serta penegakan aturan tetap deterministik, tidak dikerjakan AI.
- **Model data minimum:** users, activities, matches, messages, reviews, reports (skema lengkap di dokumen ERD).

**Tech stack resmi (dikunci user 27 Okt 2026 malam):**
- Bahasa TypeScript mode strict di seluruh repo.
- Framework Next.js (App Router) + React, satu repo publik GitHub.
- Styling Tailwind CSS; ikon memakai set Lucide, bukan emoji; font Pacifico dan Plus Jakarta Sans dimuat lewat next/font.
- Backend memakai Route Handlers Next.js di sisi server; semua kunci API hanya ada di server.
- Database dan autentikasi memakai Supabase (PostgreSQL, Auth, Storage privat, Row Level Security). Tahapannya tetap: data seeded JSON lebih dulu, migrasi Supabase setelah checkpoint 30 Okt, skema mengikuti dokumen ERD.
- Validasi memakai Zod untuk semua input API dan form.
- AI dipanggil lewat Route Handlers, tidak pernah langsung dari browser; empat pemanggilan sesuai PRD, masing-masing dengan fallback non-AI.
- Deploy di Vercel untuk aplikasi dan Supabase untuk data.
- Clean code: ESLint dan Prettier wajib hijau sebelum commit; komponen UI tidak memuat logika bisnis; matching engine deterministik hidup di lapisan service sendiri, terpisah dari pemanggilan AI; penamaan variabel dan fungsi deskriptif.

**Keamanan aplikasi dan database (aturan tetap, diminta user 27 Okt 2026 malam):**
- Penyembunyian nama, lokasi, dan waktu ditegakkan di lapisan data, bukan hanya tampilan: query untuk penampil belum terverifikasi berjalan lewat view atau fungsi yang hanya mengembalikan deskripsi, diperkuat Row Level Security di Supabase. Bug di frontend tidak boleh bisa membocorkan field sensitif.
- Tidak ada kunci rahasia di klien. Service role key hanya di server dan tidak pernah dikirim ke browser.
- Semua input divalidasi Zod di server; query selalu lewat client Supabase berparameter, tidak ada penyusunan SQL dari gabungan string.
- Autentikasi memakai Supabase Auth, hash kata sandi dikelola penyedia dan bukan buatan sendiri; sesi memakai cookie httpOnly.
- Endpoint AI wajib terotentikasi dan diberi rate limit per user untuk mencegah penyalahgunaan biaya.
- Berkas verifikasi disimpan di bucket Storage privat dengan URL bertanda tangan berumur pendek, mengikuti kebijakan retensi di PRD.
- Header keamanan standar diaktifkan (Content-Security-Policy, X-Content-Type-Options, Referrer-Policy) dan seluruh trafik berjalan di HTTPS.
- Data pribadi dijaga seminimal mungkin: tidak ada koordinat presisi dan tidak ada live location, sesuai ERD.

**Aturan penulisan di aplikasi (diminta user 27 Okt 2026 malam):**
- Seluruh teks UI, notifikasi, dan pesan sistem tidak memakai emoji dan tidak memakai em-dash. Penanda visual memakai ikon Lucide.
- Kalimat yang sebelumnya akan memakai em-dash ditulis ulang dengan tanda baca biasa: koma, titik, atau titik dua.
- Aturan ini berlaku juga untuk keluaran AI yang tampil ke user (penjelasan match, icebreaker, pengingat filter chat): prompt AI wajib menyebut larangan ini.

Kenapa web responsif, bukan Flutter (keputusan diambil 27 Okt malam): juri membuka link lebih cepat daripada install APK, dan rules hackathon minta repo publik plus demo yang menonjolkan karya selama hackathon. Di layar HP tampilannya tetap seperti aplikasi native untuk kebutuhan video demo, di layar besar juri tetap nyaman membukanya sebagai web. Satu codebase untuk dua-duanya.

Urutan kerja: mockup dulu, baru coding. Mockup tidak perlu semua halaman. Cukup 7 layar yang masuk cerita demo, dibuat versi mobile lebih dulu, lalu 2 layar kunci versi desktop (daftar match dan detail match) untuk memastikan layout besar masuk akal sejak awal:
1. Onboarding dan kuis kepribadian
2. Home atau activity board
3. Buat aktivitas dengan input bahasa bebas dan hasil activity card-nya
4. Daftar hasil match dengan skor
5. Detail match: rincian skor, icebreaker, safety plan
6. Chat dan kartu confirm meetup
7. Feedback setelah aktivitas dan Safety Center (bisa digabung satu layar berisi dua bagian)

## 5. Timeline per hari

Jadwal kelasmu tetap jalan. Blok bangun utama ditaruh di siang sebelum kelas dan di hari bebas.

- **Selasa 27 Okt, malam ini (setelah Statistika, sebelum Agents 101 jam 23:00)**
  Kunci scope dari dokumen ini, buat repo GitHub publik, setup skeleton project, tulis README awal (judul, masalah, solusi, daftar fitur yang akan dibangun selama hackathon). Selesai 60 menit sudah cukup untuk hari pertama.

- **Rabu 28 Okt (kelas Metodologi Penelitian 19:30–21:30, Agents 102 jam 23:00)**
  Siang: selesaikan mockup 7 layar utama (mobile dulu, plus daftar match dan detail match versi desktop), lalu mulai UI shell dan onboarding mengikuti mockup. Malam setelah kelas tidak wajib lanjut.

- **Kamis 29 Okt (kelas Pemrograman Mobile 19:30–21:30)**
  Siang: activity board, form buat aktivitas, parsing bahasa bebas, data seeded 14 sampai 18 persona.

- **Jumat 30 Okt, hari bangun utama 1 (bebas, sesi live jam 23:00)**
  Matching engine dengan rincian skor, penjelasan AI dan icebreaker, halaman profil companion.
  Checkpoint 18:00: alur demo langkah 1 sampai 4 harus sudah jalan end-to-end dengan data seeded. Kalau belum, potong should-have, jangan tambah fitur baru.

- **Sabtu 31 Okt (kelas 08:00–12:00, lanjut setelahnya)**
  Trust and Safety Center, verifikasi simulasi, rekomendasi tempat publik, chat, kartu confirm meetup. Termasuk di hari ini: pengungkapan dua tahap, filter info kontak di chat, tombol bagikan rencana ke kontak terpercaya, dan check-in pulang aman.

- **Minggu 1 Nov, hari bangun utama 2 (bebas)**
  Feedback setelah aktivitas dan update trust score serta skor keandalan, poles UI, uji alur demo penuh dari awal sampai akhir di layar HP.
  Checkpoint 18:00: feature freeze untuk must-have.

- **Senin 2 Nov (kelas RPL + Sistem Penetrasi 17:30–21:30, office hours geser jadi 22:00–23:00)**
  Siang: perbaiki bug dari uji hari Minggu, tulis README final, siapkan naskah video demo 2 sampai 3 menit mengikuti 7 langkah di bagian 2.

- **Selasa 3 Nov (kelas Statistika 19:00–21:00)**
  Hari terakhir penuh untuk tanya troubleshooting ke panitia. Rekam video demo versi final. Tidak ada fitur baru mulai hari ini.

- **Rabu 4 Nov (kelas Metodologi Penelitian 19:30–21:30)**
  Submit sebelum kelas, target sebelum 18:00 WIB: repo publik, link demo, video, deskripsi. Setelah kelas hanya cek ulang halaman submission, bukan lanjut ngoding.

- **Kamis 5 Nov 09:00 WIB:** deadline resmi. Dijadikan cadangan darurat saja, bukan target.

## 6. Risiko dan cara menutupnya

- **Dikira dating app.** Tutup dengan: aktivitas spesifik, opsi grup, tanpa fitur romantis sama sekali, bahasa di UI selalu "teman aktivitas".
- **Dikritik soal keamanan ketemu orang asing.** Jadikan safety bagian dari alur utama demo (badge, checklist, tempat publik, feedback), bukan halaman terpisah yang tidak dibuka.
- **Persona seeded terlihat seperti user palsu.** Jujur di README: data demo untuk menunjukkan alur. Itu lebih aman daripada berpura-pura punya user beneran.
- **API AI gagal saat demo.** Penjelasan match utama tersimpan sebagai cadangan dan video demo direkam lebih dulu, jadi penilaian tidak tergantung koneksi live.
- **Scope melebar.** Setiap fitur baru harus menjawab satu pertanyaan: apakah dia masuk 7 langkah cerita demo? Kalau tidak, masuk roadmap.

## 7. Checklist submission

- [ ] Repo GitHub publik, README menjelaskan masalah, solusi, fitur yang dibangun selama hackathon, cara menjalankan, dan catatan data demo.
- [ ] Link demo live bisa dibuka tanpa login khusus.
- [ ] Video demo 2 sampai 3 menit mengikuti cerita Nadia.
- [ ] Deskripsi submission konsisten dengan deskripsi pengajuan Temenin.
- [ ] Screenshot utama: activity card hasil parsing AI, rincian skor match, safety center.
- [ ] Submit sebelum Rabu 4 Nov 18:00 WIB.

## 8. Keputusan

1. Stack: SUDAH DIPUTUSKAN 27 Okt, web responsif. Layar kecil seperti aplikasi mobile, layar besar tampilan web normal. Flutter tidak dipakai.
2. Kota demo: Jakarta dan sekitarnya dengan persona seeded (sesuai konteks lokal di deskripsi pengajuan).
3. Urutan kerja: SUDAH DIPUTUSKAN 27 Okt, mockup 7 layar utama dulu, baru coding mengikuti mockup.
4. Yang masih terbuka: malam ini dikerjakan sampai repo dan skeleton saja, atau mockup dimulai malam ini juga setelah kelas.
