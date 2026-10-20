# Sistem Penjadwalan Kuliah Berbasis Algoritma Genetika (SPK-AG)

Aplikasi web _full-stack_ modern dan cerdas untuk otomatisasi pembuatan jadwal kuliah bebas bentrok (_Zero Hard Conflicts_) menggunakan **Algoritma Genetika (Genetic Algorithm)** secara asinkron. Sistem ini dirancang khusus untuk memecahkan kompleksitas _University Course Timetabling Problem_ (UCTP) pada **Program Studi S1 Ilmu Komputer, Universitas Bina Bangsa Getsempena (UBBG) Banda Aceh**, yang mencakup kelas reguler umum dan percabangan 3 Kelompok Bidang Keahlian (KBK: Pemrograman, Multimedia, dan IoT) yang berjalan secara paralel.

---

## 🌟 Fitur Unggulan

### 1. Mesin Optimasi Algoritma Genetika (GA Engine)

- **6 Batasan Keras (_Hard Constraints_ - $HC_1$ s/d $HC_6$ / Wajib Nol Pelanggaran):**
  - **$HC_1$ (Bebas Bentrok Dosen):** Seorang dosen tidak boleh mengajar lebih dari 1 kelas pada slot waktu yang bersamaan.
  - **$HC_2$ (Bebas Bentrok Ruangan):** Suatu ruangan tidak boleh digunakan oleh lebih dari 1 sesi perkuliahan pada slot waktu yang bersamaan.
  - **$HC_3$ (Bebas Bentrok Rombel & Aturan Paralel KBK):** Kelas pada semester dan kelompok (_cohort_) yang sama tidak boleh bertabrakan, kecuali kelas peminatan spesifik antar-KBK yang berbeda (misalnya: kelas KBK Pemrograman dan KBK Multimedia diizinkan berjalan paralel di ruangan terpisah).
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

### 2. Antarmuka Modern & Responsif (Frontend)

- **Desain Adaptif OpenSIMKA UBBG:** Mengusung filosofi desain data modern berbasis _Teal-Blue_ (`#1D8699`), _Warm Amber_ (`#D4822A`), dan _Slate Canvas_ yang bersih dan elegan.
- **Sidebar Buka-Tutup (_Collapsible Responsive Navigation_):** Dapat diperkecil menjadi mode bilah ikon ramping (72px) di desktop dengan _floating hover tooltip_, serta dilengkapi _backdrop overlay_ otomatis untuk tampilan perangkat seluler.
- **Live Evolution Monitor:** Visualisasi pemantauan progres generasi algoritma secara _real-time_ (persentase, counter generasi, skor fitness terbaik, dan indikator sisa konflik) via polling asinkron anti-timeout.
- **Matriks Kalender Ruangan (_Room-Time Grid_):** Visualisasi matriks 2D interaktif (Sumbu X: Ruangan, Sumbu Y: Sesi Waktu) lengkap dengan penanda blokade waktu ibadah Sholat Jumat dan badge jenis kelas.
- **Penyesuaian Manual Anti-Bentrok (_Manual Swap Modal_):** Fitur tukar slot/ruangan pasca-generasi yang divalidasi langsung oleh sistem terhadap batasan $HC_1$ hingga $HC_6$.
- **Table Sorting & Quick Search:** Pengurutan kolom interaktif dua arah (A–Z / Z–A) pada nama kelas, mata kuliah, dosen, semester, KBK, dan kuota mahasiswa, dilengkapi bilah pencarian instan.
- **Ekspor Dokumen Resmi:** Unduh jadwal hasil optimasi ke format **Excel (`.xlsx`)** (berformat tabel resmi UBBG berwarna) dan **PDF (`.pdf`)** (format A4 Landscape siap cetak) dalam 1 klik.
- **CRUD Data Master Komprehensif:** Manajemen data Dosen & Preferensi Waktu, Ruangan & Tipe/Kapasitas, Mata Kuliah & SKS, Rombel Kelas Akademik (dengan modal Tambah & Edit), serta Slot Waktu.
- **Dukungan Akses Multi-Device & Jaringan Lokal (LAN):** Server otomatis di-bind ke `0.0.0.0` dan klien API mendeteksi hostname browser secara dinamis, memungkinkan pengujian langsung dari laptop maupun smartphone dalam satu jaringan Wi-Fi.

---

## 🛠️ Tumpukan Teknologi (Tech Stack)

