# UML Temenin
Versi 1.0, 27 Oktober 2026. Kumpulan diagram UML untuk MVP Temenin: Use Case Diagram (gabungan dan per peran: Pencari Temen dan Penemen), Class Diagram, Sequence Diagram, Activity Diagram (pengungkapan bertahap dan per peran), dan State Diagram.
Dokumen pendamping: PRD Temenin (kode FR), ERD Temenin, Rencana Pengembangan Temenin.
Konvensi: Use Case ditulis dalam sintaks PlantUML, diagram lain dalam sintaks Mermaid, keduanya dapat dirender di GitHub, VS Code, dan perangkat UML umum.

## 1. Use Case Diagram
Aktor: Pengguna (user terverifikasi maupun belum), AI Concierge (sistem eksternal), Sistem (proses internal terjadwal/otomatis).

```plantuml
@startuml
left to right direction
actor "Pengguna" as User
actor "AI Concierge" as AI
actor "Sistem" as Sys

rectangle "Temenin" {
  usecase "Daftar dan lolos gerbang usia 18+" as UC1
  usecase "Lengkapi profil dan kuis profil energi" as UC2
  usecase "Verifikasi identitas (simulasi)" as UC3
  usecase "Buat aktivitas (form)" as UC4
  usecase "Buat aktivitas (bahasa bebas)" as UC5
  usecase "Pasang Aturan Main" as UC6
  usecase "Simpan preferensi (Save Preference)" as UC7
  usecase "Jelajahi activity board" as UC8
  usecase "Lihat hasil match dan penjelasannya" as UC9
  usecase "Chat dengan partner" as UC10
  usecase "Konfirmasi meetup dua arah" as UC11
  usecase "Bagikan rencana ke kontak terpercaya" as UC12
  usecase "Check-in pulang aman" as UC13
  usecase "Beri feedback dan review" as UC14
  usecase "Report dan block user" as UC15
}

User --> UC1
User --> UC2
User --> UC3
User --> UC4
User --> UC5
UC5 ..> UC6 : <<include>>
UC4 ..> UC6 : <<include>>
UC6 ..> UC7 : <<extend>>
User --> UC8
User --> UC9
User --> UC10
User --> UC11
User --> UC12
User --> UC13
User --> UC14
User --> UC15
UC5 ..> AI : parsing kalimat
UC9 ..> AI : penjelasan dan icebreaker
Sys --> UC13 : memicu prompt setelah jam aktivitas
@enduml
```

Ringkasan use case dan kaitannya ke PRD:
- UC1–UC2: onboarding dan profil (FR-01, FR-02, FR-03).
- UC3: syarat sebelum match (FR-04).
- UC4–UC7: pembuatan aktivitas, Aturan Main, Save Preference (FR-06 sampai FR-11).
- UC8: activity board dengan tampilan berbasis verifikasi penampil (FR-12).
- UC9: matching dan penjelasan (FR-13 sampai FR-17).
- UC10–UC11: chat terfilter dan konfirmasi dua arah (FR-18, FR-19, FR-20).
- UC12–UC13: keamanan pertemuan (FR-21, FR-22).
- UC14: feedback, trust score, skor keandalan (FR-24, FR-25, FR-26).
- UC15: report dan block (FR-23).

### 1.1 Use Case Diagram per peran: Pencari Temen (pemosting aktivitas)
Peran ini membuat aktivitas dan memilih siapa yang menemaninya.

```plantuml
@startuml
left to right direction
actor "Pencari Temen" as Seeker
actor "AI Concierge" as AI
actor "Matching Engine" as ME

rectangle "Temenin - sisi Pencari Temen" {
  usecase "Buat aktivitas (form)" as S1
  usecase "Buat aktivitas (bahasa bebas)" as S2
  usecase "Pasang Aturan Main" as S3
  usecase "Simpan preferensi (Save Preference)" as S4
  usecase "Lihat daftar match dan checklist syarat" as S5
  usecase "Pilih kandidat temen" as S6
  usecase "Chat dengan kandidat" as S7
  usecase "Konfirmasi meetup (pihak pemosting)" as S8
  usecase "Bagikan rencana ke kontak terpercaya" as S9
  usecase "Check-in pulang aman" as S10
  usecase "Beri feedback ke penemen" as S11
  usecase "Report dan block" as S12
}

Seeker --> S1
Seeker --> S2
S1 ..> S3 : <<include>>
S2 ..> S3 : <<include>>
S3 ..> S4 : <<extend>>
Seeker --> S5
Seeker --> S6
Seeker --> S7
Seeker --> S8
Seeker --> S9
Seeker --> S10
Seeker --> S11
Seeker --> S12
S2 ..> AI : parsing kalimat dan draf Aturan Main
S5 ..> ME : menghitung skor dan checklist
S5 ..> AI : penjelasan match dan icebreaker
@enduml
```

