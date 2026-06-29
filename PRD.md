# PRD — Musician Landing Page
### "SOUNDFORM" · Personal Artist Web Platform

**Versi:** 1.0  
**Tanggal:** Juni 2026  
**Status:** Draft Final  
**Penulis:** Product & Design Team

---

## 1. Ringkasan Produk (Product Overview)

**SOUNDFORM** adalah sebuah web platform personal untuk seorang musisi independen yang berfungsi sebagai etalase digital: pengunjung datang, mendengar musik langsung di browser, lalu merasakan dunia artistik sang musisi melalui tipografi eksperimental yang hidup. Platform ini bukan sekadar portofolio — ia adalah *ruang pertunjukan digital* yang menempatkan musik dan identitas visual sang musisi sebagai satu kesatuan yang tidak bisa dipisahkan.

### 1.1 Pernyataan Masalah

Musisi independen kehilangan peluang promosi karena:
- Streaming platform (Spotify, SoundCloud) tidak memberi ruang branding personal yang penuh kendali
- Website template yang ada terasa generik dan tidak mencerminkan kepribadian artistik
- Tidak ada titik temu antara *visual identity* kuat dan *audio experience* di satu URL

### 1.2 Solusi

Website landing page dengan:
- **Tipografi Eksperimental** sebagai identitas visual utama yang bergerak dan bereaksi
- **Audio Player custom** terintegrasi langsung dalam halaman tanpa redirect
- **Admin Panel CRUD** untuk musisi mengelola lagu, bio, dan konten sendiri
- Desain yang terasa seperti *art installation*, bukan template biasa

---

## 2. Tujuan Produk (Goals & Objectives)

### OKRs

| Objective | Key Result |
|---|---|
| Tingkatkan engagement pengunjung | Session duration > 3 menit (karena ada musik yang dimainkan) |
| Bangun identitas artistik yang kuat | Bounce rate < 40% pada bulan pertama |
| Permudah pembaruan konten | Musisi bisa upload lagu baru < 5 menit tanpa developer |
| Tingkatkan konversi booking/kolaborasi | CTR tombol kontak > 8% dari total visit |

### Non-Goals
- Bukan platform streaming publik (bukan pesaing Spotify)
- Bukan e-commerce (tidak ada penjualan merch langsung di fase pertama)
- Bukan multi-artist platform

---

## 3. Pengguna Target (Target Users)

### 3.1 End User — Pengunjung Web

**Persona A — The Curious Listener**  
Usia 18–35, digital native, dikirim link web ini lewat Instagram story atau WhatsApp. Dia tidak kenal musisinya secara personal, datang dengan sedikit ekspektasi. Butuh *hook* pertama dalam 5 detik.

**Persona B — The Industry Contact**  
Kurator playlist, booking agent, atau jurnalis musik. Butuh informasi cepat: siapa ini, genre apa, ada cara kontak tidak? Tidak mau scroll jauh hanya untuk menemukan link SoundCloud.

**Persona C — The Fan**  
Sudah tahu musiknya, datang untuk menikmati dan mungkin share. Mau fitur yang *satisfying* — animasi yang responsif, player yang enak dipakai.

### 3.2 Admin User — Musisi Sendiri

**Persona D — The Musician as Author**  
Musisi itu sendiri. Non-developer, tapi cukup melek teknologi untuk upload file dan isi form. Butuh antarmuka admin yang bersih, bebas hambatan teknis, dan bisa diakses dari HP.

---

## 4. Design System — Experimental Type

> *"Tipografi bukan kendaraan pesan. Di sini, tipografi adalah pertunjukannya."*

### 4.1 Konsep Desain — Typographic Performance

Konsep **Experimental Type** dalam konteks musik ini dioperasionalisasikan sebagai **Audio-Reactive Typography** — huruf-huruf tidak statis, mereka *bernapas*, *bergetar*, dan *merespons* apakah musik sedang diputar atau tidak. Ini bukan efek dekoratif; ini narasi visual: *ketika musik hidup, huruf hidup.*

Selain reaktivitas audio, digunakan teknik tipografi eksperimental berikut:

| Teknik | Implementasi | Lokasi |
|---|---|---|
| **Variable Font Modulation** | `font-weight` axis dimodulasi oleh Web Audio API amplitude. Huruf menggembung saat bassline hit. | Hero Section |
| **Oversized Bleed Type** | Nama musisi dicetak dalam ukuran raksasa (24–32vw) sehingga terpotong tepi layar — mengisyaratkan bahwa identitasnya *melebihi frame* | Hero |
| **Character Stagger Animation** | Setiap karakter muncul satu per satu dengan timing offset berbasis kurva ease custom, bukan linear | Page Load |
| **Text-as-Texture** | Background section tertentu diisi dengan lirik lagu dalam ukuran sangat kecil (6px) membentuk pola visual | Album/Track Section |
| **Glitch Scramble** | Pada hover nama track, huruf-huruf "acak" (Fisher-Yates shuffle) lalu "membentuk kembali" ke nama asli dalam 400ms | Tracklist |
| **Kinetic Marquee** | Genre, tag, dan mood berjalan horizontal seperti ticker — tapi kecepatan dipengaruhi oleh BPM lagu aktif | Bottom Bar |

### 4.2 Sistem Warna (Color Tokens)

Palet dirancang untuk menghindari klise *dark + acid green* yang generik untuk web musik. Dipilih suasana **Warm Underground** — seperti interior studio rekaman lama yang remang, hangat, dan intim:

```
--color-bg:        #0C0A07   /* Pitch Warm Black — bukan hitam murni, ada warmth */
--color-surface:   #161410   /* Raised Surface */
--color-border:    #2A2520   /* Subtle separator */
--color-text-hi:   #F0EBE3   /* Warm Off-White — bukan putih steril */
--color-text-lo:   #7A736B   /* Muted text */
--color-accent:    #E8420A   /* Vermillion — seperti lampu rekaman ON AIR */
--color-accent-2:  #5C4AE4   /* Deep Electric Violet — secondary accent */
--color-player:    #1A1714   /* Player bar background */
```

**Signature Palette**: Tidak ada biru, tidak ada hijau. Spektrum hangat (hitam-oranye-ungu) menciptakan rasa *membara dari dalam* — seperti amplifier yang panas.

### 4.3 Sistem Tipografi (Type System)

**Display Face — `Unbounded`** (Google Fonts, Variable)  
Lebar ekstrem (ultra-wide), karakter kapital yang agresif. Digunakan untuk nama musisi, judul lagu, dan section headers besar. Dipilih karena bentuknya memancarkan *kepercayaan diri tanpa kompromi* — dan bekerja dengan baik saat di-bleed off-screen.

**Body / Mono Face — `Space Mono`** (Google Fonts)  
Monospaced yang punya karakter kuat. Digunakan untuk bio, deskripsi, metadata (durasi lagu, BPM, tahun rilis). Kontras monospaced-vs-wide antara Space Mono dan Unbounded menciptakan *tegangan visual* yang produktif.

**Italic Accent — `Instrument Serif Italic`** (Google Fonts)  
Digunakan hanya untuk pull quotes dari lirik atau pernyataan artistik. Kehadirannya langka membuat ia terasa berharga.

```
/* Type Scale */
--type-hero:      clamp(18vw, 24vw, 32vw)   /* Nama musisi — bleed ke luar frame */
--type-title:     clamp(3.5rem, 8vw, 9rem)  /* Section titles */
--type-subtitle:  clamp(1.5rem, 3vw, 2.5rem)
--type-body:      1rem / 1.7                 /* Body text */
--type-micro:     0.75rem                   /* Metadata, labels */
--type-quote:     clamp(1.8rem, 4vw, 3rem)  /* Lyric quotes */
```

### 4.4 Motion System

```
/* Easing */
--ease-snap:    cubic-bezier(0.25, 1, 0.5, 1)   /* Karakter type animation */
--ease-glitch:  steps(4, end)                    /* Glitch scramble */
--ease-smooth:  cubic-bezier(0.4, 0, 0.2, 1)    /* Scroll reveals */

/* Durations */
--dur-char:     40ms       /* Per-karakter stagger delay */
--dur-glitch:   400ms      /* Scramble to resolve */
--dur-reveal:   800ms      /* Section reveal */
--dur-fade:     300ms      /* Hover transitions */
```