| Komponen            | Teknologi                                          | Deskripsi                                                        |
| :------------------ | :------------------------------------------------- | :--------------------------------------------------------------- |
| **Frontend**        | Next.js 16 (App Router), React 19, TypeScript 5    | Antarmuka modern dengan engine Turbopack                         |
| **Styling**         | Tailwind CSS v4 (`@tailwindcss/turbopack`), Lucide | CSS-first configuration, ikon interaktif, performa tinggi        |
| **Backend API**     | FastAPI 0.146+ (Python 3.10+)                      | Framework RESTful API asinkron berperforma tinggi                |
| **Optimasi (GA)**   | Algoritma Genetika (NumPy, Python Core)            | Mesin komputasi heuristik UCTP dengan batasan keras & lunak      |
| **Basis Data**      | SQLite (Default Dev) / PostgreSQL (AlloyDB Ready)  | ORM SQLAlchemy 2.x dengan skema relasional terstruktur           |
| **Task Queue**      | Hybrid Executor (Celery + Redis / Thread Fallback) | Komputasi optimasi latar belakang asinkron anti-timeout          |
| **Dokumentasi API** | OpenAPI (Swagger UI & ReDoc)                       | Dokumentasi API interaktif bawaan di `/docs`                     |
| **Ekspor File**     | OpenPyXL 3.1.5 (Excel), ReportLab 5.0.1 (PDF)      | Generator dokumen jadwal resmi siap cetak dan arsip              |

---

## 📂 Struktur Repositori

```text
├── backend/
│   ├── app/
│   │   ├── api/                     # Endpoint REST API (master, schedules, conflicts)
│   │   │   ├── conflicts.py         # Endpoint pre-feasibility check & validasi bentrok
│   │   │   ├── master.py            # CRUD dosen, ruangan, slot waktu, MK, kelas, preferensi
│   │   │   └── schedules.py         # Trigger GA, polling status, manual swap, ekspor file
│   │   ├── ga/                      # Inti Mesin Algoritma Genetika
│   │   │   ├── chromosome.py        # Struktur gen, kelas, ruangan, slot waktu, context
│   │   │   ├── engine.py            # GA loop, adaptive mutation, elitism, termination
│   │   │   ├── fitness.py           # Evaluasi 6 hard constraints & 3 soft constraints
│   │   │   └── operators.py         # Tournament selection, uniform crossover, swap mutation
│   │   ├── models/                  # Model database SQLAlchemy
│   │   │   ├── master.py            # Tabel lecturers, rooms, time_slots, courses, academic_classes
│   │   │   └── schedule.py          # Tabel schedule_jobs & schedules
│   │   ├── schemas/                 # Validasi skema input/output Pydantic v2
│   │   ├── celery_app.py            # Konfigurasi Celery & antrean Redis
│   │   ├── config.py                # Konfigurasi environment & variabel sistem
│   │   ├── database.py              # Engine koneksi basis data & session factory
│   │   ├── exporter.py              # Generator dokumen resmi Excel (.xlsx) & PDF (.pdf)
│   │   ├── main.py                  # Entry point FastAPI, CORS LAN, & auto-seeder lifespan
│   │   ├── migrate_real_courses.py  # Skrip migrasi kurikulum resmi & 52 kelas akademik
│   │   ├── seed_data.py             # Seeder master data (dosen, ruang, slot, MK, preferensi)
│   │   ├── seed_even_courses.py     # Seeder mata kuliah semester genap (Sem 2, 4, 6, 8)
│   │   └── tasks.py                 # Task runner asinkron (Celery worker / background thread)
│   ├── requirements.txt             # Dependensi pustaka Python
│   ├── run.py                       # Launcher server Uvicorn (port 8000)
│   └── spk_ag.db                    # Database SQLite lokal
├── frontend/
│   ├── public/                      # Aset statis & logo SVG
│   ├── src/
│   │   ├── app/
│   │   │   ├── generator/page.tsx   # GA Control Panel, parameter form, & evolution monitor
│   │   │   ├── history/page.tsx     # Riwayat pekerjaan optimasi & status publikasi
│   │   │   ├── master/              # Manajemen Data Master CRUD
│   │   │   │   ├── classes/page.tsx # Rombel kelas, kuota mahasiswa, sort & search
│   │   │   │   ├── courses/page.tsx # Mata kuliah, SKS, semester, & KBK
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
│   │       ├── api.ts               # Klien API fetcher dengan auto-resolving LAN hostname
│   │       └── types.ts             # Definisi antarmuka TypeScript untuk seluruh entitas
│   ├── next.config.ts               # Konfigurasi Next.js, Turbopack, LAN origins, & rewrites
│   ├── package.json                 # Dependensi frontend & script npm
│   └── tsconfig.json                # Konfigurasi TypeScript
├── docs/
│   ├── DESIGN.md                    # Panduan sistem desain antarmuka, warna, & token UI
│   └── PRD.md                       # Product Requirement Document (spesifikasi teknis lengkap)
├── start-all.bat                    # Skrip launcher instan satu-klik untuk Windows (CMD)
├── start-all.ps1                    # Skrip launcher instan untuk PowerShell
├── GEMINI.md                        # Pedoman operasional AI & ringkasan arsitektur sistem
└── README.md                        # Dokumentasi utama proyek
```

---

## ⚙️ Panduan Pemasangan & Instalasi (Setup Guide)

Ikuti langkah-langkah di bawah ini untuk memasang dan menjalankan proyek ini di lingkungan lokal Anda:

### 1. Prasyarat Sistem

Pastikan perangkat Anda telah terpasang:

