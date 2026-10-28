# PRD Temenin (Product Requirements Document)
Versi 1.0, 27 Oktober 2026. Disusun untuk building period Meta Global AI Developer Hackathon (27 Okt–4 Nov 2026) dan menjadi acuan produk jangka panjang Temenin.
Dokumen pendamping: Brand Identity Temenin, Layout Guide Temenin, Rencana Pengembangan Temenin, ERD Temenin, UML Temenin.

## 1. Ringkasan produk
Temenin adalah platform web pencocokan teman aktivitas (activity buddy matching) berbasis AI. User memposting aktivitas harian yang konkret (nonton, ngopi, belajar, belanja, olahraga ringan), lalu sistem mencocokkannya dengan temen yang kompatibel berdasarkan preferensi gender, interest, profil energi, konteks (area, waktu, budget, radius), dan kepercayaan. Temenin bukan aplikasi dating: tidak ada fitur romantis, aktivitasnya selalu spesifik, dan keamanan serta privasi dirancang masuk ke alur utama.

Tagline resmi: "Vibes click. Plans stick." / "Energinya klik, rencananya jalan."

Satu kalimat positioning: Temenin mencocokkan orang dengan teman aktivitas harian yang kompatibel dan terverifikasi, dengan AI yang menjelaskan alasan kecocokannya dan safety plan yang jelas sebelum ketemu.

## 2. Masalah yang diselesaikan
- Kesepian urban (urban loneliness): banyak orang punya rencana sederhana tapi tidak punya teman untuk menjalankannya, sehingga rencana batal.
- Aplikasi pertemanan yang ada umumnya menampilkan profil, rencana lengkap dengan tempat dan jam, bahkan lokasi real-time secara terbuka. Itu nyaman untuk menemukan orang, tetapi berisiko untuk keamanan, terutama bagi user yang baru pertama kali bertemu orang asing.
- Pencocokan di aplikasi sejenis umumnya tidak bisa dijelaskan: user menerima angka atau daftar tanpa tahu alasannya, dan tidak bisa memasang syarat gaya interaksi (misalnya ingin teman yang pendiam untuk menonton film).

## 3. Tujuan dan indikator keberhasilan
Tujuan versi hackathon (MVP demo):
- Alur demo 7 langkah (posting bahasa bebas, matching dengan alasan, chat, confirm meetup dua arah, check-in, feedback) berjalan end-to-end di web responsif.
- Pembeda privasi terlihat nyata: perbedaan tampilan postingan sebelum dan sesudah verifikasi, pengungkapan dua tahap, dan radius berbasis pita jarak.
- Submission lengkap sebelum Rabu 4 Nov 2026 pukul 18:00 WIB: repo publik, link demo live, video 2–3 menit, README.

Tujuan produk jangka panjang (pasca-hackathon):
- Persentase rencana terkonfirmasi yang benar-benar terlaksana (diukur oleh skor keandalan agregat) menjadi metrik utama, sesuai janji tagline.
- Retensi user yang menyelesaikan aktivitas pertamanya dan membuat aktivitas kedua.
- Nol toleransi kebocoran detail sensitif: tidak ada laporan nama, lokasi, atau waktu yang terlihat oleh user belum terverifikasi.

## 4. Target pengguna
- Semua kalangan usia 18 tahun ke atas. Di bawah 18 tahun tidak dapat mendaftar (gerbang usia di onboarding).
- Persona utama demo: perantau atau pendatang baru di kota besar yang belum punya lingkaran pertemanan lokal (contoh: Nadia, 24, baru pindah ke Jakarta).
- Persona pendukung: mahasiswa dan pekerja muda dengan jadwal fleksibel yang mencari teman untuk aktivitas spesifik.
- Bahasa aplikasi: Inggris dan Indonesia, default Inggris.