### 1.2 Use Case Diagram per peran: Penemen (yang mau menemani)
Peran ini menemukan aktivitas orang lain dan menawarkan diri untuk menemani. Mekanisme keterlibatannya: penemen menekan tombol "Mau Menemani" pada sebuah aktivitas untuk masuk ke kolam kandidat pemosting (dengan prioritas dari mesin pencocokan), lalu menerima atau menolak undangan match dari pemosting. Ini penjabaran dari kemampuan "menerima permintaan match" pada FR-04.

```plantuml
@startuml
left to right direction
actor "Penemen" as Buddy
actor "Matching Engine" as ME
actor "Sistem" as Sys

rectangle "Temenin - sisi Penemen" {
  usecase "Jelajahi activity board" as B1
  usecase "Lihat detail aktivitas sesuai status verifikasi" as B2
  usecase "Baca Aturan Main dan checklist kecocokan diri" as B3
  usecase "Nyatakan mau menemani" as B4
  usecase "Terima undangan match dari pemosting" as B5
  usecase "Chat dengan pemosting" as B6
  usecase "Konfirmasi meetup (pihak penemen)" as B7
  usecase "Lihat titik temu setelah confirm dua arah" as B8
  usecase "Check-in pulang aman" as B9
  usecase "Beri feedback ke pemosting" as B10
  usecase "Lihat trust score dan skor keandalan sendiri" as B11
  usecase "Report dan block" as B12
}

Buddy --> B1
Buddy --> B2
Buddy --> B3
Buddy --> B4
Buddy --> B5
Buddy --> B6
Buddy --> B7
Buddy --> B8
Buddy --> B9
Buddy --> B10
Buddy --> B11
Buddy --> B12
B4 ..> ME : masuk kolam kandidat pemosting
B2 ..> Sys : field sensitif disaring menurut verifikasi penampil
Sys --> B9 : memicu prompt setelah jam aktivitas
@enduml
```

Use case yang dipakai bersama oleh kedua peran (tidak digambar ulang di dua diagram peran): pendaftaran dan gerbang usia 18+ (UC1), lengkapi profil dan kuis profil energi (UC2), dan verifikasi identitas (UC3). Keduanya adalah syarat sebelum peran mana pun dapat berjalan penuh.

## 2. Class Diagram (Mermaid)
Kelas di bawah ini sejajar satu-satu dengan entitas ERD; atribut diringkas ke yang relevan untuk perilaku sistem.

```mermaid
classDiagram
    class Area {
        +String name
        +String city
        +Float centerLat
        +Float centerLng
        +distanceBandTo(Area) Band
    }
    class User {
        +String name
        +Gender gender
        +Date birthDate
        +String mbti
        +EnergyProfile energyProfile
        +VerificationStatus verificationStatus
        +Float trustScore
        +Float reliabilityScore
        +isAdult() Boolean
        +canMatch() Boolean
    }
    class Verification {
        +Method method
        +Status status
        +submit()
        +approve()
    }
    class SavedPreference {
        +ChatLevel chatLevel
        +GenderPreference genderPreference
        +RadiusOption radiusOption
        +applyTo(ActivityRules)
    }
    class Activity {
        +Category category
        +String description
        +DateTime startsAt
        +String venueName
        +Status status
        +visibleFieldsFor(User viewer) List
    }
    class ActivityRules {
        +ChatLevel chatLevel
        +MbtiPreference mbtiPreference
        +RadiusOption radiusOption
        +GenderPreference genderPreference
        +countRequiredFields() Integer
    }
    class Match {
        +Float scoreGender
        +Float scoreInterest
        +Float scoreEnergy
        +Float scoreContext
        +Float scoreTrust
        +Float totalScore()
        +List rulesChecklist
        +String explanation
    }
    class MatchingEngine {
        +rank(Activity, List~User~) List~Match~
        +explain(Match) String
    }
    class AIConcierge {
        +parseActivity(String text) ActivityDraft
        +draftRules(String text) ActivityRules
        +explainMatch(Match) String
    }
    class Message {
        +String body
        +Boolean heldByFilter
    }
    class ContactFilter {
        +inspect(Message) FilterResult
    }
    class Meetup {
        +String venueName
        +DateTime scheduledAt
        +confirmBy(User)
        +isFullyConfirmed() Boolean
        +exactVenueVisible() Boolean
    }
    class SafetyCheckin {
        +Status status
        +respond(Status)
    }
    class Review {
        +Integer rating
        +List tags
        +Boolean reportedNoShow
    }
    class TrustScoreUpdater {
        +applyReview(Review)
        +applyNoShow(Review)
    }

    User "1" -- "1" Area : domisili
    User "1" -- "0..*" Verification
    User "1" -- "1" SavedPreference
    User "1" -- "0..*" Activity : membuat
    Activity "1" -- "1" ActivityRules
    Activity "1" -- "0..*" Match
    User "1" -- "0..*" Match : kandidat
    MatchingEngine ..> Match : menghasilkan
    MatchingEngine ..> AIConcierge : memakai
    AIConcierge ..> Activity : draf dari teks
    Match "1" -- "0..*" Message
    ContactFilter ..> Message : memeriksa
    Match "1" -- "0..1" Meetup
    Meetup "1" -- "0..*" SafetyCheckin
    User "1" -- "0..*" Review : menulis
    Review ..> TrustScoreUpdater : memicu
    TrustScoreUpdater ..> User : memperbarui skor
```

