# DESIGN.md — Design System: Sistem Penjadwalan Kuliah Berbasis Algoritma Genetika

## 1. Filosofi & Arah Visual (Visual Direction)

Desain ini mengambil DNA identitas **OpenSIMKA UBBG** (agar selaras dengan ekosistem kampus) namun dimodernisasi menggunakan pendekatan **Clean Data-Driven Dashboard** (seperti _shadcn/ui_ + _Tailwind CSS_). Fokus utamanya adalah mempermudah Admin Prodi mengatur _constraint_ data dan memantau proses evolusi Algoritma Genetika hingga menghasilkan jadwal tanpa bentrok (_zero-conflict schedule_).

- **Familiar namun Modern:** Mempertahankan aksen warna _Teal-Blue_ dan _Warm Amber_ khas OpenSIMKA, tetapi mengganti _card_ bertumpuk yang padat menjadi tabel interaktif, _tab view_, dan matriks kalender visual.
- **Algorithm Transparency:** Menyediakan komponen khusus untuk memvisualisasikan parameter GA (_Populasi_, _Crossover Rate_, _Mutation Rate_), grafik konvergensi _fitness_, dan indikator penalti (_hard/soft constraint_).

---

## 2. Palet Warna & Token Desain (Color Tokens)

### A. Brand & Layout Shell (Adaptasi Modern OpenSIMKA)

| Token             | Hex       | Tailwind Equivalent | Penggunaan                                                            |
| :---------------- | :-------- | :------------------ | :-------------------------------------------------------------------- |
| `--brand-primary` | `#1D8699` | `cyan-700`          | Warna utama tombol aksi (`Generate Jadwal`), _active state_, & header |
| `--brand-accent`  | `#D4822A` | `amber-600`         | Aksen sekunder, _highlight_ generasi terbaik, tombol _Export_         |
| `--sidebar-bg`    | `#1E293B` | `slate-800`         | Sidebar navigasi gelap yang lebih modern dan nyaman di mata           |
| `--bg-canvas`     | `#F8FAFC` | `slate-50`          | Latar belakang utama halaman (_app background_)                       |
| `--bg-surface`    | `#FFFFFF` | `white`             | Permukaan kartu, tabel jadwal, dan panel parameter GA                 |
| `--border-subtle` | `#E2E8F0` | `slate-200`         | Garis batas tabel, pemisah slot jam, dan _card border_                |

### B. Warna Semantik Khusus Penjadwalan & GA

| Status / Kondisi             | Hex       | Tailwind Badge                   | Penggunaan dalam Sistem Penjadwalan                          |
| :--------------------------- | :-------- | :------------------------------- | :----------------------------------------------------------- |
| **Optimal / Valid**          | `#10B981` | `bg-emerald-50 text-emerald-700` | _Fitness_ = 1.0 (0 Konflik), jadwal siap dipublikasikan      |
| **Soft Constraint Warning**  | `#F59E0B` | `bg-amber-50 text-amber-700`     | Peringatan ringan (mis. jam kuliah di luar preferensi dosen) |
| **Hard Constraint Conflict** | `#EF4444` | `bg-rose-50 text-rose-700`       | Bentrok ruangan, bentrok dosen, atau kapasitas lab kurang    |
| **Lab / Praktikum**          | `#3B82F6` | `bg-blue-50 text-blue-700`       | Penanda ruang Lab (`C.III.10 LAB KOMPUTER`, `LAB CBT`)       |
| **Kelas Teori / Umum**       | `#8B5CF6` | `bg-purple-50 text-purple-700`   | Penanda ruang kuliah reguler (`Gedung D`, `Gedung E`)        |
| **MK Pilihan**               | `#EC4899` | `bg-pink-50 text-pink-700`       | Badge penanda Mata Kuliah Pilihan (adaptasi dari OpenSIMKA)  |

---

## 3. Arsitektur Halaman & Navigasi (Information Architecture)

Berbeda dengan portal mahasiswa yang memiliki 20+ menu, aplikasi penjadwalan ini disederhanakan menjadi **3 grup menu utama** di Sidebar:

```text
+-----------------------------------------------------------------------------+
| [Logo] SIM-JADWAL GA | FSTIK UBBG          [Semester: Ganjil 2026/2027 v]   |
+----------------------+------------------------------------------------------+
| MASTER DATA          |  [ KPI Cards: Total MK | Total Dosen | Ruang | SKS ] |
|  - Dosen & Preferensi|  +------------------------------------------------+  |
|  - Mata Kuliah & SKS |  | PANEL KONTROL ALGORITMA GENETIKA               |  |
|  - Ruang & Kapasitas |  | [Populasi: 100] [Cr: 0.85] [Mr: 0.05] [MaxGen] |  |
|  - Rombel & Kuota    |  | [▶ Generate Jadwal]  [Progress: Gen 142/500]   |  |
|                      |  +------------------------------------------------+  |
| MESIN OPTIMASI (GA)  |  | HASIL JADWAL [Tab: Tabel | Matriks Ruang | Log]|  |
|  - Konfigurasi & Run |  |------------------------------------------------|  |
|  - Riwayat Generasi  |  | Filter: [Semua Hari v] [Semua Gedung v] [Cari] |  |
|                      |  | Hari  | Pukul       | Ruang       | MK & Dosen |  |
| OUTPUT JADWAL        |  | Kamis | 09:00-11:30 | C.III.10    | JST (B)    |  |
|  - Tabel Jadwal      |  | Sabtu | 11:30-14:00 | C.II.12     | Manpro (D) |  |
|  - Matriks Ruangan   |  +------------------------------------------------+  |
+----------------------+------------------------------------------------------+
```