## 5. Prinsip produk (tidak dapat ditawar)
1. Bukan dating app. Istilah resmi untuk teman aktivitas adalah "temen" (Inggris: "activity buddy" atau "friend"). Kata "pasangan" dilarang dalam UI.
2. Privasi sebelum verifikasi: user belum terverifikasi ID hanya melihat deskripsi aktivitas. Nama, lokasi, dan waktu tersembunyi.
3. Pengungkapan dua tahap: verifikasi membuka nama, area, dan waktu; titik temu persis hanya terbuka setelah confirm meetup dua arah.
4. Verifikasi ID wajib untuk semua user sebelum bisa match. 18+ only.
5. Tidak ada live location dalam bentuk apa pun. Jarak dihitung antar titik tengah area kecamatan dan ditampilkan sebagai pita jarak.
6. Setiap skor match harus bisa dijelaskan dengan bahasa natural dan checklist yang bisa dibaca user.

## 6. Ruang lingkup
### 6.1 Di dalam scope MVP (hackathon)
- Onboarding dengan gerbang usia 18+, profil, kuis profil energi (6 pertanyaan), kolom MBTI opsional, preferensi keamanan, kontak terpercaya.
- Verifikasi identitas simulasi berlabel (upload ID dan selfie, status menjadi verified).
- Buat aktivitas dua cara: form, dan bahasa bebas yang diparsing AI concierge menjadi activity card.
- Aturan Main per aktivitas: level obrolan, MBTI yang dicari, interest wajib, mode, radius jarak, preferensi gender; status syarat wajib (maksimal 2 bidang) atau nilai plus; Save Preference untuk menyimpan dan memakai ulang.
- Matching engine deterministik dengan 5 komponen berbobot dan penjelasan AI plus icebreaker (dengan fallback template).
- Activity board dan daftar match dengan aturan tampilan berbasis status verifikasi penampil.
- Trust and Safety Center: rekomendasi tempat publik yang dipilih dan dijelaskan oleh AI dari daftar kurasi, checklist, tombol bagikan rencana, report dan block.
- Chat dengan filter info kontak sebelum meetup terkonfirmasi plus AI Safety Check untuk upaya membagikan kontak secara terselubung, kartu konfirmasi meetup, check-in "sudah pulang aman".
- Feedback setelah aktivitas: rating, tag, review; memperbarui trust score dan skor keandalan.
- Mode tampilan terang dan gelap (dark mode) di seluruh aplikasi, mengikuti preferensi sistem dengan opsi ganti manual (FR-29 dan FR-30).
- Data demo: 14–18 persona seeded fiktif area Jabodetabek.

### 6.2 Di luar scope (roadmap pasca-hackathon)
- Pembayaran atau booking tiket beneran.
- Verifikasi KTP beneran (OCR atau vendor KYC), termasuk kebijakan retensi data ID: simpan status dan hasil verifikasi saja, hapus gambar ID setelah proses, enkripsi penuh.
- Live location tracking dalam bentuk apa pun (tetap ditolak; yang dipertimbangkan hanya berbagi lokasi terbatas waktu ke kontak terpercaya dalam mode darurat).
- Registrasi publik dan akuisisi user.
- Aplikasi native Android/iOS.
- Deteksi risiko percakapan tingkat lanjut oleh AI (di luar pemeriksaan info kontak terselubung pada FR-27 yang masuk scope MVP) dan tombol darurat (SOS).

## 7. Kebutuhan fungsional
Kode FR dipakai untuk penelusuran ke ERD dan UML.

### 7.1 Akun, profil, dan verifikasi
- FR-01: Sistem menolak pendaftaran dengan tanggal lahir yang menunjukkan usia di bawah 18 tahun.
- FR-02: User mengisi profil: nama, gender, area domisili level kecamatan, foto atau avatar inisial, interest (tag), MBTI (opsional, boleh kosong), preferensi keamanan, dan satu kontak terpercaya.
- FR-03: User menjawab kuis 6 pertanyaan; sistem menghasilkan profil energi (social energy, gaya ngobrol, spontanitas, indoor/outdoor).
- FR-04: User menjalani verifikasi simulasi (langkah upload ID dan selfie); status berubah menjadi verified dan badge tampil di profil. Tanpa status verified, user tidak dapat mengirim atau menerima permintaan match.
- FR-05: Sistem menyimpan preferensi tersimpan (Save Preference) per user dan menampilkannya di halaman profil untuk diubah.

