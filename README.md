# Sistem Penjadwalan Kuliah Berbasis Algoritma Genetika (SPK-AG)

### Program Studi Ilmu Komputer — Universitas Bina Bangsa Getsempena (UBBG) Banda Aceh

Aplikasi web full-stack modern untuk otomatisasi penyusunan jadwal kuliah bebas bentrok (_Zero Hard Conflicts_) menggunakan **Algoritma Genetika (GA)** secara asinkron, dilengkapi pemodelan kurikulum 3 Kelompok Bidang Keahlian (KBK: Pemrograman, Multimedia, IoT), aturan khusus ibadah Sholat Jumat, dan visualisasi OpenSIMKA Theme.

---

## 🌟 Fitur Utama

1. **Mesin Optimasi Algoritma Genetika (GA Engine):**
   - **6 Batasan Keras ($HC_1$ - $HC_6$):** Bebas bentrok dosen, bebas bentrok ruangan, bebas bentrok rombel mahasiswa dengan dukungan kelas paralel antar-KBK, kecukupan daya tampung kursi ruangan, kesesuaian tipe ruangan (Teori vs Lab Praktikum), dan kepatuhan waktu berhalangan hadir dosen (_UNAVAILABLE_).
   - **3 Batasan Lunak ($SC_1$ - $SC_3$):** Pemenuhan waktu prioritas mengajar dosen (_PREFERRED_), minimasi jam kosong mahasiswa (_Gap Hours_), dan pemerataan beban mengajar dosen harian (maksimal 3 sesi/hari).
   - **Inisialisasi Heuristik & Mutasi Adaptif:** Memastikan $HC_4$ dan $HC_5$ langsung terpenuhi sejak generasi awal, serta injeksi diversitas mutasi $0.25$ jika terjadi stagnasi evolusi.
2. **Arsitektur Asinkron & Anti-Timeout:**
   - FastAPI mengembalikan respons `202 Accepted` instan, mendelegasikan tugas komputasi ke Celery Worker / Background Thread tanpa memutuskan koneksi HTTP.
   - Frontend melakukan polling berkala untuk memperbarui persentase progres, nomor generasi, dan nilai fitness terbaik secara real-time.
3. **Antarmuka Pengguna Modern (OpenSIMKA Theme):**
   - **Dashboard Eksekutif:** KPI card statistik dosen, ruangan, mata kuliah, rombel, dan status rilis jadwal aktif.
   - **Live Evolution Monitor:** Progress bar, counter generasi, skor fitness terbaik, dan indikator sisa konflik.
   - **Tabel Jadwal Terpadu:** Layout vertikal hari & sesi jam, badge rombel & SKS, stack avatar dosen, filter multi-dimensi (Semester, KBK, Dosen, Ruangan, Keyword).
   - **Matriks Kalender Ruangan (Room-Time Grid):** Sumbu X ruangan, sumbu Y sesi jam, tab hari (Senin–Sabtu), dan indikator visual kunci ibadah Sholat Jumat (11:30–14:00 WIB).
   - **Penyesuaian Manual Anti-Bentrok (_Manual Swap_):** Fitur tukar slot/ruangan pasca-generasi yang divalidasi langsung oleh sistem.
   - **Ekspor Dokumen Resmi:** Unduh jadwal dalam format Excel (`.xlsx`) dan PDF (`.pdf`) berdesain resmi UBBG dalam 1 klik.
   - **CRUD Data Master:** Pengelolaan data dosen & preferensi, ruangan & kapasitas, mata kuliah & SKS, rombel kelas, serta slot waktu pembelajaran.

---

## 🏗️ Struktur Proyek