Perilaku penting yang diwakili diagram:
- `Activity.visibleFieldsFor(viewer)` menerapkan aturan privasi FR-12: penampil belum terverifikasi hanya menerima deskripsi.
- `Meetup.exactVenueVisible()` hanya benar bila kedua pihak sudah confirm (FR-20).
- `ContactFilter` berdiri di jalur pengiriman `Message` sebelum meetup terkonfirmasi (FR-19).

## 3. Sequence Diagram: alur demo utama (Mermaid)

```mermaid
sequenceDiagram
    actor Nadia as Nadia (User)
    participant UI as Web App
    participant AI as AI Concierge
    participant ME as Matching Engine
    participant DB as Data (Seeded)
    participant Partner as Partner Terpilih

    Nadia->>UI: Ketik aktivitas bahasa bebas
    UI->>AI: parseActivity(teks)
    AI-->>UI: Activity card + draf Aturan Main
    Nadia->>UI: Koreksi, centang Save Preference, posting
    UI->>DB: Simpan Activity + ActivityRules (+ SavedPreference)
    UI->>ME: rank(activity)
    ME->>DB: Ambil kandidat terverifikasi
    ME->>ME: Hitung 5 komponen skor dan checklist syarat
    ME->>AI: explainMatch(match teratas)
    AI-->>ME: Penjelasan + icebreaker (atau fallback cache)
    ME-->>UI: 3 kandidat terurut + rincian
    Nadia->>UI: Pilih kandidat verified
    UI->>Partner: Buka chat
    Nadia->>UI: Kirim pesan berisi nomor HP
    UI->>UI: ContactFilter menahan pesan, tampilkan pengingat
    Nadia->>UI: Centang safety checklist dan confirm
    Partner->>UI: Confirm juga
    UI-->>Nadia: Titik temu persis terbuka
    Nadia->>UI: Bagikan rencana ke kontak terpercaya (simulasi)
    Note over UI: Jam aktivitas selesai
    UI-->>Nadia: Prompt check-in "Sudah pulang aman?"
    Nadia->>UI: Konfirmasi aman + beri rating dan tag
    UI->>DB: Perbarui trust score dan skor keandalan partner
```

## 4. Activity Diagram: verifikasi dan pengungkapan bertahap (Mermaid)

```mermaid
flowchart TD
    A[Mulai: user membuka postingan aktivitas] --> B{Penampil sudah verifikasi ID?}
    B -- Belum --> C[Tampilkan HANYA deskripsi]
    C --> D[Nama tampil titik-titik, avatar inisial generik]
    D --> E[Lokasi dan waktu diganti penanda: Tampil setelah verifikasi]
    E --> F[Ajak user verifikasi ID]
    F --> G[User menjalani verifikasi simulasi]
    G --> H{Verifikasi disetujui?}
    H -- Tidak --> C
    H -- Ya --> I[Status verified, badge aktif]
    B -- Sudah --> I
    I --> J[Tampilkan nama, area, waktu, dan pita jarak]
    J --> K{Kedua pihak sudah confirm meetup?}
    K -- Belum --> L[Titik temu persis masih tersembunyi]
    K -- Ya --> M[Titik temu persis terbuka untuk kedua pihak]
```

### 4.1 Activity Diagram per peran: Pencari Temen (pemosting aktivitas)