### 7.2 Aktivitas dan Aturan Main
- FR-06: User membuat aktivitas lewat form: kategori, deskripsi, waktu, area, budget, jumlah orang, catatan.
- FR-07: User membuat aktivitas lewat bahasa bebas; AI concierge memparsing kalimat menjadi activity card terstruktur termasuk draf Aturan Main, dan user wajib dapat mengeditnya sebelum posting.
- FR-08: User memasang Aturan Main per aktivitas: level obrolan (minim, seperlunya, banyak), MBTI yang dicari (tidak masalah, sama seperti saya, tipe tertentu), interest wajib, mode (1-on-1 atau grup kecil), radius jarak, preferensi gender.
- FR-09: Setiap bidang Aturan Main berstatus nilai plus atau syarat wajib; sistem membatasi syarat wajib maksimal 2 bidang di luar preferensi gender.
- FR-10: Checkbox Save Preference menyimpan Aturan Main terakhir; form aktivitas berikutnya terisi otomatis dari preferensi tersimpan dengan label, dan perubahan pada satu aktivitas tidak mengubah preferensi tersimpan kecuali checkbox dicentang lagi.
- FR-11: Radius jarak memiliki pilihan: Area saya saja, ±5 km, ±10 km (default), ±25 km, Se-Jabodetabek; opsi "hanya dalam radius ini" menjadikannya filter.
- FR-12: Penampil yang belum terverifikasi hanya melihat deskripsi aktivitas; nama pembuat tampil sebagai titik-titik dengan avatar inisial generik, lokasi dan waktu diganti penanda "Tampil setelah verifikasi".

### 7.3 Matching
- FR-13: Skor match dihitung deterministik dari 5 komponen: preferensi gender 30%, interest sama 25%, profil energi (energy fit) 20%, konteks (area, waktu, budget, radius) 15%, trust score 10%.
- FR-14: Bila preferensi gender diatur ke gender tertentu, kandidat bergender tersebut menerima nilai penuh komponen itu dan kandidat lain menerima nol serta label "di luar preferensi gendermu". Bila diatur "tidak masalah", semua kandidat menerima nilai penuh. Preferensi gender dapat dinaikkan menjadi syarat wajib (filter penuh).
- FR-15: Kandidat yang tidak memenuhi syarat wajib Aturan Main tersaring; kandidat yang kurang memenuhi nilai plus turun peringkat dengan penjelasan terbuka.
- FR-16: Detail match menampilkan rincian skor per komponen, checklist "Syaratmu yang terpenuhi", penjelasan natural dari AI, dan 2–3 icebreaker. Penjelasan untuk skenario demo utama memiliki fallback yang di-cache.
- FR-17: Jarak ditampilkan hanya sebagai pita ("satu area", "sekitar 3–5 km", "sekitar 5–10 km", "sekitar 10–25 km"), dihitung antar titik tengah area kecamatan. Sistem tidak pernah menampilkan jarak presisi ke profil seseorang.