```text
├── backend/
│   ├── app/
│   │   ├── api/             # REST API routers (master, schedules, conflicts)
│   │   ├── ga/              # GA Core (chromosome, fitness, operators, engine)
│   │   ├── models/          # SQLAlchemy Database Models (PostgreSQL / SQLite)
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── celery_app.py    # Celery & Redis configuration
│   │   ├── config.py        # Environment settings
│   │   ├── database.py      # Database engine & cross-platform GUID type
│   │   ├── exporter.py      # Excel (openpyxl) & PDF (reportlab) exporter
│   │   ├── main.py          # FastAPI application entry point
│   │   ├── seed_data.py     # Initial UBBG Computer Science dataset seeder
│   │   └── tasks.py         # Celery tasks & GA execution dispatcher
│   ├── requirements.txt     # Python dependencies
│   └── run.py               # Uvicorn launcher
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx               # Dashboard overview
│   │   │   ├── generator/page.tsx     # GA Control Panel & Evolution Monitor
│   │   │   ├── history/page.tsx       # Optimization history
│   │   │   ├── schedule/page.tsx      # Table View & Export
│   │   │   ├── schedule/matrix/page.tsx # Room-Time Matrix Grid
│   │   │   └── master/                # Master data management pages
│   │   ├── components/                # Reusable UI components
│   │   └── lib/                       # API client & TypeScript interfaces
│   └── package.json
└── docs/
    ├── PRD.md               # Product Requirement Document
    └── DESIGN.md            # Design System & UI/UX Guidelines
```

---

## 🚀 Panduan Menjalankan Sistem Secara Lokal

Anda dapat menjalankan seluruh sistem (Backend FastAPI + Frontend Next.js) menggunakan **salah satu dari 3 cara berikut**:

---

### Cara 1: Melalui Terminal IDE (PowerShell) — _Paling Cepat_

Buka terminal di root direktori proyek, lalu jalankan salah satu script berikut (wajib menggunakan awalan `.\`):

```powershell
.\start-all.ps1
# atau
.\start-all.bat
```

> **Catatan:** Dua jendela terminal baru akan otomatis terbuka untuk menjalankan Backend di `http://127.0.0.1:8000` dan Frontend di `http://localhost:3000`.

---

### Cara 2: Sekali Klik via File Explorer (Windows Double-Click)

1. Buka folder proyek di **Windows File Explorer**.
2. **Klik dua kali (double-click)** pada file `start-all.bat`.
3. Jendela terminal Backend dan Frontend akan otomatis aktif dan siap digunakan.

---

### Cara 3: Menjalankan Secara Manual (2 Terminal Terpisah)

Jika ingin memantau log masing-masing server secara detail:

#### 🔹 Terminal 1: Backend (FastAPI + Celery + GA Engine)

```powershell
cd backend

# 1. Aktifkan virtual environment Python (Windows)
.\.venv\Scripts\Activate.ps1

# 2. (Opsional) Inisialisasi data master UBBG jika database masih baru
python -m app.seed_data

# 3. Jalankan server FastAPI
python run.py
```

> - Backend API aktif di: **http://127.0.0.1:8000**
> - Dokumentasi Interaktif Swagger: **http://127.0.0.1:8000/docs**

_(Opsional: Jika menggunakan Redis, jalankan worker Celery di terminal tambahan: `celery -A app.celery_app worker --loglevel=info -P solo`. Jika Redis tidak ada, sistem otomatis menggunakan background thread internal)._

#### 🔹 Terminal 2: Frontend (Next.js 16 + Turbopack)

```powershell
cd frontend

# Jalankan server pengembangan Next.js
npm run dev
```

> - Antarmuka Web aktif di: **http://localhost:3000**
> - Halaman Master Kelas: **http://localhost:3000/master/classes**

---

## 📊 Hasil Uji Konvergensi Algoritma

| Skenario Pengujian              | Jumlah Kelas | Ukuran Populasi | Maks. Generasi | Waktu Komputasi | Hard Conflicts | Soft Conflicts | Fitness Score |
| :------------------------------ | :----------: | :-------------: | :------------: | :-------------: | :------------: | :------------: | :-----------: |
| Dataset Lengkap Sem Ganjil UBBG |   33 Kelas   |   60 individu   |  150 generasi  | **~1.5 detik**  |  **0 (Zero)**  | 1 (Preferred)  |  **0.5000**   |

Semua kriteria KPI pada PRD 2.1.0 terpenuhi:

1. Validitas jadwal 100% bebas bentrok mutlak (`hard_conflicts_count = 0`).
2. Generasi jadwal selesai dalam waktu < 3 menit.
3. Bebas request timeout berkat arsitektur task dispatcher asinkron.
4. Export dokumen resmi Excel & PDF berfungsi sempurna.