```mermaid
flowchart TD
    A[Mulai: pencari temen masuk aplikasi] --> B{Sudah verifikasi ID?}
    B -- Belum --> C[Jalani verifikasi simulasi dulu untuk bisa match]
    C --> D[Buat aktivitas]
    B -- Sudah --> D
    D --> E{Cara membuat?}
    E -- Form --> F[Isi form aktivitas]
    E -- Bahasa bebas --> G[Ketik kalimat bebas]
    G --> H[AI Concierge membuat activity card dan draf Aturan Main]
    F --> I[Atur Aturan Main]
    H --> I
    I --> J{Ada preferensi tersimpan?}
    J -- Ya --> K[Aturan Main terisi dari Save Preference, sesuaikan bila perlu]
    J -- Tidak --> L[Isi Aturan Main manual]
    K --> M{Simpan sebagai preferensi?}
    L --> M
    M -- Ya --> N[Centang Save Preference]
    M -- Tidak --> O[Posting aktivitas]
    N --> O
    O --> P[Matching Engine menghitung skor lima komponen]
    P --> Q{Ada kandidat yang memenuhi syarat?}
    Q -- Tidak --> R[Longgarkan Aturan Main atau tunggu kandidat baru]
    R --> I
    Q -- Ya --> S[Lihat daftar match, checklist syarat, dan penjelasan AI]
    S --> T[Pilih kandidat]
    T --> U[Chat, filter kontak dan AI Safety Check aktif]
    U --> V[Centang safety checklist dan confirm meetup]
    V --> W{Penemen juga confirm?}
    W -- Belum atau menolak --> S
    W -- Ya --> X[Titik temu persis terbuka]
    X --> Y[Bagikan rencana ke kontak terpercaya]
    Y --> Z[Aktivitas berlangsung]
    Z --> AA[Check-in sudah pulang aman]
    AA --> AB[Beri feedback: rating, tag, review]
    AB --> AC[Selesai]
```

### 4.2 Activity Diagram per peran: Penemen (yang mau menemani)

```mermaid
flowchart TD
    A[Mulai: penemen masuk aplikasi] --> B{Jelajahi activity board}
    B --> C{Sudah verifikasi ID?}
    C -- Belum --> D[Hanya deskripsi yang terlihat, nama lokasi waktu terkunci]
    D --> E[Jalani verifikasi untuk membuka detail dan bisa menemani]
    E --> F[Lihat detail aktivitas lengkap dengan pita jarak]
    C -- Sudah --> F
    F --> G[Baca Aturan Main dan checklist kecocokan diri]
    G --> H{Merasa cocok dan bersedia?}
    H -- Tidak --> B
    H -- Ya --> I[Ketuk tombol Mau Menemani]
    I --> J[Masuk kolam kandidat pemosting dengan prioritas mesin pencocokan]
    J --> K{Pemosting memilih penemen ini?}
    K -- Tidak --> B
    K -- Ya --> L[Tinjau undangan match dan profil pemosting]
    L --> M{Terima undangan?}
    M -- Tolak --> B
    M -- Terima --> N[Chat, filter kontak dan AI Safety Check aktif]
    N --> O[Centang safety checklist dan confirm meetup]
    O --> P{Pemosting juga confirm?}
    P -- Belum --> Q[Titik temu persis masih tersembunyi, menunggu]
    Q --> P
    P -- Ya --> R[Titik temu persis terbuka]
    R --> S[Hadiri aktivitas di tempat publik]
    S --> T[Check-in sudah pulang aman]
    T --> U[Beri feedback ke pemosting]
    U --> V[Trust score dan skor keandalan sendiri diperbarui dari feedback pemosting]
    V --> W[Selesai]
```

Perbedaan kunci kedua peran: pencari temen memegang kendali memilih kandidat dan memasang Aturan Main, sedangkan penemen memegang kendali menerima atau menolak undangan. Kendali keamanan dibagi rata: checklist, confirm, dan check-in wajib dilakukan kedua pihak, dan titik temu persis hanya terbuka bila keduanya sudah confirm.

## 5. State Diagram: siklus hidup aktivitas (Mermaid)

```mermaid
stateDiagram-v2
    [*] --> Open: aktivitas diposting
    Open --> Matched: kandidat dipilih
    Matched --> Confirmed: kedua pihak confirm meetup
    Confirmed --> Completed: aktivitas selesai dan check-in aman
    Open --> Cancelled: dibatalkan pembuat
    Matched --> Cancelled: dibatalkan salah satu pihak
    Confirmed --> Cancelled: dibatalkan sebelum jam mulai
    Confirmed --> NoShow: dilaporkan tidak hadir
    Completed --> [*]
    Cancelled --> [*]
    NoShow --> [*]
```

Transisi Completed dan NoShow adalah pemicu pembaruan skor keandalan pada FR-26.