### 7.4 Chat, konfirmasi, dan keamanan pertemuan
- FR-18: User terverifikasi dapat membuka chat dengan partner dari match yang dipilih.
- FR-19: Sebelum meetup terkonfirmasi dua arah, chat menahan pesan yang memuat pola nomor telepon atau handle media sosial dan menampilkan pengingat lembut untuk tetap berkomunikasi di dalam app. Setelah konfirmasi, penahanan berhenti. Lapisan keduanya adalah AI Safety Check pada FR-27.
- FR-20: Kartu konfirmasi meetup menampilkan aktivitas, waktu, dan tempat dari daftar rekomendasi tempat publik; tombol confirm aktif hanya setelah safety checklist dicentang. Titik temu persis hanya tampil setelah kedua pihak confirm.
- FR-21: User dapat membagikan ringkasan rencana (aktivitas, tempat, jam, nama partner) ke kontak terpercaya lewat tombol bagikan rencana (di MVP berupa tampilan simulasi terkirim).
- FR-22: Setelah jam aktivitas selesai, sistem menampilkan prompt check-in "Sudah pulang dengan aman?" dan mencatat statusnya.
- FR-23: User dapat me-report dan mem-block user lain dari profil maupun chat; block menyembunyikan kedua pihak satu sama lain.

### 7.5 Feedback dan skor kepercayaan
- FR-24: Setelah aktivitas, kedua pihak dapat memberi rating bintang, tag cepat, dan review singkat.
- FR-25: Sistem memperbarui trust score partner berdasarkan feedback komunitas.
- FR-26: Sistem memperbarui skor keandalan: persentase rencana terkonfirmasi yang benar-benar terlaksana; laporan no-show menurunkannya. Kedua skor tampil di profil.

### 7.6 Peran AI (disetujui user 27 Okt 2026 malam)
Prinsip resmi: "AI understands you, rules protect you." AI dipakai di titik yang membutuhkan pemahaman bahasa dan konteks; keputusan yang menyangkut keadilan dan keamanan tetap berbasis aturan deterministik.

Empat pemanggilan AI pada MVP:
1. Parsing aktivitas bahasa bebas dan draf Aturan Main (FR-07).
2. Penjelasan match dan icebreaker (FR-16).
3. **AI Safety Check** (FR-27): lapisan kedua filter chat yang menilai pesan mencurigakan yang lolos atau nyaris lolos pola teks, misalnya nomor telepon yang ditulis dengan kata ("nol delapan dua belas"), disisipi spasi atau titik, atau ajakan menekan untuk pindah ke luar platform sebelum meetup terkonfirmasi. Pesan yang dinilai berisiko ditahan dengan pengingat yang sama seperti FR-19. Pemanggilan ini hanya berjalan untuk pesan yang ditandai filter pola sebagai mencurigakan atau ambigu, bukan untuk semua pesan. Fallback bila AI tidak tersedia: hasil filter pola berlaku apa adanya.
4. **Rekomendasi konteks lokal** (FR-28): AI memilih dan menjelaskan tempat dari daftar kurasi tempat publik berdasarkan area, jam, budget, dan Aturan Main aktivitas (misalnya cocok untuk mengobrol setelah film). AI tidak boleh mengarang tempat di luar daftar kurasi. Fallback bila AI tidak tersedia: daftar kurasi ditampilkan menurut urutan default per area.

Yang dengan sengaja TIDAK dikerjakan AI: perhitungan skor match (deterministik agar dapat diaudit, terutama komponen preferensi gender), keputusan verifikasi identitas, dan keputusan penegakan aturan seperti block dan tindak lanjut report. Pada ketiganya AI paling jauh boleh memberi tanda, keputusan akhir mengikuti aturan dan status yang tercatat.

### 7.7 Mode tampilan (ditambahkan user 27 Okt 2026 malam)
- FR-29 Mode gelap (dark mode): seluruh aplikasi tersedia dalam mode terang dan mode gelap. Mode terang memakai latar cream #FFF6DC dengan teks navy #425B9A; mode gelap memakai latar navy #425B9A dengan teks cream #FFF6DC, mengikuti pemetaan warna di Layout Guide. Secara default mode mengikuti pengaturan sistem perangkat; user dapat menggantinya manual lewat toggle di top bar dan di pengaturan, dan pilihan manual tersimpan sebagai preferensi user.
- FR-30 Konsistensi aset per mode: logo dan aset brand mengikuti mode yang aktif. Mode gelap memakai lockup teks cream dan animasi versi latar navy; mode terang memakai lockup teks navy dan animasi versi latar cream; aset figur dan animasi transparan (APNG dan GIF) dipakai bersama untuk kedua mode. Aturan kontras di dokumen brand identity tetap berlaku di kedua mode, termasuk ketentuan bahwa teks di atas sky blue dan pink selalu navy.

