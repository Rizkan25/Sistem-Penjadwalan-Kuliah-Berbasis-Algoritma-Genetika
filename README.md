# Sistem Penjadwalan Kuliah Berbasis Algoritma Genetika (SPK-AG)

Aplikasi web _full-stack_ modern dan cerdas untuk otomatisasi pembuatan jadwal kuliah bebas bentrok (_Zero Hard Conflicts_) menggunakan **Algoritma Genetika (Genetic Algorithm)** secara asinkron. Sistem ini dirancang khusus untuk menangani kompleksitas penjadwalan perguruan tinggi yang memiliki pembagian kelompok kelas reguler serta percabangan multi-Kelompok Bidang Keahlian (KBK) yang berjalan paralel.

---

## 🌟 Fitur Unggulan

### 1. Mesin Optimasi Algoritma Genetika (GA Engine)

- **6 Batasan Keras (_Hard Constraints_ - $HC_1$ s/d $HC_6$ / Pelanggaran = 0):**
  - **$HC_1$:** Bebas bentrok jadwal dosen (1 dosen hanya mengajar 1 kelas pada slot waktu yang sama).
  - **$HC_2$:** Bebas bentrok ruangan (1 ruangan hanya digunakan 1 kelas pada slot waktu yang sama).
  - **$HC_3$:** Bebas bentrok rombel mahasiswa dengan aturan paralel KBK (kelas peminatan spesifik seperti Pemrograman, Multimedia, dan IoT diizinkan berjalan paralel pada slot bersamaan di ruangan berbeda).
  - **$HC_4$:** Kapasitas kursi ruangan $\ge$ jumlah mahasiswa peserta kelas.
  - **$HC_5$:** Kesesuaian tipe ruangan (kelas teori dialokasikan di ruang kelas teori reguler, kelas praktikum dialokasikan di laboratorium komputer).
  - **$HC_6$:** Kepatuhan terhadap jadwal berhalangan hadir dosen (_UNAVAILABLE_).
- **3 Batasan Lunak (_Soft Constraints_ - $SC_1$ s/d $SC_3$ / Diupayakan Minimal):**
  - **$SC_1$:** Pemenuhan preferensi waktu prioritas mengajar dosen (_PREFERRED_).
  - **$SC_2$:** Minimasi jam kosong mahasiswa (_Gap Hours_) dalam satu hari kuliah.
  - **$SC_3$:** Pemerataan beban mengajar harian dosen (maksimal 3 blok sesi per hari).
- **Inisialisasi Heuristik & Mutasi Adaptif:**
  - Penempatan ruangan langsung mencocokkan tipe dan kapasitas sejak generasi awal.
  - Injeksi diversitas mutasi adaptif otomatis jika populasi mengalami stagnasi konvergensi (_premature convergence_).

### 2. Antarmuka Modern & Responsif

- **Sidebar Buka-Tutup (_Collapsible Navigation_):** Dapat diperkecil menjadi mode bilah ikon ramping (_icon-only_ 72px) dengan _floating hover tooltip_, memberikan ruang pandang yang jauh lebih luas bagi tabel dan matriks jadwal.
- **Table Sorting & Quick Search:** Pengurutan kolom interaktif dua arah (A–Z / Z–A) pada nama kelas, mata kuliah, dosen, semester, KBK, dan kuota mahasiswa, dilengkapi bilah pencarian instan.
- **Live Evolution Monitor:** Pemantauan progres generasi algoritma secara _real-time_ (persentase, counter generasi, skor fitness terbaik, dan indikator sisa konflik) via polling asinkron.
- **Matriks Kalender Ruangan (_Room-Time Grid_):** Visualisasi matriks 2D interaktif (Sumbu X: Ruangan, Sumbu Y: Sesi Waktu) lengkap dengan penanda blokade waktu ibadah Sholat Jumat.
- **Penyesuaian Manual Anti-Bentrok (_Manual Swap_):** Fitur tukar slot/ruangan pasca-generasi yang divalidasi langsung oleh sistem.
- **Ekspor Dokumen Resmi:** Unduh jadwal hasil optimasi ke format **Excel (`.xlsx`)** dan **PDF (`.pdf`)** berformat resmi siap cetak dalam 1 klik.
- **CRUD Data Master Komprehensif:** Manajemen data Dosen & Preferensi Waktu, Ruangan & Tipe, Mata Kuliah & SKS, Rombel Kelas (dengan modal Tambah & Edit), serta Slot Waktu.

