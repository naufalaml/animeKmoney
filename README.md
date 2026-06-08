# DramaCuan - Watch Chinese Dramas & Earn Money 🧧

DramaCuan adalah platform web *Watch-to-Earn* premium yang dirancang khusus untuk penggemar Drama China (Dracin). Pengguna dapat menonton serial favorit mereka, mengumpulkan durasi menonton secara real-time, mendapatkan koin dari milestone menonton, dan menukarkannya langsung menjadi saldo e-wallet atau transfer bank.

Proyek ini dibuat menggunakan **Vite + React + TypeScript + Vanilla CSS** dan dilengkapi dengan simulasi sistem iklan CPM tinggi (pop-under, native banner, interstitial rewarded video) untuk membantu pemilik situs (owner) memaksimalkan pendapatan.

---

## 🚀 Fitur Utama
1. **Catalog Drama China**: Data drama dimuat secara dinamis dari **TMDB API** nyata dengan antarmuka gelap yang premium (gold & crimson accents) serta responsif, dan video streaming langsung menggunakan **VidSrc Embed Player**.
2. **Sistem Akun (Auth)**: Registrasi dan login instan tersimpan secara lokal menggunakan `localStorage` agar koin dan riwayat tetap aman meskipun halaman direfresh.
3. **Watch-to-Earn Engine**:
   - Penghitungan durasi menonton berjalan secara real-time saat video diputar.
   - Detektor Anti-Cheat menggunakan **Page Visibility API**: Waktu tonton & koin akan otomatis dijeda saat pengguna meminimalkan browser atau berpindah tab.
4. **Skema Milestone Koin**:
   - Menonton **30 Detik** = `+70 koin`
   - Menonton **2 Menit (120s)** = `+190 koin` (total 260)
   - Menonton **5 Menit (300s)** = `+350 koin`
   - Menonton **10 Menit (600s)** = `+500 koin`
   - Menonton **30 Menit (1800s)** = `+900 koin`
   - Menonton **1 Jam (3600s)** = `+1200 koin`
   - Menonton **2 Jam (7200s)** = `+1800 koin` (maksimum harian)
5. **Kalkulator & Form Penarikan**:
   - Nilai konversi koin: **1.000 Koin = Rp 100**.
   - Batas minimum penarikan: **Rp 50.000** (setara **500.000 Koin**).
   - Mendukung penarikan ke **DANA**, **OVO**, **GoPay**, dan **Transfer Bank**.
6. **Bonus Reward Ad**: Tombol pintasan untuk menonton iklan sponsor berdurasi 15 detik untuk mendapatkan **+500 koin** instan.
7. **Owner/Admin Portal**:
   - Pelacak performa iklan (Impresi, CTR, CPM rata-rata, dan Estimasi keuntungan owner dalam USD & Rupiah).
   - Antarmuka persetujuan (Approve/Reject) untuk penarikan saldo pengguna.
   - Panduan integrasi kode iklan nyata.

---

## 🛠️ Cara Menjalankan Proyek secara Lokal

Node.js telah terinstal di sistem Anda. Ikuti langkah berikut untuk menjalankan server pengembangan lokal:

1. Buka aplikasi terminal (PowerShell atau Command Prompt) baru.
2. Masuk ke direktori proyek:
   ```bash
   cd C:\Users\Lenovo\.gemini\antigravity\scratch\cdrama-earn
   ```
3. Jalankan perintah server pengembangan:
   ```bash
   npm run dev
   ```
4. Buka URL lokal yang muncul di terminal (biasanya `http://localhost:5173`) di browser Anda.

*Catatan: Jika Anda menggunakan terminal yang sama dan perintah `npm` belum dikenali, jalankan perintah ini terlebih dahulu di PowerShell untuk memperbarui path session:*
```powershell
$env:PATH += ";C:\Program Files\nodejs"
```

---

## 💰 Panduan Integrasi Iklan CPM Tinggi (Untuk Owner)

Situs streaming video/drama memiliki jumlah impresi halaman (pageviews) yang sangat besar. Untuk mendapatkan pendapatan maksimal, pasang iklan dari jaringan publisher berikut:

### 1. Rekomendasi Jaringan Iklan:
*   **Monetag (by PropellerAds)**: Sangat direkomendasikan untuk format **Pop-under (Onclick)** dan **Vignette Ad** (interstitial). CPM Monetag untuk traffic Asia Tenggara/Indonesia berkisar antara **$3.00 - $12.00**.
*   **Adsterra**: Persetujuan instan tanpa syarat jumlah trafik. Sangat bagus untuk **Social Bar** (notifikasi mengambang dengan klik tinggi) dan **Native Banner (300x250)**.

### 2. Cara Memasang Script Iklan di Proyek Ini:
1.  **Daftar Akun**: Masuk ke [Monetag.com](https://monetag.com) atau [Adsterra.com](https://adsterra.com) dan daftarkan diri sebagai **Publisher**.
2.  **Dapatkan Script/Zona**: Buat zona iklan (Popunder/Vignette/Social Bar).
3.  **Tautkan Script ke Web**:
    *   **Iklan Popunder/Anti-Adblock**: Letakkan kode JavaScript di file `index.html` (di root proyek) tepat di dalam tag `<head>` sebelum penutup `</head>`.
    *   **Iklan Spanduk/Banner**: Pada file komponen React di `src/components/Catalog.tsx` atau `src/components/Dashboard.tsx`, ganti elemen visual simulasi `.ad-banner-top` atau `.ad-square` dengan script ads asli menggunakan prop React `dangerouslySetInnerHTML`.
