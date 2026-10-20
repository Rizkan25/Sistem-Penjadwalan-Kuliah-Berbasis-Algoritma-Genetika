# SPK-AG Frontend — Next.js Application

Antarmuka web modern untuk **Sistem Penjadwalan Kuliah Berbasis Algoritma Genetika (SPK-AG)** Program Studi Ilmu Komputer, Universitas Bina Bangsa Getsempena (UBBG).

Aplikasi frontend ini dibangun menggunakan **Next.js 16 (App Router)**, **React 19**, **TypeScript**, dan **Tailwind CSS v4** dengan engine kompilasi super cepat **Turbopack**.

---

## 🚀 Fitur Antarmuka

1. **Dashboard KPI & Ringkasan Sistem (`/`):**
   - Kartu metrik total dosen, mata kuliah, ruangan, dan kelas perkuliahan.
   - Status cepat pekerjaan penjadwalan terakhir dan tautan navigasi instan.

2. **Panel Kontrol Algoritma Genetika & Evolution Monitor (`/generator`):**
   - Form penentuan parameter GA (Populasi, Maksimum Generasi, Crossover Rate, Mutation Rate, Elitism).
   - Pemantauan evolusi _real-time_ melalui polling asinkron (persentase progres, generasi saat ini, nilai fitness, dan sisa konflik).

3. **Riwayat Pekerjaan Optimasi (`/history`):**
   - Daftar riwayat eksekusi GA beserta status, waktu komputasi, dan fitness.
   - Tombol penetapan jadwal resmi aktif (`Publish Schedule`).

4. **Tabel Jadwal Kuliah & Ekspor Dokumen (`/schedule`):**
   - Tampilan daftar jadwal hasil generasi terbaik.
   - Filter multi-kriteria: Semester, Jalur KBK (Umum, Pemrograman, Multimedia, IoT), Dosen, dan Ruangan.
   - Tombol ekspor 1-klik ke format **Excel (`.xlsx`)** dan **PDF (`.pdf`)**.
   - Penyesuaian jadwal manual via modal anti-bentrok (_Manual Swap_).

5. **Matriks Kalender Ruangan 2D (`/schedule/matrix`):**
   - Visualisasi grid matriks 2D interaktif (Sumbu X: Seluruh Ruangan Kelas & Lab, Sumbu Y: Sesi Waktu Harian).
   - Penanda visual waktu ibadah Sholat Jumat (11:30 - 14:00 WIB) yang terproteksi.

6. **Manajemen Data Master (`/master/*`):**
   - **Rombel Kelas (`/master/classes`):** Pengurutan kolom (sorting) dua arah (A-Z / Z-A), pencarian cepat, filter semester, modal tambah & edit kelas akademik.
   - **Mata Kuliah (`/master/courses`):** Kode, nama, SKS, semester, tipe (Teori/Lab), dan rumpun KBK.
   - **Dosen & Preferensi (`/master/lecturers`):** NIDN, nama, email, serta preferensi waktu mengajar (`UNAVAILABLE` / `PREFERRED`).
   - **Ruangan (`/master/rooms`):** Kode, nama, kapasitas kursi, dan tipe ruang (Teori/Lab).
   - **Slot Waktu (`/master/time-slots`):** Hari, sesi jam mulai - selesai, dan aturan Jumat.

---

## 🛠️ Tumpukan Teknologi Frontend

- **Framework:** Next.js 16.4.2 (App Router)
- **Library UI:** React 19.3.0
- **Bahasa:** TypeScript 5
- **Styling:** Tailwind CSS v4 (`@tailwindcss/turbopack`)
- **Icons:** Lucide React (`lucide-react`)
- **HTTP Client:** Fetch API dengan auto-resolving dynamic host (`src/lib/api.ts`)

---

## 📦 Pemasangan & Menjalankan Frontend

### 1. Pemasangan Dependensi

Pastikan berada di direktori `frontend`:

```bash
cd frontend
npm install
```

### 2. Menjalankan Server Pengembangan

```bash
npm run dev
```

Server pengembangan akan aktif pada host `0.0.0.0:3000`:
- Akses lokal di komputer: **http://localhost:3000**
- Akses melalui perangkat lain di jaringan Wi-Fi/LAN yang sama: **http://<IP-Komputer-Anda>:3000**

### 3. Skrip yang Tersedia

- `npm run dev`: Menjalankan server pengembangan Next.js dengan Turbopack (`next dev -H 0.0.0.0`).
- `npm run build`: Melakukan build aplikasi untuk produksi (`next build`).
- `npm run start`: Menjalankan server hasil build produksi (`next start -H 0.0.0.0`).
- `npm run lint`: Menjalankan pengecekan ESLint (`eslint`).

---

## 🌐 Konfigurasi Jaringan & Proxy API

Frontend dikonfigurasi pada `next.config.ts` untuk memfasilitasi pengujian lintas perangkat:
- **`allowedDevOrigins`:** Mengizinkan akses origin lokal seperti `192.168.0.80:3000`, `localhost:3000`, dan `127.0.0.1:3000`.
- **`rewrites`:** Melakukan proxy otomatis rute `/api/v1/:path*` ke backend FastAPI (`http://127.0.0.1:8000/api/v1/:path*`).
- **`getApiBaseUrl()`:** Fungsi klien di `src/lib/api.ts` secara otomatis menggunakan hostname browser aktif untuk mengarahkan request API ke port 8000, sehingga tidak terjadi pemutusan koneksi saat diakses dari smartphone atau laptop lain.