- **Git:** Versi terbaru ([Unduh Git](https://git-scm.com/))
- **Python:** Versi 3.10 atau lebih baru ([Unduh Python](https://www.python.org/))
- **Node.js:** Versi 18.x atau 20.x+ beserta **npm** ([Unduh Node.js](https://nodejs.org/))

---

### 2. Kloning Repositori

Buka terminal dan lakukan kloning repositori:

```bash
git clone https://github.com/Rizkan25/Sistem-Penjadwalan-Kuliah-Berbasis-Algoritma-Genetika.git
cd Sistem-Penjadwalan-Kuliah-Berbasis-Algoritma-Genetika
```

---

### 3. Pemasangan & Konfigurasi Backend

Masuk ke folder `backend`, buat _virtual environment_, pasang dependensi, dan lakukan inisialisasi basis data:

```bash
# 1. Masuk ke direktori backend
cd backend

# 2. Buat virtual environment Python
python -m venv .venv

# 3. Aktifkan virtual environment
# Pada Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Pada Windows (CMD):
.\.venv\Scripts\activate.bat
# Pada Linux / macOS:
source .venv/bin/activate

# 4. Perbarui pip dan pasang library dependensi
pip install --upgrade pip
pip install -r requirements.txt

# 5. Inisialisasi basis data & masukkan dataset kurikulum resmi
python -m app.seed_data

# (Opsional) Jika ingin memperbarui/mereset kurikulum lengkap 52 kelas:
# python -m app.migrate_real_courses

# 6. Kembali ke folder root proyek
cd ..
```

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

Anda dapat menjalankan backend dan frontend secara bersamaan menggunakan salah satu dari metode berikut:

### ⚡ Metode 1: Menggunakan Skrip Cepat (Sangat Disarankan)

#### Melalui PowerShell:

```powershell
.\start-all.ps1
```

#### Melalui Windows File Explorer / Command Prompt:

Cukup klik dua kali (_double-click_) file:

```text
start-all.bat
```

> **Catatan:** Skrip otomatis membuka dua terminal terpisah: satu untuk Backend FastAPI (`port 8000`) dan satu untuk Frontend Next.js (`port 3000`).

---

### 💻 Metode 2: Menjalankan Secara Manual (2 Terminal)

#### Terminal 1: Backend (FastAPI)

```bash
cd backend
.\.venv\Scripts\activate
python run.py
```

- Endpoint API Backend: **http://127.0.0.1:8000**
- Dokumentasi Interaktif Swagger UI: **http://127.0.0.1:8000/docs**
- Dokumentasi ReDoc: **http://127.0.0.1:8000/redoc**

#### Terminal 2: Frontend (Next.js)

```bash
cd frontend
npm run dev
```

- Antarmuka Web (Localhost): **http://localhost:3000**
- Antarmuka Web (Akses LAN/HP): **http://<IP-Komputer-Anda>:3000** (misal: `http://192.168.0.80:3000`)

---

## 📊 Hasil Uji Konvergensi Algoritma

| Skenario Pengujian                      | Jumlah Kelas | Ukuran Populasi | Maks. Generasi | Waktu Komputasi | Pelanggaran Mutlak (_Hard Conflicts_) | Pelanggaran Lunak (_Soft Conflicts_) |      Skor Fitness      |
| :-------------------------------------- | :----------: | :-------------: | :------------: | :-------------: | :-----------------------------------: | :----------------------------------: | :--------------------: |
| **Dataset Kurikulum Lengkap (Sem 1–5)** | **52 Kelas** |   60 individu   |  150 generasi  | **~2.4 detik**  |      **0 (Nol / Zero Conflict)**      |             **Minimal**              | **Tinggi / Konvergen** |

- ✅ **100% Bebas Bentrok Mutlak:** Seluruh dosen, ruangan kelas/lab, dan rombel mahasiswa terjadwal tanpa tumpang tindih ($HC_1$ s/d $HC_6$ = 0).
- ✅ **Paralel Multi-KBK Berjalan Sempurna:** Kelas peminatan spesifik (Pemrograman, Multimedia, dan IoT) pada cohort yang sama sukses dialokasikan pada jam yang bersamaan di laboratorium berbeda tanpa konflik rombel.
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
- [x] Dukungan multi-device & pengujian via jaringan lokal (LAN binding).
- [ ] Penambahan sistem autentikasi multi-peran (Admin Akademik, Dosen, Mahasiswa) berbasis JWT / OAuth2.
- [ ] Integrasi notifikasi email otomatis ke dosen saat jadwal resmi dipublikasikan (`is_published = True`).
- [ ] Fitur _Drag-and-Drop Schedule Adjustment_ langsung pada tampilan kalender matriks ruangan.
- [ ] Ekspor ke format Kalender Google (`.ics`) untuk sinkronisasi jadwal dosen dan mahasiswa ke smartphone.

---

## 📜 Lisensi

Proyek ini didistribusikan di bawah lisensi **MIT License**. Silakan gunakan, pelajari, dan kembangkan untuk keperluan riset akademik maupun implementasi institusi perguruan tinggi.
