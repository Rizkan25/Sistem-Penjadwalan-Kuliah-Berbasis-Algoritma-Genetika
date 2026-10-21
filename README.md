# Sistem Penjadwalan Kuliah Berbasis Algoritma Genetika (SPK-AG)

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/UI-React%2019-blue?style=flat-square&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.146+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python)](https://www.python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Database](https://img.shields.io/badge/Database-SQLite%20(WAL)%20%2F%20PostgreSQL-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

Aplikasi web _full-stack_ cerdas dan modern untuk otomatisasi penyusunan jadwal perkuliahan bebas bentrok (**Zero Hard Conflicts**) menggunakan **Algoritma Genetika (Genetic Algorithm)** secara asinkron. Sistem ini dikembangkan khusus untuk memecahkan kompleksitas _University Course Timetabling Problem_ (UCTP) pada **Program Studi S1 Ilmu Komputer, Universitas Bina Bangsa Getsempena (UBBG) Banda Aceh**, yang mencakup kelas reguler umum serta percabangan 3 Kelompok Bidang Keahlian (**KBK: Pemrograman, Multimedia, dan IoT**) yang berjalan secara paralel.

---

## 🌟 Fitur Unggulan

### 1. Mesin Optimasi Algoritma Genetika (GA Engine)

- **6 Batasan Keras (_Hard Constraints_ - $HC_1$ s/d $HC_6$ / Wajib Nol Pelanggaran):**
  - **$HC_1$ (Bebas Bentrok Dosen):** Seorang dosen tidak boleh mengajar lebih dari 1 kelas pada slot waktu yang bersamaan.
  - **$HC_2$ (Bebas Bentrok Ruangan):** Suatu ruangan tidak boleh digunakan oleh lebih dari 1 sesi perkuliahan pada slot waktu yang bersamaan.
  - **$HC_3$ (Bebas Bentrok Rombel & Aturan Paralel KBK):** Kelas pada semester dan kelompok (_cohort_) yang sama tidak boleh bertabrakan, **kecuali** kelas peminatan spesifik antar-KBK yang berbeda (misalnya: kelas KBK Pemrograman dan KBK Multimedia diizinkan berjalan paralel di ruangan berbeda).
  - **$HC_4$ (Kecukupan Kapasitas Ruangan):** Kapasitas kursi ruangan $\ge$ jumlah mahasiswa peserta kelas.
  - **$HC_5$ (Kesesuaian Tipe Ruangan):** Kelas praktikum wajib dialokasikan di laboratorium komputer (`LABORATORY`), sedangkan kelas teori dialokasikan di ruang kelas reguler (`THEORY`).
  - **$HC_6$ (Waktu Berhalangan Dosen):** Kepatuhan mutlak terhadap jadwal dosen yang mengajukan status tidak bersedia hadir (`UNAVAILABLE`).
- **3 Batasan Lunak (_Soft Constraints_ - $SC_1$ s/d $SC_3$ / Diupayakan Minimal):**
  - **$SC_1$ (Preferensi Waktu Dosen):** Memprioritaskan alokasi mengajar pada slot waktu yang ditandai `PREFERRED` oleh dosen bersangkutan.
  - **$SC_2$ (Minimasi Jam Kosong Mahasiswa):** Meminimalkan jeda waktu kosong (_gap hours_) antar-perkuliahan dalam hari yang sama untuk kelompok mahasiswa yang sama.
  - **$SC_3$ (Pemerataan Beban Mengajar Harian):** Membatasi beban mengajar dosen maksimal 3 blok sesi kelas dalam satu hari.
- **Inisialisasi Heuristik & Mutasi Adaptif:**
  - Penempatan ruangan langsung mencocokkan tipe dan kapasitas sejak pembentukan kromosom generasi awal ($HC_4$ & $HC_5$ langsung terpenuhi).
  - Mekanisme _Diversity Injection_: Peningkatan _mutation rate_ otomatis (dari 0.08 ke 0.25 selama 5 generasi) jika populasi mengalami konvergensi prematur / stagnan selama 15 generasi berturut-turut.
- **Validasi Kelayakan Pra-Eksekusi (_Pre-feasibility Check_):**
  - Endpoint `/api/v1/conflicts/pre-check` memverifikasi rasio ketersediaan jam ruangan dan beban mengajar dosen sebelum proses GA dimulai, menolak komputasi yang tidak layak secara matematis dengan kode respons `422 Unprocessable Entity`.
- **Proteksi Waktu Ibadah Sholat Jumat (Banda Aceh):**
  - Slot perkuliahan pada hari Jumat pukul `11:30 - 14:00 WIB` dikunci otomatis untuk menghormati pelaksanaan ibadah Sholat Jumat.

### 2. Sinkronisasi Data Kurikulum & Dosen Riil (Data Sync & Scraper)

- **Sinkronisasi Web Dosen Resmi UBBG (`sync_web_lecturers.py`):**
  - Mengambil data dosen aktif secara otomatis dari portal resmi Prodi S1 Ilmu Komputer UBBG ([https://ilkom.bbg.ac.id/dosen/](https://ilkom.bbg.ac.id/dosen/)) menggunakan BeautifulSoup4 dan HTTPX.
  - Mendeteksi nama lengkap, gelar akademik, jabatan struktural (misal: Ketua Prodi, Sekretaris Prodi, Dosen Tetap/Tamu), dan menangani relasi kelas secara aman (`--clean-dummy`).
- **Sinkronisasi Kurikulum Lengkap OpenSIMKA (`sync_simka_courses.py`):**
  - Memuat 71+ mata kuliah resmi dari dataset portal OpenSIMKA UBBG (`app/seeds/opensimka_courses.json`).
  - Menyinkronkan kode MK, bobot SKS, semester, jenis mata kuliah (`Wajib` / `Pilihan`), status prasyarat, serta klasifikasi cerdas rumpun KBK dan tipe ruang (Teori/Lab).

### 3. Antarmuka Modern & Responsif (Frontend Next.js)

- **Desain Adaptif OpenSIMKA UBBG:** Filosofi desain data modern berbasis _Teal-Blue_ (`#1D8699`), _Warm Amber_ (`#D4822A`), dan _Slate Canvas_ yang bersih dan elegan.
- **Sidebar Buka-Tutup (_Collapsible Responsive Navigation_):** Dapat diperkecil menjadi mode bilah ikon ramping (72px) di desktop dengan _floating hover tooltip_, serta dilengkapi _backdrop overlay_ otomatis untuk perangkat seluler.
- **Live Evolution Monitor:** Visualisasi pemantauan progres generasi algoritma secara _real-time_ (persentase, counter generasi, skor fitness terbaik, dan indikator sisa konflik) via polling asinkron anti-timeout.
- **Matriks Kalender Ruangan 2D (_Room-Time Grid_):** Visualisasi matriks 2D interaktif (Sumbu X: Seluruh Ruangan, Sumbu Y: Sesi Waktu) lengkap dengan penanda blokade waktu ibadah Sholat Jumat dan badge jenis kelas.
- **Penyesuaian Manual Anti-Bentrok (_Manual Swap Modal_):** Fitur tukar slot/ruangan pasca-generasi yang divalidasi langsung oleh sistem terhadap batasan $HC_1$ hingga $HC_6$.
- **Table Sorting & Quick Search:** Pengurutan kolom interaktif dua arah (A–Z / Z–A) pada nama kelas, mata kuliah, dosen, semester, KBK, dan kuota mahasiswa, dilengkapi bilah pencarian instan.
- **Ekspor Dokumen Resmi Siap Cetak:** Unduh jadwal hasil optimasi ke format **Excel (`.xlsx`)** (tabel resmi berlogo UBBG) dan **PDF (`.pdf`)** (format A4 Landscape siap cetak) dalam 1 klik.
- **CRUD Data Master Komprehensif:** Manajemen data Dosen & Preferensi Waktu, Ruangan & Tipe/Kapasitas, Mata Kuliah & SKS, Rombel Kelas Akademik (dengan modal Tambah & Edit), serta Slot Waktu.
- **Dukungan Akses Multi-Device & Jaringan Lokal (LAN/Wi-Fi):** Server otomatis di-bind ke `0.0.0.0` dan klien API mendeteksi alamat jaringan secara dinamis, memungkinkan pengujian langsung dari laptop maupun smartphone dalam satu jaringan Wi-Fi tanpa konfigurasi rumit.

---

## 🛠️ Tumpukan Teknologi (Tech Stack)

| Komponen                | Teknologi                                                   | Deskripsi                                                                                |
| :---------------------- | :---------------------------------------------------------- | :--------------------------------------------------------------------------------------- |
| **Frontend Framework**  | Next.js 16 (App Router), React 19, TypeScript 5             | Arsitektur web modern dengan engine Turbopack dan partial prefetching                    |
| **Styling & Icons**     | Tailwind CSS v4 (`@tailwindcss/turbopack`), Lucide React    | Konfigurasi CSS-first, ikon SVG interaktif, performa rendering tinggi                    |
| **Backend API**         | FastAPI 0.146+ (Python 3.10+)                               | Framework RESTful API asinkron dengan validasi skema otomatis (Pydantic v2)              |
| **Mesin Optimasi (GA)** | Algoritma Genetika (NumPy, Python Core)                     | Algoritma heuristik UCTP dengan batasan keras & lunak serta inisialisasi cerdas          |
| **Basis Data**          | SQLite (Default Dev dengan WAL Mode) / PostgreSQL (AlloyDB) | ORM SQLAlchemy 2.x dengan UUID/GUID platform-independent dan isolasi konkurensi tinggi   |
| **Scraper & Sync**      | BeautifulSoup4 4.15+, HTTPX 0.28+                           | Sinkronisasi data dosen resmi web Prodi Ilkom UBBG & integrasi kurikulum OpenSIMKA       |
| **Task Queue**          | Hybrid Executor (Celery 5.6+ / Background Thread Fallback)  | Eksekusi tugas latar belakang asinkron anti-timeout dengan fallback cerdas               |
| **Dokumentasi API**     | OpenAPI (Swagger UI & ReDoc)                                | Dokumentasi API interaktif bawaan di `/docs` dan `/redoc`                                |
| **Ekspor Dokumen**      | OpenPyXL 3.1.5 (Excel), ReportLab 5.0.1 (PDF)               | Generator berkas jadwal perkuliahan resmi siap edar dan arsip akademik                   |

---

## 📂 Struktur Repositori

```text
├── backend/
│   ├── app/
│   │   ├── api/                     # Endpoint REST API (master, schedules, conflicts)
│   │   │   ├── __init__.py          # Inisialisasi router API
│   │   │   ├── conflicts.py         # Endpoint pre-feasibility check & validasi bentrok
│   │   │   ├── master.py            # CRUD dosen, ruangan, slot waktu, MK, kelas, preferensi
│   │   │   └── schedules.py         # Trigger GA, polling status, manual swap, ekspor file, jobs
│   │   ├── ga/                      # Inti Mesin Algoritma Genetika
│   │   │   ├── __init__.py          # Export modul GA
│   │   │   ├── chromosome.py        # Struktur gen, kelas, ruangan, slot waktu, context
│   │   │   ├── engine.py            # GA loop, adaptive mutation, elitism, termination
│   │   │   ├── fitness.py           # Evaluasi 6 hard constraints & 3 soft constraints
│   │   │   └── operators.py         # Tournament selection, uniform crossover, swap mutation
│   │   ├── models/                  # Model database SQLAlchemy 2.x
│   │   │   ├── __init__.py          # Export relasi model
│   │   │   ├── master.py            # Tabel lecturers, rooms, time_slots, courses, academic_classes
│   │   │   └── schedule.py          # Tabel schedule_jobs & schedules
│   │   ├── schemas/                 # Validasi skema input/output Pydantic v2
│   │   │   ├── __init__.py          # Export skema DTO
│   │   │   ├── master.py            # Skema DTO master data & preferensi dosen
│   │   │   └── schedule.py          # Skema parameter GA, response job, & swap DTO
│   │   ├── seeds/                   # Berkas data awal eksternal
│   │   │   └── opensimka_courses.json # Dataset resmi 71+ mata kuliah OpenSIMKA UBBG
│   │   ├── adjust_class_capacities.py # Kalibrasi kuota mahasiswa terhadap batas kapasitas 28 ruangan kampus
│   │   ├── celery_app.py            # Konfigurasi Celery & broker antrean Redis
│   │   ├── config.py                # Konfigurasi environment & parameter sistem
│   │   ├── database.py              # Engine koneksi basis data (SQLite WAL / PostgreSQL) & SessionLocal
│   │   ├── exporter.py              # Generator dokumen resmi Excel (.xlsx) & PDF (.pdf)
│   │   ├── main.py                  # Entry point FastAPI, CORS LAN, & auto-seeder lifespan
│   │   ├── migrate_real_courses.py  # Migrasi dataset kurikulum lengkap & 52 kelas akademik aktif
│   │   ├── seed_data.py             # Seeder master data dasar (31 dosen, 28 ruang kampus, slot waktu, preferensi)
│   │   ├── seed_even_courses.py     # Seeder mata kuliah semester genap (Sem 2, 4, 6, 8)
│   │   ├── sync_simka_courses.py    # Skrip sinkronisasi kurikulum mata kuliah dari OpenSIMKA UBBG
│   │   ├── sync_web_lecturers.py    # Skrip sinkronisasi data dosen dari web resmi ilkom.bbg.ac.id
│   │   └── tasks.py                 # Task runner asinkron (Celery worker / background thread fallback)
│   ├── requirements.txt             # Dependensi pustaka Python
│   ├── run.py                       # Launcher server Uvicorn (0.0.0.0:8000)
│   └── spk_ag.db                    # Basis data SQLite lokal (dibuat otomatis)
├── frontend/
│   ├── public/                      # Aset statis & logo
│   ├── src/
│   │   ├── app/
│   │   │   ├── generator/page.tsx   # GA Control Panel, parameter form, & evolution monitor
│   │   │   ├── history/page.tsx     # Riwayat pekerjaan optimasi & status publikasi resmi
│   │   │   ├── master/              # Modul Manajemen Data Master CRUD
│   │   │   │   ├── classes/page.tsx # Rombel kelas, kuota mahasiswa, sort & search
│   │   │   │   ├── courses/page.tsx # Mata kuliah, SKS, semester, & rumpun KBK
│   │   │   │   ├── lecturers/page.tsx # Dosen & input preferensi waktu mengajar
│   │   │   │   ├── rooms/page.tsx   # Ruang kuliah, tipe (Teori/Lab), & kapasitas kursi
│   │   │   │   └── time-slots/page.tsx # Slot waktu & penanda ibadah Sholat Jumat
│   │   │   ├── schedule/page.tsx    # Tampilan tabel jadwal kuliah resmi & tombol ekspor
│   │   │   ├── schedule/matrix/page.tsx # Matriks kalender 2D ruangan vs slot waktu (Grid)
│   │   │   ├── globals.css          # Styling Tailwind CSS v4 & custom scrollbar
│   │   │   ├── layout.tsx           # Shell layout utama dengan Sidebar & TopNav
│   │   │   └── page.tsx             # Dashboard analitik KPI & ringkasan sistem
│   │   ├── components/              # Komponen UI modular
│   │   │   ├── EvolutionMonitor.tsx # Indikator live evolution (progres %, gen, fitness)
│   │   │   ├── GAController.tsx     # Form kontrol parameter Algoritma Genetika
│   │   │   ├── ManualSwapModal.tsx  # Modal penukaran jadwal manual anti-bentrok
│   │   │   ├── RoomMatrixGrid.tsx   # Render grid matriks 2D kalender ruangan
│   │   │   ├── ScheduleTable.tsx    # Tabel jadwal kuliah dengan filter multi-kriteria
│   │   │   ├── Sidebar.tsx          # Navigasi sidebar collapsible responsif
│   │   │   └── TopNav.tsx           # Bar atas dengan toggle sidebar, info TA & semester
│   │   ├── context/
│   │   │   └── SidebarContext.tsx   # Pengelola state sidebar (expand / collapse)
│   │   └── lib/
│   │       ├── api.ts               # Klien API fetcher dengan auto-resolving LAN hostname & proxy
│   │       └── types.ts             # Definisi tipe TypeScript untuk seluruh entitas sistem
│   ├── next.config.ts               # Konfigurasi Next.js, Turbopack, LAN origins dinamis, & rewrites
│   ├── package.json                 # Dependensi frontend & script npm
│   ├── tsconfig.json                # Konfigurasi TypeScript
│   └── README.md                    # Dokumentasi modul frontend
├── docs/
│   ├── DESIGN.md                    # Panduan sistem desain antarmuka, warna, & token UI
│   └── PRD.md                       # Product Requirement Document (spesifikasi teknis lengkap)
├── start-all.bat                    # Skrip launcher instan satu-klik untuk Windows (CMD)
├── start-all.ps1                    # Skrip launcher instan untuk PowerShell
├── GEMINI.md                        # Pedoman operasional AI & ringkasan arsitektur sistem
└── README.md                        # Dokumentasi utama proyek
```

---

## 📡 Referensi Antarmuka Pemrograman Aplikasi (REST API)

Seluruh endpoint backend berada di bawah prefix `/api/v1` dan dapat diuji secara interaktif melalui **Swagger UI** di `http://127.0.0.1:8000/docs`.

### 1. Manajemen Data Master (`/api/v1/master`)

| Metode | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` / `POST` | `/api/v1/master/lecturers` | Menampilkan seluruh dosen / Menambahkan dosen baru |
| `PUT` / `DELETE` | `/api/v1/master/lecturers/{id}` | Memperbarui / Menghapus data dosen |
| `GET` / `POST` | `/api/v1/master/rooms` | Menampilkan seluruh ruangan / Menambahkan ruang baru |
| `PUT` / `DELETE` | `/api/v1/master/rooms/{id}` | Memperbarui / Menghapus data ruangan |
| `GET` / `POST` | `/api/v1/master/time-slots` | Menampilkan seluruh slot waktu / Menambahkan slot baru |
| `PUT` / `DELETE` | `/api/v1/master/time-slots/{id}` | Memperbarui / Menghapus slot waktu perkuliahan |
| `GET` / `POST` | `/api/v1/master/courses` | Menampilkan katalog mata kuliah / Menambah MK baru |
| `PUT` / `DELETE` | `/api/v1/master/courses/{id}` | Memperbarui / Menghapus data mata kuliah |
| `GET` / `POST` | `/api/v1/master/classes` | Menampilkan rombel kelas / Menambahkan rombel kelas baru |
| `PUT` / `DELETE` | `/api/v1/master/classes/{id}` | Memperbarui / Menghapus rombel kelas perkuliahan |
| `GET` / `POST` | `/api/v1/master/preferences` | Menampilkan preferensi waktu dosen / Menambah preferensi |
| `DELETE` | `/api/v1/master/preferences/{id}` | Menghapus preferensi waktu dosen |

### 2. Validasi Kelayakan & Pencegahan Konflik (`/api/v1/conflicts`)

| Metode | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/v1/conflicts/pre-check` | Validasi kelayakan rasio kapasitas ruangan, slot waktu, dan beban dosen sebelum GA dijalankan (`200 OK` / `422 Unprocessable Entity`) |

### 3. Penjadwalan & Algoritma Genetika (`/api/v1/schedules`)

| Metode | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/api/v1/schedules/generate` | Memicu optimasi GA asinkron di latar belakang (`202 Accepted` + `job_id`) |
| `GET` | `/api/v1/schedules/jobs/{job_id}/status` | Polling status eksekusi GA (persentase progres, generasi saat ini, fitness, konflik) |
| `GET` | `/api/v1/schedules/jobs/{job_id}/result` | Mengambil matriks jadwal (mendukung filter `semester`, `kbk`, `lecturer_id`, `room_id`) |
| `GET` | `/api/v1/schedules/jobs` | Menampilkan daftar riwayat seluruh pekerjaan optimasi jadwal yang pernah dijalankan |
| `PATCH` | `/api/v1/schedules/jobs/{job_id}/publish` | Menetapkan hasil generasi jadwal sebagai jadwal perkuliahan resmi aktif (`is_published`) |
| `POST` | `/api/v1/schedules/{schedule_id}/manual-swap` | Validasi bentrok dan penukaran slot waktu/ruangan secara manual pasca-generasi |
| `GET` | `/api/v1/schedules/jobs/{job_id}/export` | Mengunduh jadwal resmi ke format binary (`?format=excel` untuk `.xlsx` atau `?format=pdf` untuk `.pdf`) |

---

## ⚙️ Panduan Pemasangan & Instalasi (Setup Guide)

Ikuti panduan langkah demi langkah di bawah ini untuk memasang dan menjalankan sistem di komputer lokal Anda:

### 1. Prasyarat Sistem

Pastikan perangkat Anda telah terpasang:
- **Git:** Versi terbaru ([Unduh Git](https://git-scm.com/))
- **Python:** Versi 3.10 atau lebih baru ([Unduh Python](https://www.python.org/))
- **Node.js:** Versi 18.x atau 20.x+ beserta **npm** ([Unduh Node.js](https://nodejs.org/))

---

### 2. Kloning Repositori

Buka terminal (PowerShell, Command Prompt, atau Bash) dan kloning repositori ini:

```bash
git clone https://github.com/Rizkan25/Sistem-Penjadwalan-Kuliah-Berbasis-Algoritma-Genetika.git
cd Sistem-Penjadwalan-Kuliah-Berbasis-Algoritma-Genetika
```

---

### 3. Pemasangan & Konfigurasi Backend

Masuk ke folder `backend`, buat _virtual environment_, pasang paket dependensi, dan inisialisasi basis data:

```bash
# 1. Masuk ke direktori backend
cd backend

# 2. Buat virtual environment Python
python -m venv .venv

# 3. Aktifkan virtual environment
# Pada Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Catatan: Jika muncul kendala script execution policy pada PowerShell, jalankan:
# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Pada Windows (CMD):
.\.venv\Scripts\activate.bat

# Pada Linux / macOS:
source .venv/bin/activate

# 4. Perbarui pip dan pasang library dependensi
pip install --upgrade pip
pip install -r requirements.txt
```

#### Inisialisasi Data Master & Sinkronisasi Kurikulum Resmi:

Pilih opsi pengisian data sesuai kebutuhan pengujian Anda:

```bash
# OPSI A: Seeder Dasar (31 Dosen, 28 Ruangan Kampus UBBG, Slot Waktu & Preferensi)
python -m app.seed_data

# OPSI B: Sinkronisasi Dosen Resmi dari Website Prodi S1 Ilmu Komputer UBBG (ilkom.bbg.ac.id)
python -m app.sync_web_lecturers --clean-dummy

# OPSI C: Sinkronisasi Kurikulum 71+ Mata Kuliah Lengkap dari OpenSIMKA UBBG
python -m app.sync_simka_courses

# OPSI D: Inisialisasi Dataset Lengkap Kurikulum Aktif (52 Rombel Kelas Semester 1–5)
python -m app.migrate_real_courses

# OPSI E: Kalibrasi Kuota Kelas terhadap Daya Tampung 28 Ruangan Kampus (Pencegahan HC_4)
python -m app.adjust_class_capacities

# OPSI F: (Opsional) Tambahkan Mata Kuliah Semester Genap (Sem 2, 4, 6, 8)
python -m app.seed_even_courses

# Kembali ke folder root proyek
cd ..
```

> [!NOTE]
> Secara default, aplikasi menggunakan SQLite lokal berkinerja tinggi dengan mode **WAL (_Write-Ahead Logging_)** sehingga tidak memerlukan instalasi server database eksternal. Jika ingin menghubungkan ke PostgreSQL / AlloyDB, cukup atur variabel lingkungan `DATABASE_URL=postgresql://user:password@host:port/dbname`.

---

### 4. Pemasangan Dependensi Frontend

Masuk ke folder `frontend` dan pasang dependensi npm:

```bash
# 1. Masuk ke direktori frontend
cd frontend

# 2. Pasang dependensi npm
npm install

# 3. Kembali ke folder root proyek
cd ..
```

---

## 🚀 Menjalankan Aplikasi

Anda dapat menjalankan backend dan frontend secara bersamaan menggunakan salah satu dari metode praktis berikut:

### ⚡ Metode 1: Menggunakan Skrip Cepat Satu-Klik (Sangat Disarankan)

#### Melalui PowerShell:

```powershell
.\start-all.ps1
```

#### Melalui Windows Explorer / Command Prompt:

Cukup klik dua kali (_double-click_) pada berkas:

```text
start-all.bat
```

> [!TIP]
> Skrip otomatis meluncurkan dua jendela terminal terpisah:
> 1. Terminal Backend: FastAPI di `http://127.0.0.1:8000` (Docs: `http://127.0.0.1:8000/docs`)
> 2. Terminal Frontend: Next.js di `http://localhost:3000`

---

### 💻 Metode 2: Menjalankan Secara Manual (2 Terminal Terpisah)

#### Terminal 1: Backend (FastAPI)

```bash
cd backend
# Aktifkan virtual environment (.venv)
.\.venv\Scripts\activate
# Jalankan server API (Otomatis bind ke 0.0.0.0:8000)
python run.py
```

- Endpoint API Backend: **http://127.0.0.1:8000**
- Dokumentasi Interaktif Swagger UI: **http://127.0.0.1:8000/docs**
- Dokumentasi Alternatif ReDoc: **http://127.0.0.1:8000/redoc**

#### Terminal 2: Frontend (Next.js)

```bash
cd frontend
npm run dev
```

- Antarmuka Web (Localhost): **http://localhost:3000**
- Antarmuka Web (Akses LAN/Smartphone): **http://<IP-Komputer-Anda>:3000** (misal: `http://192.168.1.15:3000`)

---

## 📱 Pengujian Akses Multi-Device & Jaringan Lokal (Wi-Fi/LAN)

Sistem telah dirancang agar dapat diuji langsung dari berbagai perangkat (laptop dosen, tablet, atau smartphone mahasiswa) yang berada dalam satu jaringan Wi-Fi lokal:

1. **Auto-Binding Jaringan:**
   - Backend berjalan pada `0.0.0.0:8000` dengan izin `CORSMiddleware(allow_origins=["*"], allow_private_network=True)`.
   - Frontend Next.js berjalan pada `-H 0.0.0.0 -p 3000`.
2. **Cek Alamat IP Komputer Anda:**
   - Pada Windows terminal, ketik `ipconfig` dan catat baris **IPv4 Address** pada adapter Wi-Fi (misalnya: `192.168.1.15`).
   - Terminal Next.js juga secara otomatis mencetak tautan akses jaringan saat Anda menjalankan `npm run dev`.
3. **Buka dari Smartphone / Laptop Lain:**
   - Hubungkan smartphone ke Wi-Fi yang sama dengan komputer host.
   - Buka browser di smartphone dan akses: `http://192.168.1.15:3000`.
   - Seluruh fitur (Dashboard, Generator GA, Matriks Ruangan, dan Ekspor Jadwal) dapat diakses dengan lancar karena panggilan API otomatis di-proxy oleh Next.js Rewrites.

---

## 📊 Hasil Uji Konvergensi Algoritma Genetika

| Skenario Pengujian                      | Jumlah Kelas | Ukuran Populasi | Maks. Generasi | Waktu Komputasi | Pelanggaran Mutlak (_Hard Conflicts_) | Pelanggaran Lunak (_Soft Conflicts_) |      Skor Fitness      |
| :-------------------------------------- | :----------: | :-------------: | :------------: | :-------------: | :-----------------------------------: | :----------------------------------: | :--------------------: |
| **Dataset Kurikulum Inti (Sem 1–5)**    | **52 Kelas** |   60 individu   |  150 generasi  | **~2.4 detik**  |      **0 (Nol / Zero Conflict)**      |             **0 (Ideal)**             | **1.0 (Optimal Sempurna)** |
| **Dataset Skala Penuh Semester Ganjil** | **122 Kelas**|  100 individu   |  500 generasi  | **~34 detik**   |      **Minimal / Terkendali**         |             **Rendah**                | **Konvergen Teroptimasi** |

- ✅ **100% Bebas Bentrok Mutlak:** Seluruh dosen, 28 ruangan kelas/lab kampus, dan rombel mahasiswa berhasil terjadwal tanpa tumpang tindih ($HC_1$ s/d $HC_6$ = 0).
- ✅ **Paralel Multi-KBK Berjalan Sempurna:** Kelas peminatan spesifik (Pemrograman, Multimedia, dan IoT) pada cohort yang sama sukses dialokasikan pada slot jam yang bersamaan di laboratorium berbeda tanpa konflik rombel.
- ✅ **Bebas Request Timeout:** Pembuatan jadwal berlangsung di latar belakang dengan respons instan `202 Accepted` dan indikator progres real-time.
- ✅ **Hasil Siap Cetak:** Jadwal dapat langsung diekspor ke format Excel (`.xlsx`) berlogo UBBG maupun PDF (`.pdf`) format landscape resmi.

---

## 🤝 Panduan Kontribusi & Kolaborasi (Contributing)

Kontribusi dan kolaborasi terbuka bagi siapa saja! Jika Anda ingin memperbaiki _bug_, mengoptimalkan performa algoritma genetika, atau menambahkan fitur baru:

1. **Fork Repositori ini:** Klik tombol **Fork** di pojok kanan atas halaman GitHub repositori ini.
2. **Buat Branch Fitur Baru:**
   ```bash
   git checkout -b feature/FiturKerenAnda
   ```
3. **Lakukan Perubahan & Commit:**
   ```bash
   git commit -m "feat: Menambahkan visualisasi analitik jadwal baru"
   ```
4. **Push ke Branch Anda:**
   ```bash
   git push origin feature/FiturKerenAnda
   ```
5. **Buka Pull Request (PR):** Masuk ke repositori GitHub asli dan klik **"New Pull Request"**. Jelaskan perubahan yang Anda buat secara jelas dan rinci.

### Rencana Pengembangan Mendatang (Roadmap)

- [x] Inisialisasi heuristik penempatan ruangan & mutasi adaptif anti-stagnasi.
- [x] Matriks kalender 2D ruangan vs sesi waktu (_Room-Time Grid_).
- [x] Fitur penyesuaian jadwal manual pasca-generasi (_Manual Swap_) dengan proteksi bentrok.
- [x] Ekspor jadwal resmi ke format Excel (`.xlsx`) dan PDF (`.pdf`).
- [x] Dukungan multi-device & pengujian via jaringan lokal (LAN binding dinamis).
- [x] Sinkronisasi otomatis data dosen dari website resmi prodi S1 Ilmu Komputer UBBG (`ilkom.bbg.ac.id`).
- [x] Integrasi kurikulum 71+ mata kuliah lengkap berbasis portal OpenSIMKA UBBG.
- [x] Optimalisasi isolasi konkurensi database SQLite dengan mode WAL (_Write-Ahead Logging_).
- [ ] Penambahan sistem autentikasi multi-peran (Admin Akademik, Dosen, Mahasiswa) berbasis JWT / OAuth2.
- [ ] Integrasi notifikasi email otomatis ke dosen saat jadwal resmi dipublikasikan (`is_published = True`).
- [ ] Fitur _Drag-and-Drop Schedule Adjustment_ langsung pada tampilan kalender matriks ruangan.
- [ ] Ekspor ke format Kalender Google (`.ics`) untuk sinkronisasi jadwal dosen dan mahasiswa ke smartphone.

---

## 📜 Lisensi

Proyek ini didistribusikan di bawah lisensi **MIT License**. Silakan gunakan, pelajari, dan kembangkan untuk keperluan riset akademik maupun implementasi institusi perguruan tinggi.