---

## 🛠️ Tumpukan Teknologi

| Komponen        | Teknologi                                       | Deskripsi                                          |
| :-------------- | :---------------------------------------------- | :------------------------------------------------- |
| **Frontend**    | Next.js 16 (App Router), React 19, TypeScript   | Antarmuka pengguna modern dengan Turbopack         |
| **Styling**     | Tailwind CSS, Lucide React Icons                | Desain UI modern, responsif, dan rapi              |
| **Backend API** | FastAPI (Python 3.10+)                          | Framework RESTful API berkecepatan tinggi          |
| **Optimasi**    | Algoritma Genetika (NumPy, Python Core)         | Mesin komputasi kombinatorial jadwal UCTP          |
| **Basis Data**  | SQLite (Default Dev) / PostgreSQL (Production)  | ORM SQLAlchemy dengan skema relasional terstruktur |
| **Task Queue**  | Asynchronous Background Worker / Celery + Redis | Komputasi optimasi latar belakang anti-timeout     |
| **Dokumentasi** | OpenAPI (Swagger UI)                            | Dokumentasi API interaktif bawaan di `/docs`       |
| **Ekspor File** | OpenPyXL (Excel), ReportLab (PDF)               | Generator dokumen unduhan jadwal resmi             |

---

## 📂 Struktur Repositori

```text
├── backend/
│   ├── app/
│   │   ├── api/             # Endpoint REST API (master, schedules, conflicts)
│   │   ├── ga/              # Inti GA (chromosome, fitness, operators, engine)
│   │   ├── models/          # Model basis data SQLAlchemy
│   │   ├── schemas/         # Validasi skema data Pydantic
│   │   ├── celery_app.py    # Konfigurasi Celery & Redis
│   │   ├── config.py        # Pengaturan environment & variabel sistem
│   │   ├── database.py      # Engine koneksi database
│   │   ├── exporter.py      # Generator ekspor Excel & PDF
│   │   ├── main.py          # Entry point aplikasi FastAPI
│   │   ├── seed_data.py     # Seeder dataset kurikulum & kelas akademik
│   │   └── tasks.py         # Task dispatcher asinkron
│   ├── requirements.txt     # Dependensi library Python
│   └── run.py               # Launcher server Uvicorn
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                 # Dashboard ringkasan sistem
│   │   │   ├── generator/page.tsx       # GA Control Panel & Evolution Monitor
│   │   │   ├── history/page.tsx         # Riwayat pekerjaan optimasi
│   │   │   ├── schedule/page.tsx        # Tampilan tabel jadwal & ekspor
│   │   │   ├── schedule/matrix/page.tsx # Matriks kalender ruangan (Grid)
│   │   │   └── master/                  # Manajemen Data Master (Dosen, Ruang, MK, Kelas, Slot)
│   │   ├── components/                  # Komponen UI (Sidebar, TopNav, dsb.)
│   │   ├── context/                     # State management (SidebarContext)
│   │   └── lib/                         # Klien API fetcher & TypeScript types
│   ├── package.json         # Dependensi frontend & script npm
│   └── tailwind.config.ts   # Konfigurasi desain Tailwind
├── start-all.bat            # Skrip batch launcher satu klik (Windows)
├── start-all.ps1            # Skrip PowerShell launcher satu perintah
└── README.md                # Dokumentasi proyek
```

---

## ⚙️ Panduan Pemasangan & Instalasi (Setup Guide)

Ikuti langkah-langkah di bawah ini untuk memasang dan menjalankan proyek ini di komputer lokal Anda:

### 1. Prasyarat Sistem

Pastikan perangkat Anda telah terpasang:

- **Git:** Versi terbaru ([Unduh Git](https://git-scm.com/))
- **Python:** Versi 3.10 atau lebih baru ([Unduh Python](https://www.python.org/))
- **Node.js:** Versi 18.x atau 20.x+ beserta **npm** ([Unduh Node.js](https://nodejs.org/))

---

### 2. Kloning Repositori

Buka terminal dan lakukan _clone_ repositori ini:

```bash
git clone https://github.com/Rizkan25/Sistem-Penjadwalan-Kuliah-Berbasis-Algoritma-Genetika.git
cd Sistem-Penjadwalan-Kuliah-Berbasis-Algoritma-Genetika
```

---

### 3. Pemasangan & Konfigurasi Backend

Masuk ke folder `backend`, buat _virtual environment_, dan pasang dependensi Python:

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

# 6. Kembali ke folder root proyek
cd ..
```

---

### 4. Pemasangan Dependensi Frontend

Masuk ke folder `frontend` dan pasang paket Node.js:

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

#### Melalui Windows Command Prompt / File Explorer:

Cukup klik dua kali (_double-click_) file:

```text
start-all.bat
```

> Skrip ini akan secara otomatis membuka dua jendela terminal: satu untuk Backend FastAPI (`port 8000`) dan satu untuk Frontend Next.js (`port 3000`).

---

### 💻 Metode 2: Menjalankan Secara Manual (2 Terminal)

#### Terminal 1: Backend

```bash
cd backend
.\.venv\Scripts\activate
python run.py
```

- API Backend aktif di: **http://127.0.0.1:8000**
- Dokumentasi Swagger interaktif di: **http://127.0.0.1:8000/docs**

#### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

- Antarmuka web aktif di: **http://localhost:3000**

---

## 📊 Hasil Uji Konvergensi Algoritma

| Skenario Pengujian                      | Jumlah Kelas | Ukuran Populasi | Maks. Generasi | Waktu Komputasi | Pelanggaran Mutlak (_Hard Conflicts_) |      Skor Fitness      |
| :-------------------------------------- | :----------: | :-------------: | :------------: | :-------------: | :-----------------------------------: | :--------------------: |
| **Dataset Kurikulum Lengkap (Sem 1–5)** | **52 Kelas** |   60 individu   |  150 generasi  | **~2.4 detik**  |      **0 (Nol / Zero Conflict)**      | **Tinggi / Konvergen** |

- ✅ **100% Bebas Bentrok:** Seluruh dosen, ruangan kelas/lab, dan rombel mahasiswa terjadwal tanpa tumpang tindih.
- ✅ **Kelas Paralel Berjalan Mulus:** Kelas peminatan spesifik (Pemrograman, Multimedia, dan IoT) pada cohort yang sama sukses dialokasikan pada jam yang bersamaan di laboratorium berbeda.
- ✅ **Bebas Request Timeout:** Pembuatan jadwal berlangsung di latar belakang dengan respons instan `202 Accepted`.

---

## 🤝 Panduan Kontribusi & Kolaborasi (Contributing)

Kontribusi dan kolaborasi terbuka bagi siapa saja! Jika Anda ingin memperbaiki _bug_, mengoptimalkan algoritma, atau menambahkan fitur baru:

1. **Fork Repositori ini:**
   Klik tombol **Fork** di pojok kanan atas halaman GitHub repositori ini.
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
5. **Buka Pull Request (PR):**
   Masuk ke repositori GitHub asli dan klik **"New Pull Request"**. Jelaskan perubahan yang Anda buat secara jelas.

### Ide Pengembangan Mendatang (Roadmap)

- [ ] Penambahan autentikasi multi-peran (Admin Akademik, Dosen, Mahasiswa) berbasis JWT / OAuth2.
- [ ] Integrasi notifikasi email otomatis ke dosen saat jadwal resmi dipublikasikan.
- [ ] Fitur _Drag-and-Drop Schedule Adjustment_ langsung pada tampilan kalender matriks ruangan.
- [ ] Integrasi Kalender Google / format `.ics` untuk sinkronisasi jadwal dosen dan mahasiswa ke smartphone.

---

## 📜 Lisensi

Proyek ini didistribusikan di bawah lisensi **MIT License**. Silakan gunakan, pelajari, dan kembangkan untuk keperluan akademik maupun institusi.