**Reduced Motion**: Seluruh animasi `font-weight`, karakter stagger, dan glitch dibungkus dalam `@media (prefers-reduced-motion: no-preference)`. Pengguna dengan setting reduced motion mendapat versi statik yang tetap elegan.

---

## 5. Arsitektur Teknis (Technical Architecture)

### 5.1 Stack Teknologi

```
Frontend
├── Framework        : Next.js 14 (App Router)
├── Language         : TypeScript
├── Styling          : Tailwind CSS + Custom CSS Variables
├── Animation        : Framer Motion (scroll reveals, page transitions)
│                      + Web Animations API (karakter stagger native)
├── Audio Engine     : Howler.js (cross-browser audio playback)
│                      + Web Audio API (AnalyserNode untuk reaktivitas)
└── State Management : Zustand (global audio state)

Backend
├── API Layer        : Next.js Route Handlers (App Router)
├── ORM              : Prisma
├── Database         : PostgreSQL (via Supabase)
├── Auth (Admin)     : NextAuth.js v5 + Credentials Provider
├── File Storage     : Supabase Storage Buckets
└── Validation       : Zod

Infrastructure
├── Hosting          : Vercel (Frontend + API)
├── Database         : Supabase (PostgreSQL + Storage)
├── CDN              : Vercel Edge Network (audio file streaming)
└── CI/CD            : GitHub Actions → Vercel
```

### 5.2 Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT BROWSER                        │
│                                                             │
│   ┌───────────┐   ┌─────────────┐   ┌──────────────────┐  │
│   │  Hero +   │   │   Audio     │   │   Tracklist +    │  │
│   │  Exp Type │   │   Player    │   │   About/Contact  │  │
│   └─────┬─────┘   └──────┬──────┘   └────────┬─────────┘  │
│         │                │                    │            │
│         └────────────────┼────────────────────┘            │
│                          │ Zustand Global State            │
└──────────────────────────┼──────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │   Next.js API Routes    │
              │   /api/tracks           │
              │   /api/albums           │
              │   /api/bio              │
              │   /api/upload           │
              │   /api/auth             │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │        Prisma ORM       │
              └────────────┬────────────┘
                      ┌────┴────┐
                      │         │
           ┌──────────▼──┐  ┌──▼──────────────┐
           │  Supabase   │  │ Supabase Storage │
           │  PostgreSQL │  │ (Audio + Images) │
           └─────────────┘  └─────────────────┘
```

### 5.3 Struktur Folder Proyek

```
soundform/
├── app/
│   ├── (public)/
│   │   ├── page.tsx              # Landing page utama
│   │   ├── layout.tsx
│   │   └── components/
│   │       ├── HeroSection.tsx
│   │       ├── AudioPlayer.tsx
│   │       ├── Tracklist.tsx
│   │       ├── AboutSection.tsx
│   │       ├── ContactSection.tsx
│   │       └── type/
│   │           ├── GlitchText.tsx
│   │           ├── KineticTitle.tsx
│   │           ├── AudioReactiveText.tsx
│   │           └── CharStagger.tsx
│   ├── (admin)/
│   │   ├── admin/
│   │   │   ├── page.tsx          # Admin dashboard
│   │   │   ├── tracks/page.tsx
│   │   │   ├── albums/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── login/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── tracks/
│       │   ├── route.ts          # GET (list), POST (create)
│       │   └── [id]/route.ts     # GET, PUT, DELETE
│       ├── albums/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── bio/route.ts
│       └── upload/route.ts
├── lib/
│   ├── prisma.ts
│   ├── supabase.ts
│   ├── audio-store.ts            # Zustand store
│   └── utils.ts
├── prisma/
│   └── schema.prisma
├── public/
│   └── fonts/
└── styles/
    ├── globals.css
    └── tokens.css