## 4. Spesifikasi Komponen Kunci (Key UI Components)

### 4.1. Panel Kontrol & Eksekusi GA (GA Engine Controller)

Komponen di bagian atas halaman _Generator_ untuk mengatur parameter sebelum proses optimasi dijalankan:

- **Input Parameter (Grid 4 Kolom):** Input numerik bersih untuk Ukuran Populasi (mis. 50–200), Probabilitas Crossover ($P_c$), Probabilitas Mutasi ($P_m$), dan Maksimum Generasi.
- **Live Evolution Monitor:** Saat tombol **Generate Jadwal** diklik, tampilkan _progress bar real-time_ beserta 3 metrik utama:
  - **Generasi Saat Ini:** Gen 185 / 500
  - **Best Fitness Score:** 0.9852 (mendekati 1.0000)
  - **Jumlah Konflik Tersisa:** Badge merah/hijau `0 Hard Conflict | 2 Soft Conflict`
- **Mini Sparkline / Convergence Chart:** Grafik garis kecil yang memperlihatkan kenaikan nilai _fitness_ dari generasi ke-1 hingga konvergen.

### 4.2. Tabel Jadwal Kuliah (Adaptasi Rapi dari OpenSIMKA)

Mengambil struktur tabel _MK Semester Ini_ dari OpenSIMKA namun diperbaiki keterbacaannya untuk kebutuhan penjadwalan:

- **Kolom 1 — Waktu (Hari & Pukul):** Digabung secara vertikal. Baris atas: Badge Hari (Kamis), Baris bawah: `09:00 - 11:30` (150 mnt) untuk 3 SKS atau 100 mnt untuk 2 SKS.
- **Kolom 2 — Ruang & Kapasitas:** Baris atas: Kode & Nama Ruang (`C.III.10 LAB KOMPUTER 02`). Baris bawah: Info Gedung (`Gedung C Lt. 3`) + Indikator Kapasitas (`Terisi: 50/55 kursi`).
- **Kolom 3 — Mata Kuliah & Rombel:** Baris atas: Kode MK + Nama MK tebal (`MKKL1009 - Jaringan Saraf Tiruan`) + _pill badge_ MK Pilihan. Baris bawah: Badge merah/biru `Rombel B` + `3 SKS` + `Semester V`.
- **Kolom 4 — Dosen Pengampu (Team Teaching Support):** Mengingat di UBBG banyak mata kuliah diampu 2 dosen (_team teaching_), gunakan komponen _Avatar Stack_ beserta daftar nama dosen (Dosen 1 & Dosen 2).
- **Kolom 5 — Status Konflik (Khusus Sistem GA):** Menampilkan badge Optimal (Hijau) jika tidak ada bentrok, atau Bentrok Dosen / Kapasitas Berlebih (Merah) beserta _tooltip_ detail kromosom yang bermasalah.

### 4.3. Matriks Penggunaan Ruangan (Room-Time Timetable Grid)

Selain tampilan daftar tabel seperti OpenSIMKA, sistem penjadwalan wajib memiliki tampilan Kalender Matriks:

- **Sumbu X (Kolom):** Daftar Ruangan (`C.III.10 Lab Komp 2`, `C.III.11 Lab Komp 1`, `C.II.01 Lab CBT 1`, `C.II.12 Lab CBT 2`, `D.III.01`).
- **Sumbu Y (Baris):** Slot Waktu harian (`08:00`, `09:00`, `11:30`, `14:00`, `15:40`).
- **Blok Kartu Jadwal:** Setiap mata kuliah yang ditempatkan oleh Algoritma Genetika tampil sebagai blok berwarna sesuai semesternya. Jika ada slot kosong, terlihat jelas sebagai area putih sehingga Admin Prodi mudah mengecek ketersediaan lab.

---

## 5. Tipografi & Hierarki Data

- **Primary Font (Inter atau Plus Jakarta Sans):** Digunakan untuk seluruh teks UI, nama mata kuliah, dan nama dosen.
- **Monospace Font (JetBrains Mono):** Digunakan khusus untuk:
  - Jam perkuliahan (`09:00 - 11:30`) agar sejajar vertikal di dalam tabel.
  - Kode Ruangan (`C.III.10`, `E.II.06`) dan Kode MK (`MKKD1040`).
  - Nilai Fitness (`0.9541`) dan waktu komputasi (`Elapsed: 4.2s`).
