# miawlaprak 🐱📋

> Tracker laporan praktikum mahasiswa — berbasis semester, realtime, dan bisa diinstall di HP (PWA).

## ✨ Fitur

- 🔐 **Autentikasi** — Login email/password + Google OAuth
- 📧 **Verifikasi Email** — Email fiktif tidak bisa masuk app
- 📅 **Kategori Semester** — Data laprak terorganisir per semester
- 📊 **Dashboard Ringkasan** — Progress praktikum per mata kuliah
- ✅ **Tracking Modul** — Checkbox selesai, ACC Aslab, ACC Laboran
- 👨‍🏫 **Dosen Pengampu** — Track TTD Kartu Kuning per praktikum
- 🌙 **Dark/Light Mode** — Tema bisa diubah kapan saja
- 📱 **PWA** — Bisa diinstall di HP (Android/iOS)
- 🔄 **Import Data Lama** — Migrasi data laprak dari versi sebelumnya

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| UI | [MUI (Material UI) v6](https://mui.com/) |
| Backend | [Firebase](https://firebase.google.com/) (Auth + Firestore) |
| Language | TypeScript |
| Hosting | Vercel *(direkomendasikan)* |

## 🚀 Setup Lokal

### 1. Clone repo

```bash
git clone https://github.com/username/miawlaprak.git
cd miawlaprak
```

### 2. Install dependencies

```bash
npm install
```

### 3. Konfigurasi environment

Salin `.env.example` menjadi `.env.local` lalu isi dengan kredensial Firebase kamu:

```bash
cp .env.example .env.local
```

`.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 4. Jalankan dev server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## 🔥 Firestore Security Rules

Tambahkan rules berikut di Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Data lama (kompatibilitas)
    match /laprak/{docId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid;
    }
    // Data baru: per-user, per-semester
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }
  }
}
```

## 📁 Struktur Proyek

```
src/
├── app/
│   ├── (app)/           # Halaman protected (butuh login)
│   │   ├── page.tsx         # Beranda / ringkasan
│   │   ├── manage/          # Manage praktikum
│   │   ├── profil/          # Profil user
│   │   └── about/           # Tentang app
│   ├── auth/            # Halaman login/register
│   ├── layout.tsx       # Root layout
│   └── providers.tsx    # Context providers
├── components/          # Komponen reusable
├── context/             # React Context (Auth, Theme, Snackbar, Semester)
└── lib/
    ├── firebase.ts          # Inisialisasi Firebase
    └── firestoreService.ts  # Semua fungsi CRUD Firestore
```

## 📱 PWA

App ini sudah dikonfigurasi sebagai Progressive Web App. Untuk install di HP:
- **Android (Chrome)**: Buka web → menu ⋮ → "Add to Home Screen"
- **iOS (Safari)**: Buka web → Share → "Add to Home Screen"

## 📄 License

MIT