```

---

## 6. Skema Database (Database Schema)

```prisma
// prisma/schema.prisma

model Admin {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hashed
  createdAt DateTime @default(now())
}

model Artist {
  id          String  @id @default(cuid())
  name        String
  tagline     String  // "Lo-fi soul. Garage punk. All yours."
  bio         String  @db.Text
  photoUrl    String?
  genre       String[]
  socialLinks Json    // { instagram, spotify, youtube, tiktok }
  updatedAt   DateTime @updatedAt
}

model Album {
  id          String   @id @default(cuid())
  title       String
  coverUrl    String?
  releaseDate DateTime
  description String?  @db.Text
  tracks      Track[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Track {
  id          String   @id @default(cuid())
  title       String
  audioUrl    String                  // Supabase Storage URL
  duration    Int                     // dalam detik
  bpm         Int?
  key         String?                 // e.g., "A Minor"
  mood        String[]                // ["melancholic", "cinematic"]
  lyrics      String?  @db.Text
  isPublished Boolean  @default(false)
  sortOrder   Int      @default(0)   // urutan di tracklist
  albumId     String?
  album       Album?   @relation(fields: [albumId], references: [id])
  playCount   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Contact {
  id        String   @id @default(cuid())
  name      String
  email     String
  subject   String
  message   String   @db.Text
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

---

## 7. API Endpoints

### 7.1 Public Endpoints (Tanpa Auth)

| Method | Endpoint | Deskripsi | Response |
|---|---|---|---|
| `GET` | `/api/tracks` | Daftar semua track yang dipublish, terurut by `sortOrder` | `Track[]` |
| `GET` | `/api/tracks/:id` | Detail satu track | `Track` |
| `GET` | `/api/albums` | Daftar semua album | `Album[]` |
| `GET` | `/api/albums/:id` | Detail album + tracks di dalamnya | `Album & { tracks: Track[] }` |
| `GET` | `/api/bio` | Data artistik lengkap (name, bio, socials) | `Artist` |
| `POST` | `/api/tracks/:id/play` | Increment play count | `{ playCount: number }` |
| `POST` | `/api/contact` | Submit pesan kontak | `{ success: true }` |

### 7.2 Admin Endpoints (Butuh Auth Token)

#### Tracks

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/tracks` | Upload track baru + file audio |
| `PUT` | `/api/tracks/:id` | Update metadata track |
| `PUT` | `/api/tracks/:id/publish` | Toggle published status |
| `PUT` | `/api/tracks/reorder` | Update `sortOrder` (drag & drop) |
| `DELETE` | `/api/tracks/:id` | Hapus track + file dari storage |

#### Albums

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/albums` | Buat album baru |
| `PUT` | `/api/albums/:id` | Update data album |
| `DELETE` | `/api/albums/:id` | Hapus album (tracks jadi unlinked) |

#### Artist & Upload

| Method | Endpoint | Deskripsi |
|---|---|---|
| `PUT` | `/api/bio` | Update bio, foto, social links |
| `POST` | `/api/upload` | Upload file ke Supabase Storage |
| `GET` | `/api/admin/contacts` | Lihat semua pesan masuk |
| `PUT` | `/api/admin/contacts/:id/read` | Tandai pesan sudah dibaca |

### 7.3 Contoh Request/Response

**GET /api/tracks**
```json
[
  {
    "id": "clx123abc",
    "title": "Hollow Signal",
    "audioUrl": "https://storage.supabase.co/...",
    "duration": 213,
    "bpm": 92,
    "key": "C Minor",
    "mood": ["melancholic", "ambient"],
    "isPublished": true,
    "sortOrder": 1,
    "playCount": 4821,
    "album": {
      "id": "clx456def",
      "title": "Static Dreams",
      "coverUrl": "https://storage.supabase.co/..."
    }
  }
]
```

**POST /api/tracks** (Admin, multipart/form-data)
```json
{
  "title": "Hollow Signal",
  "bpm": 92,
  "key": "C Minor",
  "mood": ["melancholic", "ambient"],
  "lyrics": "...",
  "albumId": "clx456def",
  "audioFile": "[binary]"
}
```

---

## 8. Spesifikasi Fitur (Feature Specifications)

### 8.1 Halaman Publik (Landing Page)

#### F-01: Hero Section — Audio-Reactive Typographic Stage

**Deskripsi**: Bagian pertama yang dilihat pengunjung. Nama musisi dicetak besar dalam font `Unbounded` dengan ukuran 24–32vw, dibleed ke sisi kiri dan kanan layar. Di belakangnya, background hitam hangat tanpa dekorasi berlebihan.

**Behavior**:
- Saat halaman load: karakter nama musisi muncul satu per satu dari kiri ke kanan dengan stagger delay 40ms per karakter, ease `cubic-bezier(0.25, 1, 0.5, 1)` 
- Saat musik **tidak** diputar: font-weight stabil di `900`
- Saat musik **diputar**: Web Audio API `AnalyserNode` membaca amplitude rata-rata setiap `requestAnimationFrame`. Nilai amplitude (0–255) dipetakan ke rentang font-weight `400–900` secara real-time
- Saat hover nama: huruf-huruf "scramble" (random character) selama 200ms lalu *resolve* kembali ke nama asli
- Scroll ke bawah: nama musisi melakukan parallax (scroll 40% lebih lambat dari konten)

**Tech Notes**:
```
Web Audio API chain:
AudioContext → MediaElementSource → AnalyserNode → destination

rAF loop:
analyser.getByteFrequencyData(dataArray)
const avg = dataArray.reduce((a,b) => a+b) / dataArray.length
const weight = Math.round(400 + (avg/255) * 500)
titleEl.style.fontVariationSettings = `'wght' ${weight}`
```

**CTA**: Satu tombol besar di bawah nama: `▶ DENGARKAN` yang memulai track pertama dan auto-scroll ke player section.

---

#### F-02: Persistent Audio Player

**Deskripsi**: Player audio custom yang *sticky* di bagian bawah viewport, selalu terlihat saat pengguna scroll. Bukan embed SoundCloud/Spotify.

**Komponen Player**:
```
┌────────────────────────────────────────────────────────────────────┐
│  ▶  ◀◀  ▶▶   [Cover Art 40x40]  Hollow Signal  —  Static Dreams  │
│  ══════════════════════◉══════════════   02:14 / 03:33            │
│  [vol ══◉] [shuffle] [repeat]                         [tracklist] │
└────────────────────────────────────────────────────────────────────┘
```

**Fitur Player**:
- Play/Pause, Skip Next/Prev
- Progress bar yang bisa di-drag (seekable)
- Volume control
- Shuffle mode
- Repeat (off / repeat-one / repeat-all)
- Keyboard shortcut: `Space` = play/pause, `→` = +10s, `←` = -10s, `N` = next
- Tampilan nama track dengan animasi *marquee* jika nama terlalu panjang
- Pada mobile: player menjadi mini bar di bottom dengan swipe-up untuk expand
- Visualizer mini di belakang progress bar: 20 kolom bar frekuensi kecil yang animasi

**Howler.js Config**:
```js
const sound = new Howl({
  src: [track.audioUrl],
  format: ['mp3', 'wav'],
  html5: true,        // streaming, tidak tunggu full download
  volume: 0.8,
  onplay: () => updateAudioReactiveUI(),
  onend: () => playNext(),
});
```

---

#### F-03: Tracklist Section

**Deskripsi**: Daftar semua lagu yang dipublish. Ini adalah stage kedua dari tipografi eksperimental.

**Layout**:
```
TRACKS ─────────────────────────────────────
01  HOLLOW SIGNAL              03:33   ▶
02  STATIC DREAMS EP           04:12   ▶
03  RADIO GHOST                02:58   ▶
─────────────────────────────────────────────
```

**Behavior**:
- Setiap nomor urut: font-size `clamp(5rem, 10vw, 8rem)`, opacity `0.08` — membentuk *texture numerik* di latar
- Nama track: `Unbounded` 700, ukuran `1.5rem`
- Hover pada track: nama track "scramble" ke random chars, lalu resolve ke nama asli dalam 400ms. Background row: gradient tipis ke kanan dari `transparent` ke `rgba(232,66,10,0.06)`
- Track yang sedang aktif: accent vermillion pada nomor dan garis tipis di kiri row
- Klik mana saja pada row: langsung play track tersebut
- Scroll reveal: setiap row muncul dari bawah dengan stagger 80ms per item

---

#### F-04: About / Bio Section

**Deskripsi**: Cerita di balik musisi. Didesain sebagai *editorial spread*.

**Layout**:
```
┌─────────────────────────────────────────────┐
│                                             │
│  ╔═══════════════╗                          │
│  ║  Artist Photo ║   "Ada sesuatu yang      │
│  ║  (400x500)    ║    perlu dikatakan       │
│  ╚═══════════════╝    lewat bunyi."         │
│                                             │
│  Bio text in Space Mono — 2 kolom di       │
│  desktop, 1 kolom di mobile                 │
│                                             │
│  Genre: AMBIENT · GARAGE · SOUL            │
│  Kota: Jakarta, Indonesia                   │
│                                             │
│  [Instagram] [Spotify] [YouTube]            │
└─────────────────────────────────────────────┘
```

**Signature Type Element di Bio**: Pull quote dari bio/lirik dirender dalam `Instrument Serif Italic`, ukuran `clamp(1.8rem, 4vw, 3rem)`, warna `--color-accent`. Ini satu-satunya elemen serif di seluruh halaman — kemunculannya terasa seperti *tanda tangan*.

---

#### F-05: Lyric Pull-Quote Section (Opsional, tapi Direkomendasikan)

**Deskripsi**: Section di antara Tracklist dan About yang menampilkan satu baris lirik paling ikonik dari lagu unggulan.

**Visual**: Lirik dalam `Instrument Serif Italic` berukuran sangat besar (hampir hero-sized), di latar teks mikro bertumpuk (lirik penuh ditulis dalam `0.5rem`, membentuk tekstur visual). Efek: teks besar "tumbuh" dari lautan kata-kata kecil.

---

#### F-06: Contact Section

**Form fields**:
- Nama
- Email
- Subjek (dropdown: Kolaborasi / Booking / Media / Lainnya)
- Pesan

**Behavior**:
- Submit: POST ke `/api/contact`, simpan ke database
- Success state: label "PESAN TERKIRIM" muncul dengan animasi char-stagger
- Form validation: Zod schema, error message muncul inline dengan animasi shake
- Anti-spam: Honeypot field + rate limiting (max 3 submit per IP per jam)

---

### 8.2 Admin Panel — CRUD Dashboard

Diakses melalui `/admin`, dilindungi oleh session auth NextAuth.js.

#### F-07: Admin Login

- Route: `/admin/login`
- Input: email + password
- Auth: NextAuth.js Credentials Provider + bcrypt
- Session: JWT, expire 24 jam
- Gagal login 5x berturut-turut: lockout 15 menit

#### F-08: Dashboard Overview

Tampilan setelah login. Menampilkan:
- Total track published / draft
- Total play count hari ini vs kemarin
- Pesan kontak yang belum dibaca (badge merah)
- Shortcut: `+ Upload Track Baru`

#### F-09: Manajemen Track (CRUD)

**Tabel Track List**:
- Kolom: Cover, Judul, Album, Status, Play Count, Tanggal Upload
- Filter: Published / Draft / All
- Drag-and-drop reorder (update `sortOrder` via API)
- Bulk actions: Publish All, Unpublish All, Delete Selected

**Form Upload Track Baru** (`/admin/tracks/new`):
```
┌─ Upload Track ─────────────────────────────────┐
│                                                 │
│  Judul Lagu *        [________________]         │
│                                                 │
│  File Audio (MP3/WAV) *                         │
│  [  Drag file ke sini atau klik untuk pilih  ] │
│  Progress upload: ████████░░░░ 65%              │
│                                                 │
│  Album                [Dropdown / Tanpa Album]  │
│  BPM                  [____]                    │
│  Kunci Nada           [A Minor ▾]               │
│  Mood / Tag           [melancholic ×] [+ Add]  │
│  Lyrics               [________________]         │
│                       [                ]        │
│  Status               ○ Draft  ● Published      │
│                                                 │
│  [Batal]                    [Simpan Track ▶]   │
└─────────────────────────────────────────────────┘
```

**Upload Flow**:
1. File dipilih → validasi client-side (format MP3/WAV/FLAC, max 50MB)
2. `POST /api/upload` → file dikirim ke Supabase Storage bucket `audio/`
3. Supabase mengembalikan public URL
4. URL disimpan bersama metadata ke database via `POST /api/tracks`
5. Success: redirect ke daftar track dengan toast konfirmasi

#### F-10: Manajemen Album (CRUD)

- Create album: judul, tanggal rilis, cover image, deskripsi
- Edit album: semua field + assign/unassign tracks
- Delete album: tracks tidak ikut terhapus, `albumId` menjadi null
- Cover art upload: ke Supabase Storage bucket `covers/`

#### F-11: Edit Bio Musisi

- Update semua field Artist (name, tagline, bio, foto, genre, social links)
- Preview real-time (iframe web publik refresh otomatis saat save)
- Foto upload: ke Supabase Storage bucket `artist/`

#### F-12: Inbox Kontak

- Tabel semua pesan masuk, terurut terbaru dahulu
- Klik baris → drawer side panel menampilkan pesan lengkap
- Tandai sudah dibaca / belum dibaca
- Filter: Unread / All
- Tidak ada reply dari dalam app (cukup tampilkan email pengirim untuk balasan manual)

---

## 9. Alur Pengguna (User Flows)

### Flow 1 — Pengunjung Pertama Dengarkan Musik
```
Landing ──► Hero animate in 
         ──► [Dengarkan] diklik 
         ──► Audio start + player sticky muncul 
         ──► Hero type mulai audio-reactive 
         ──► Pengguna scroll natural 
         ──► Tracklist → pilih track lain 
         ──► About section → cek bio
         ──► Contact form submit
```

### Flow 2 — Musisi Upload Lagu Baru
```
/admin/login ──► Masuk dashboard 
             ──► Klik "+ Upload Track" 
             ──► Isi form + drag audio file 
             ──► Progress upload 
             ──► Set status Published 
             ──► Save 
             ──► Lagu muncul di web publik
```

### Flow 3 — Update Urutan Tracklist
```
/admin/tracks ──► Drag row A ke posisi baru 
              ──► Auto-save `sortOrder` 
              ──► Toast "Urutan disimpan" 
              ──► Web publik langsung update (SSR + revalidate)
```

---

## 10. Desain Responsif (Responsive Design)

| Breakpoint | Nama | Lebar | Perilaku Khusus |
|---|---|---|---|
| `sm` | Mobile | < 640px | Player collapse ke mini-bar, hero type size 80vw, tracklist 1 kolom, menu hamburger |
| `md` | Tablet | 640–1024px | Player full width, hero 40vw, 2-kolom bio |
| `lg` | Desktop | 1024–1440px | Layout penuh, bleed type aktif, hover effects aktif |
| `xl` | Wide | > 1440px | Max-width container 1440px, type sizes cap |

**Mobile Audio UX**: Pada iOS, autoplay audio diblokir. Solusi: player dimulai hanya setelah user gesture pertama (tap tombol "Dengarkan"). Player mini di bawah dapat di-swipe up ke expanded view.

---

## 11. Performa & Kualitas (Performance)

| Metrik | Target |
|---|---|
| Largest Contentful Paint (LCP) | < 2.5 detik |
| Cumulative Layout Shift (CLS) | < 0.1 |
| First Input Delay (FID) | < 100ms |
| Audio TTFP (Time to First Play) | < 1 detik setelah klik |
| Lighthouse Score | ≥ 90 semua kategori |

**Strategi Optimasi**:
- `next/font` untuk load `Unbounded`, `Space Mono`, `Instrument Serif` dengan `display: swap`
- Audio file: streaming `html5: true` di Howler.js (tidak download penuh sebelum play)
- Cover art: `next/image` dengan lazy loading dan WebP conversion
- ISR (Incremental Static Regeneration): halaman utama di-revalidate setiap 60 detik
- Supabase CDN untuk file audio (edge caching)

---

## 12. Keamanan (Security)

- Semua admin route dilindungi middleware NextAuth.js session check
- Password admin di-hash dengan `bcrypt` salt round 12
- File upload: validasi MIME type di server-side (bukan hanya extension)
- Audio URL tidak public-indexable secara langsung (signed URL opsional untuk eksklusivitas)
- Input form: Zod schema validation + sanitasi HTML
- Rate limiting: `upstash/ratelimit` pada endpoint contact dan auth
- CORS: hanya izinkan request dari domain yang terdaftar

---

## 13. Milestone & Estimasi

### Sprint 1 — Fondasi (Minggu 1–2)
- [x] Setup proyek Next.js + Tailwind + TypeScript
- [x] Konfigurasi Prisma + Supabase
- [x] Skema database + migrasi
- [x] NextAuth.js admin login
- [x] Supabase Storage bucket setup
- [x] Design token CSS variables

### Sprint 2 — Backend CRUD (Minggu 3–4)
- [x] API routes: Tracks (GET, POST, PUT, DELETE)
- [x] API routes: Albums (CRUD)
- [x] API routes: Bio, Upload, Contact
- [x] Admin panel UI: Dashboard, Track list, Form upload
- [x] File upload flow end-to-end
- [x] Admin: Album management, Bio editor, Inbox

### Sprint 3 — Frontend Publik (Minggu 5–6)
- [x] Hero section + karakter stagger animation
- [x] Audio-reactive `font-weight` modulation (Web Audio API)
- [x] Howler.js audio player integration
- [x] Custom sticky player UI + visualizer mini
- [x] Tracklist dengan glitch scramble hover
- [x] About section + pull quote
- [x] Contact form + submission

### Sprint 4 — Polish & Launch (Minggu 7–8)
- [x] Responsive tuning (mobile, tablet)
- [x] Keyboard navigation + accessibility
- [x] `prefers-reduced-motion` implementation
- [x] Performance audit & optimasi
- [x] Cross-browser testing (Chrome, Safari, Firefox, Samsung Internet)
- [x] SEO: meta tags, Open Graph image generator
- [x] Deployment ke Vercel + domain custom
- [x] Seed data: 3–5 track sampel, bio placeholder

---

## 14. Out of Scope (Fase 1)

Fitur berikut tidak dibangun pada fase ini namun dapat dijadikan backlog:

- Penjualan tiket konser
- Merchandise shop
- Email newsletter / mailing list
- Komentar / komunitas fans
- Integrasi analytics mendalam (Mixpanel, Posthog)
- Multi-language support
- Streaming ke platform eksternal (Spotify, Apple Music embed)
- PWA / offline mode

---

## 15. Glosarium

| Istilah | Definisi |
|---|---|
| Audio-Reactive | Elemen visual yang berubah secara real-time berdasarkan data audio (amplitude, frekuensi) |
| AnalyserNode | Web Audio API interface yang menyediakan data analisis sinyal audio real-time |
| Variable Font | Font yang menyimpan banyak variasi (weight, width, dll) dalam satu file dengan interpolasi halus |
| Bleed Type | Tipografi yang sengaja melampaui batas container/layar, menciptakan kesan skala masif |
| Glitch Scramble | Efek tipografi di mana karakter berganti ke karakter acak sebelum "resolve" ke teks asli |
| ISR | Incremental Static Regeneration — halaman Next.js di-regenerate di background secara berkala |
| Signed URL | URL sementara dengan token autentikasi yang memberikan akses ke file privat |

---

*Document ini hidup — diupdate seiring keputusan desain dan teknis yang berkembang selama pengerjaan.*

**Dibuat dengan:** Next.js 14 · TypeScript · Prisma · Supabase · Howler.js · Framer Motion  
**Design Direction:** Experimental Typography · Audio-Reactive · Warm Underground