## 8. Kebutuhan non-fungsional
- NFR-01 Privasi: data lokasi hanya berupa area kecamatan dan titik tengahnya; tidak ada pengumpulan koordinat presisi atau live location.
- NFR-02 Keamanan data: kata sandi dan data sensitif tidak disimpan dalam teks biasa; untuk produk nyata, data ID mengikuti kebijakan retensi di Bagian 6.2.
- NFR-03 Responsivitas: satu codebase web; tampilan aplikasi di bawah 1024 px, tampilan web normal pada 1024 px ke atas (lihat Layout Guide).
- NFR-04 Keandalan demo: keempat pemanggilan AI (parsing aktivitas, penjelasan match, AI Safety Check, rekomendasi konteks) masing-masing memiliki fallback non-AI agar demo tidak tergantung API live.
- NFR-05 Aksesibilitas: kontras mengikuti aturan WCAG yang tercatat di Brand Identity; target sentuh minimum 44 px.
- NFR-06 Bahasa: seluruh UI tersedia dalam Inggris (default) dan Indonesia; istilah kunci memiliki padanan resmi di dua bahasa.
- NFR-07 Keamanan aplikasi dan database: aturan privasi (penyembunyian nama, lokasi, waktu) ditegakkan di lapisan data melalui view dan Row Level Security, bukan hanya di tampilan; kunci API hanya berada di server; semua input tervalidasi di server; autentikasi memakai penyedia (Supabase Auth) dengan sesi cookie httpOnly; endpoint AI terotentikasi dan dibatasi lajunya per user; berkas sensitif berada di penyimpanan privat dengan URL bertanda tangan berumur pendek; header keamanan standar aktif dan seluruh trafik HTTPS.
- NFR-08 Penulisan UI: teks aplikasi tidak memakai emoji dan tidak memakai em-dash; penanda visual memakai ikon (set Lucide). Aturan ini berlaku juga untuk teks hasil AI yang ditampilkan ke user.

## 9. Alur utama (cerita demo)
1. Nadia (24, baru pindah ke Jakarta) mengetik: "Sabtu sore mau nonton di daerah Tebet, budget 100 ribuan, pengen teman yang asik diajak ngobrol setelah film."
2. AI concierge mengubahnya menjadi activity card terstruktur beserta draf Aturan Main.
3. Matching engine menampilkan 3 kandidat dengan skor, rincian, dan checklist syarat; daftar menghormati preferensi gender Nadia sebagai komponen tertinggi.
4. Nadia memilih kandidat verified dengan rating tinggi; sistem memberi icebreaker dan rekomendasi tempat publik yang dipilih serta dijelaskan AI dari daftar kurasi sesuai konteks aktivitasnya.
5. Chat singkat (filter info kontak aktif), lalu kedua pihak confirm meetup; titik temu persis terbuka dan Nadia membagikan rencana ke kontak terpercaya.
6. Setelah aktivitas, Nadia check-in pulang aman, lalu memberi feedback; trust score dan skor keandalan partner naik.

## 10. Risiko dan mitigasi ringkas
- Dikira dating app: ditutup dengan aktivitas yang selalu spesifik, opsi grup, tidak ada fitur romantis, istilah resmi "temen".
- Hasil match kosong karena syarat terlalu ketat: syarat wajib dibatasi maksimal 2 bidang, persona seeded dikelompokkan per zona, dan sistem menjelaskan bila hasil sedikit.
- Kegagalan API AI saat demo: fallback template dan penjelasan yang di-cache untuk skenario utama.
- Penyalahgunaan privasi oleh user jahat: verifikasi wajib, pengungkapan bertahap, filter info kontak, report dan block di alur utama.
