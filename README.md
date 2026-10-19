# Sistem Penjadwalan Kuliah Berbasis Algoritma Genetika (SPK-AG)
### Program Studi Ilmu Komputer — Universitas Bina Bangsa Getsempena (UBBG) Banda Aceh

Aplikasi web full-stack modern untuk otomatisasi penyusunan jadwal kuliah bebas bentrok (*Zero Hard Conflicts*) menggunakan **Algoritma Genetika (GA)** secara asinkron, dilengkapi pemodelan kurikulum 3 Kelompok Bidang Keahlian (KBK: Pemrograman, Multimedia, IoT), aturan khusus ibadah Sholat Jumat, dan visualisasi OpenSIMKA Theme.

---

## 🌟 Fitur Utama

1. **Mesin Optimasi Algoritma Genetika (GA Engine):**
   - **6 Batasan Keras ($HC_1$ - $HC_6$):** Bebas bentrok dosen, bebas bentrok ruangan, bebas bentrok rombel mahasiswa dengan dukungan kelas paralel antar-KBK, kecukupan daya tampung kursi ruangan, kesesuaian tipe ruangan (Teori vs Lab Praktikum), dan kepatuhan waktu berhalangan hadir dosen (*UNAVAILABLE*).
   - **3 Batasan Lunak ($SC_1$ - $SC_3$):** Pemenuhan waktu prioritas mengajar dosen (*PREFERRED*), minimasi jam kosong mahasiswa (*Gap Hours*), dan pemerataan beban mengajar dosen harian (maksimal 3 sesi/hari).
   - **Inisialisasi Heuristik & Mutasi Adaptif:** Memastikan $HC_4$ dan $HC_5$ langsung terpenuhi sejak generasi awal, serta injeksi diversitas mutasi $0.25$ jika terjadi stagnasi evolusi.
2. **Arsitektur Asinkron & Anti-Timeout:**
   - FastAPI mengembalikan respons `202 Accepted` instan, mendelegasikan tugas komputasi ke Celery Worker / Background Thread tanpa memutuskan koneksi HTTP.
   - Frontend melakukan polling berkala untuk memperbarui persentase progres, nomor generasi, dan nilai fitness terbaik secara real-time.
3. **Antarmuka Pengguna Modern (OpenSIMKA Theme):**
   - **Dashboard Eksekutif:** KPI card statistik dosen, ruangan, mata kuliah, rombel, dan status rilis jadwal aktif.
   - **Live Evolution Monitor:** Progress bar, counter generasi, skor fitness terbaik, dan indikator sisa konflik.
   - **Tabel Jadwal Terpadu:** Layout vertikal hari & sesi jam, badge rombel & SKS, stack avatar dosen, filter multi-dimensi (Semester, KBK, Dosen, Ruangan, Keyword).
   - **Matriks Kalender Ruangan (Room-Time Grid):** Sumbu X ruangan, sumbu Y sesi jam, tab hari (Senin–Sabtu), dan indikator visual kunci ibadah Sholat Jumat (11:30–14:00 WIB).
   - **Penyesuaian Manual Anti-Bentrok (*Manual Swap*):** Fitur tukar slot/ruangan pasca-generasi yang divalidasi langsung oleh sistem.
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

### 1. Menjalankan Backend (FastAPI + Celery + Uvicorn)

Buka terminal pada direktori `backend`:

```bash
cd backend

# Aktifkan virtual environment (Windows)
.\.venv\Scripts\Activate.ps1

# (Opsional) Jalankan seeding data awal UBBG
python -m app.seed_data

# Jalankan server backend FastAPI
python run.py
```
> Server backend akan aktif di: **http://127.0.0.1:8000**  
> Dokumentasi interaktif Swagger API: **http://127.0.0.1:8000/docs**

### 2. Menjalankan Worker Celery (Opsional jika Redis aktif)

```bash
celery -A app.celery_app worker --loglevel=info -P solo
```
*(Catatan: Jika Redis tidak aktif, backend otomatis menggunakan fallback background threading terintegrasi sehingga komputasi GA tetap berjalan lancar dan anti-timeout tanpa konfigurasi tambahan).*

### 3. Menjalankan Frontend (Next.js)

Buka terminal pada direktori `frontend`:

```bash
cd frontend

# Jalankan server pengembangan Next.js
npm run dev
```
> Antarmuka web akan aktif di: **http://localhost:3000**

---

## 📊 Hasil Uji Konvergensi Algoritma

| Skenario Pengujian | Jumlah Kelas | Ukuran Populasi | Maks. Generasi | Waktu Komputasi | Hard Conflicts | Soft Conflicts | Fitness Score |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Dataset Lengkap Sem Ganjil UBBG | 33 Kelas | 60 individu | 150 generasi | **~1.5 detik** | **0 (Zero)** | 1 (Preferred) | **0.5000** |

Semua kriteria KPI pada PRD 2.1.0 terpenuhi:
1. Validitas jadwal 100% bebas bentrok mutlak (`hard_conflicts_count = 0`).
2. Generasi jadwal selesai dalam waktu < 3 menit.
3. Bebas request timeout berkat arsitektur task dispatcher asinkron.
4. Export dokumen resmi Excel & PDF berfungsi sempurna.
