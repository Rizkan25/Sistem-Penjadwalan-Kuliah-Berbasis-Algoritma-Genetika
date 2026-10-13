# Product Requirement Document (PRD)

## Sistem Penjadwalan Kuliah Berbasis Algoritma Genetika

| Metadata               | Keterangan                                                     |
| :--------------------- | :------------------------------------------------------------- |
| **Nama Proyek**        | Sistem Penjadwalan Kuliah Berbasis Algoritma Genetika (SPK-AG) |
| **Versi Dokumen**      | 1.0.0 (Production-Ready Draft)                                 |
| **Target Rilis**       | Semester Ganjil 2026/2027                                      |
| **Konteks Proyek**     | Tugas Besar Manajemen Proyek Perangkat Lunak                   |
| **Tumpukan Teknologi** | Next.js, FastAPI, Celery, Redis, PostgreSQL (AlloyDB)          |

---

## 1. Ringkasan Eksekutif & Latar Belakang

### 1.1 Latar Belakang Masalah

Penyusunan jadwal kuliah merupakan masalah optimasi kombinatorial klasik yang tergolong ke dalam kategori **NP-Hard** (_University Course Timetabling Problem_ / UCTP). Metode penyusunan konvensional (manual/spreadsheet) sering menghadapi kendala:

- Terjadinya bentrok jadwal dosen, ruangan, maupun kelompok mahasiswa (rombel).
- Ketidaksesuaian kapasitas ruangan dengan jumlah mahasiswa.
- Waktu penyusunan yang memakan waktu berhari-hari hingga berminggu-minggu.
- Sulitnya mengakomodasi preferensi waktu luang dosen tanpa merusak jadwal lain.

### 1.2 Tujuan Proyek

Membangun aplikasi berbasis web yang mampu mengotomatisasi pembuatan jadwal kuliah menggunakan **Algoritma Genetika (GA)** secara asinkron, memastikan **nol pelanggaran aturan mutlak (_zero hard-constraint violation_)**, meminimalkan ketidaknyamanan jadwal (_soft constraints_), serta menyediakan visualisasi matriks jadwal interaktif.

### 1.3 Metrik Keberhasilan (KPIs)

1. **Validitas Jadwal:** 100% bebas bentrok dosen, ruangan, dan kelas (Hard Constraint Violations = 0).
2. **Efisiensi Waktu Generasi:** Pembuatan jadwal untuk 100+ sesi kelas selesai dalam waktu < 3 menit.
3. **Resiliensi Sistem:** Tidak ada _request timeout_ pada antarmuka web saat proses komputasi algoritma berlangsung.
4. **Usabilitas Antarmuka:** Pengguna dapat memfilter jadwal berdasarkan dosen, ruangan, dan program studi serta mengekspornya ke format Excel/PDF dalam < 3 klik.

---

## 2. Peran & Alur Pengguna (User Personas & Roles)

1. **Admin Akademik / Bagian Penjadwalan (Superuser):**
   - Mengelola data master (Dosen, Ruangan, Mata Kuliah, Kelas/Rombel, Slot Waktu).
   - Menentukan parameter Algoritma Genetika (Populasi, Mutasi, Crossover, Maksimum Generasi).
   - Memicu proses pembuatan jadwal otomatis dan memantau progres secara _real-time_.
   - Melakukan penyesuaian manual minor pasca-generasi jika diperlukan.
   - Mempublikasikan dan mengekspor jadwal resmi.
2. **Dosen (Viewer):**
   - Melihat jadwal mengajar pribadi dan ketersediaan ruangan.
   - Memasukkan data preferensi waktu berhalangan mengajar (_unavailability time_).
3. **Mahasiswa (Viewer):**
   - Melihat jadwal kuliah berdasarkan semester, program studi, dan kelas masing-masing.

---

## 3. Arsitektur Teknis & Alur Data

### 3.1 Diagram Arsitektur Sistem

```
+-------------------------------------------------------------+
|                      Frontend (Next.js)                     |
|  - Data Master CRUD            - Status Progress (Polling)  |
|  - Interactive Calendar Grid   - Export Manager             |
+------------------------------+------------------------------+
                               | HTTP REST / JSON
                               v
+-------------------------------------------------------------+
|                      Backend (FastAPI)                      |
|  - API Gateway & Validasi      - Task Dispatcher (Celery)   |
|  - Conflict Inspector Engine   - Export Generator           |
+------------------------------+------------------------------+
         |                     |                      ^
         | Write/Read          | Push Task            | Fetch Result
         v                     v                      |
+-----------------+   +------------------+   +----------------+
|   PostgreSQL    |   |   Redis (Queue)  |   | Celery Worker  |
|   (AlloyDB)     |   +------------------+   | (Python Core)  |
| - Relational DB |            |             | - GA Optimizer |
| - State History |            +------------>| - Matrix Calc  |
+-----------------+                          +----------------+
```

### 3.2 Alur Komputasi Asinkron

1. Admin menekan tombol **"Generate Jadwal"** pada antarmuka Next.js.
2. FastAPI menjalankan validasi kelayakan data master (_pre-feasibility check_), membuat entri baru pada tabel `schedule_jobs` dengan status `PENDING`, dan mendaftarkan pekerjaan ke antrean Redis via Celery.
3. FastAPI langsung mengembalikan respons `202 Accepted` beserta `job_id` ke frontend agar koneksi HTTP tidak terputus (_anti-timeout_).
4. Celery Worker mengambil antrean tugas dari Redis, memuat data relasional ke dalam memori, lalu memulai kalkulasi populasi Algoritma Genetika.
5. Celery Worker memperbarui persentase progres, nomor generasi saat ini, dan nilai _fitness_ terbaik ke Redis/PostgreSQL setiap _N_ generasi.
6. Next.js melakukan polling berkala setiap 2–3 detik ke endpoint `/api/v1/schedules/jobs/{job_id}/status` untuk memperbarui indikator progres di layar.
7. Saat kriteria konvergensi tercapai (`COMPLETED`), hasil penempatan jadwal terbaik disimpan ke tabel `schedules`, dan antarmuka Next.js otomatis memuat matriks kalender interaktif.

### 3.3 Integrasi Perangkat Pengembangan (MCP)

- **AlloyDB for PostgreSQL MCP:** Memungkinkan agent melakukan inspeksi langsung terhadap struktur relasi tabel, menguji query pengecekan bentrok jadwal, dan memvalidasi keutuhan data hasil penjadwalan.
- **Chrome DevTools MCP:** Memungkinkan agent memeriksa elemen antarmuka, memantau _network payload_, serta mengaudit rendering tata letak grid kalender di Next.js agar tidak terjadi sel jadwal yang bertumpuk.

---

## 4. Pemodelan Matematis Algoritma Genetika

### 4.1 Struktur Kromosom

- **Gen (Sesi Pertemuan Kelas):** Representasi unit jadwal terkecil dalam bentuk tupel:
  $$\text{Gene}_i = \langle \text{ClassID}_i, \text{RoomID}, \text{TimeSlotID} \rangle$$
  Setiap `ClassID` telah mengikat informasi dosen pengampu, mata kuliah, jumlah mahasiswa terdaftar, dan tipe kebutuhan ruangan (teori atau laboratorium).
- **Kromosom (Individu / Solusi Lengkap):** Kumpulan gen lengkap yang merepresentasikan seluruh kelas yang wajib dijadwalkan dalam satu semester:
  $$\text{Chromosome} = [\text{Gene}_1, \text{Gene}_2, \dots, \text{Gene}_N]$$

### 4.2 Batasan Sistem (Constraints)

#### A. Batasan Keras (Hard Constraints - Toleransi Pelanggaran = 0)

1. **$HC_1$ (Bebas Bentrok Dosen):** Seorang dosen tidak boleh mengajar lebih dari 1 kelas pada slot waktu yang bersamaan.
2. **$HC_2$ (Bebas Bentrok Ruangan):** Suatu ruangan tidak boleh digunakan oleh lebih dari 1 sesi perkuliahan pada slot waktu yang bersamaan.
3. **$HC_3$ (Bebas Bentrok Rombel/Kelas):** Suatu rombongan belajar (angkatan dan kelompok mahasiswa yang sama) tidak boleh memiliki 2 jadwal kuliah pada slot waktu yang bersamaan.
4. **$HC_4$ (Kecukupan Kapasitas Ruangan):** Daya tampung kursi ruangan harus lebih besar atau sama dengan jumlah mahasiswa dalam kelas:
   $$\text{Kapasitas Ruangan} \ge \text{Jumlah Mahasiswa}$$
5. **$HC_5$ (Kesesuaian Tipe Ruangan):** Sesi perkuliahan praktikum wajib dialokasikan pada ruangan laboratorium; sesi perkuliahan teori dialokasikan pada ruang kelas reguler.
6. **$HC_6$ (Ketersediaan Waktu Dosen):** Sesi mengajar tidak boleh ditempatkan pada slot waktu di mana dosen telah mengajukan status berhalangan hadir (_unavailable_).

#### B. Batasan Lunak (Soft Constraints - Diupayakan Minimal)

1. **$SC_1$ (Preferensi Waktu Dosen):** Penempatan jadwal sedapat mungkin mengikuti slot waktu yang diprioritaskan oleh dosen.
2. **$SC_2$ (Minimasi Jam Kosong Mahasiswa / Gap Hours):** Meminimalkan jeda waktu kosong lebih dari 2 jam di antara dua mata kuliah pada hari yang sama untuk kelompok mahasiswa yang sama.
3. **$SC_3$ (Pemerataan Beban Mengajar Harian):** Membatasi dosen agar tidak mengajar lebih dari 3 sesi kelas berturut-turut dalam satu hari yang sama.

### 4.3 Formulasi Fungsi Fitness

Total pinalti dihitung dari akumulasi pelanggaran batasan keras dan batasan lunak dengan pembobotan hierarkis:
$$\text{Penalty} = \left( W_{\text{hard}} \sum_{k=1}^{6} HC_k \right) + \left( W_{\text{soft}} \sum_{m=1}^{3} SC_m \right)$$

- Bobot Batasan Keras: $W_{\text{hard}} = 1000$ (pinalti masif).
- Bobot Batasan Lunak: $W_{\text{soft}} = 1$ (pinalti inkremental).
- Fungsi Fitness Solusi:
  $$\text{Fitness} = \frac{1}{1 + \text{Penalty}}$$
  Solusi dinyatakan valid dan siap dipublikasikan hanya jika seluruh batasan keras bernilai 0 ($\sum HC_k = 0$).

### 4.4 Parameter & Operator Genetika

- **Ukuran Populasi ($N_p$):** 50 hingga 100 individu per generasi.
- **Mekanisme Seleksi:** _Tournament Selection_ (ukuran turnamen $k = 3$) untuk menjaga selektivitas tanpa menghilangkan variasi kromosom terlalu cepat.
- **Operator Crossover:** _Uniform Crossover_ atau _Two-Point Crossover_ dengan probabilitas persilangan $P_c = 0.85$.
- **Operator Mutasi:** _Swap Mutation_ (menukar slot waktu antara dua gen) dan _Random Resetting_ (memilih ruangan atau slot waktu baru secara acak) dengan probabilitas mutasi dasar $P_m = 0.08$.
- **Elitisme:** Mengamankan 2 individu terbaik ($2\% - 5\%$) dari generasi berjalan langsung ke generasi berikutnya tanpa modifikasi genetik.
- **Kriteria Penghentian (Termination Criteria):**
  1. Pelanggaran batasan keras mencapai nol ($\sum HC = 0$) dan target batasan lunak terpenuhi.
  2. Batas maksimum generasi tercapai (contoh: 500 generasi).
  3. Konvergensi mendatar (_plateau_): Nilai _fitness_ terbaik tidak mengalami perbaikan selama 50 generasi berturut-turut.

---

## 5. Skema Basis Data Relasional (PostgreSQL)

```sql
-- 1. Data Master Dosen
CREATE TABLE lecturers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nip VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Data Slot Waktu Ketersediaan Dosen
CREATE TABLE lecturer_unavailabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecturer_id UUID REFERENCES lecturers(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 6), -- 1: Senin, 6: Sabtu
    time_slot_id UUID NOT NULL,
    reason VARCHAR(255)
);

-- 3. Data Master Ruangan
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    room_type VARCHAR(20) NOT NULL DEFAULT 'THEORY' CHECK (room_type IN ('THEORY', 'LABORATORY')),
    is_active BOOLEAN DEFAULT TRUE
);

-- 4. Data Master Slot Waktu Pembelajaran
CREATE TABLE time_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
    period_order INT NOT NULL, -- Urutan sesi perkuliahan harian
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CONSTRAINT unique_day_period UNIQUE (day_of_week, period_order)
);

-- 5. Data Master Mata Kuliah
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    credits INT NOT NULL CHECK (credits > 0),
    course_type VARCHAR(20) NOT NULL DEFAULT 'THEORY' CHECK (course_type IN ('THEORY', 'LABORATORY')),
    kbk VARCHAR(30) NOT NULL DEFAULT 'GENERAL' CHECK (kbk IN ('GENERAL', 'PEMROGRAMAN', 'MULTIMEDIA', 'IOT'))
);

-- 6. Data Kelas / Rombel Perkuliahan
CREATE TABLE academic_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE RESTRICT,
    lecturer_id UUID REFERENCES lecturers(id) ON DELETE RESTRICT,
    class_name VARCHAR(50) NOT NULL, -- Contoh: "IK-3A (Pemrograman)"
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    kbk VARCHAR(30) NOT NULL DEFAULT 'GENERAL' CHECK (kbk IN ('GENERAL', 'PEMROGRAMAN', 'MULTIMEDIA', 'IOT')),
    student_count INT NOT NULL CHECK (student_count > 0),
    academic_year VARCHAR(10) NOT NULL, -- Contoh: "2026/2027"
    semester_type VARCHAR(10) NOT NULL CHECK (semester_type IN ('ODD', 'EVEN'))
);

-- 7. Antrean Tugas & Riwayat Eksekusi Algoritma
CREATE TABLE schedule_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
    progress_percentage INT DEFAULT 0,
    current_generation INT DEFAULT 0,
    max_generations INT NOT NULL,
    best_fitness DOUBLE PRECISION DEFAULT 0.0,
    hard_conflicts_count INT DEFAULT 0,
    soft_conflicts_count INT DEFAULT 0,
    execution_time_seconds DOUBLE PRECISION,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Hasil Pemetaan Jadwal Final
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES schedule_jobs(id) ON DELETE CASCADE,
    class_id UUID REFERENCES academic_classes(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE RESTRICT,
    time_slot_id UUID REFERENCES time_slots(id) ON DELETE RESTRICT,
    CONSTRAINT unique_room_slot_per_job UNIQUE (job_id, room_id, time_slot_id)
);
```

## 6. Spesifikasi Antarmuka Pemrograman Aplikasi (REST API)

### 6.1 Ringkasan Endpoint

| Metode | Endpoint                                      | Deskripsi                                  | Respons Utama                          |
| :----- | :-------------------------------------------- | :----------------------------------------- | :------------------------------------- |
| `POST` | `/api/v1/schedules/generate`                  | Memicu komputasi algoritma genetika        | `202 Accepted` + `job_id`              |
| `GET`  | `/api/v1/schedules/jobs/{job_id}/status`      | Polling progres komputasi pekerjaan        | `200 OK` (status, generation, fitness) |
| `GET`  | `/api/v1/schedules/jobs/{job_id}/result`      | Mengambil seluruh hasil jadwal final       | `200 OK` (array matriks jadwal)        |
| `POST` | `/api/v1/schedules/{schedule_id}/manual-swap` | Validasi & tukar slot secara manual        | `200 OK` atau `409 Conflict`           |
| `GET`  | `/api/v1/schedules/{job_id}/export`           | Unduh jadwal (`?format=excel` / `pdf`)     | `200 OK` (binary stream file)          |
| `GET`  | `/api/v1/conflicts/pre-check`                 | Validasi kelayakan sebelum algoritma jalan | `200 OK` (feasibility check score)     |

### 6.2 Detail Skema Payload & Respons

#### A. Trigger Generasi Jadwal (`POST /api/v1/schedules/generate`)

- **Request Body:**

```json
{
  "academic_year": "2026/2027",
  "semester_type": "ODD",
  "parameters": {
    "population_size": 100,
    "max_generations": 500,
    "crossover_rate": 0.85,
    "mutation_rate": 0.08,
    "elitism_count": 2
  }
}
```

- **Response Body (`202 Accepted`):**

```json
{
  "status": "success",
  "message": "Proses optimasi penjadwalan berhasil dijadwalkan ke antrean.",
  "data": {
    "job_id": "8f3b2a1c-9d4e-4b2a-a1b2-c3d4e5f6a7b8",
    "status": "PENDING",
    "created_at": "2026-10-13T16:00:00Z"
  }
}
```

#### B. Polling Status Progres (`GET /api/v1/schedules/jobs/{job_id}/status`)

- **Response Body (`200 OK`):**

```json
{
  "status": "success",
  "data": {
    "job_id": "8f3b2a1c-9d4e-4b2a-a1b2-c3d4e5f6a7b8",
    "status": "RUNNING",
    "progress_percentage": 64,
    "current_generation": 320,
    "max_generations": 500,
    "best_fitness": 0.985,
    "hard_conflicts_count": 0,
    "soft_conflicts_count": 3,
    "estimated_remaining_seconds": 12
  }
}
```

---

## 7. Penanganan Kasus Ekstrem & Resiliensi Sistem (Edge Cases)

### 7.1 Masalah Tidak Layak (_Infeasible Problem_)

- **Skenario:** Total jam pertemuan seluruh kelas melebihi akumulasi total slot waktu dan kapasitas ruangan yang tersedia, atau jumlah kelas praktikum melebihi ketersediaan laboratorium aktif.
- **Mekanisme Penanganan:** Sebelum antrean Celery dieksekusi, backend memanggil fungsi `pre_execution_feasibility_check()`. Jika $\sum \text{Kebutuhan Slot} > \sum \text{Kapasitas Ruang} \times \text{Slot Waktu}$, sistem langsung menolak inisiasi pembuatan jadwal dengan kode `422 Unprocessable Entity` disertai pesan diagnostik yang jelas (misal: _"Kekurangan 14 slot ruangan teori untuk semester ini"_).

### 7.2 Jebakan Optimum Lokal (_Premature Convergence_)

- **Skenario:** Seluruh populasi memiliki gen serupa pada generasi awal sehingga algoritma berhenti berimprovisasi meskipun pelanggaran belum mencapai 0 (_hard constraints_ masih ada).
- **Mekanisme Penanganan:** Terapkan strategi **Adaptive Mutation Rate**. Apabila nilai _fitness_ terbaik tidak mengalami peningkatan selama 15 generasi berturut-turut, tingkat mutasi dinaikkan otomatis dari $0.08$ ke $0.25$ selama 5 generasi (_diversity injection_) untuk membongkar pola genetik yang buntu.

### 7.3 Crash pada Komputasi Latar Belakang (_Worker Out-of-Memory_)

- **Skenario:** Worker Celery terhenti mendadak (_killed by OS_) karena beban kalkulasi matriks memori melonjak.
- **Mekanisme Penanganan:**
  - Pasang batas waktu eksekusi tugas (_hard time limit_ 600 detik) di konfigurasi Celery (`CELERY_TASK_TIME_LIMIT = 600`).
  - Manfaatkan blok `try...except` dan _signal handler_ di Celery: jika tugas gagal atau mengalami _kill_, status pada tabel `schedule_jobs` di PostgreSQL langsung diperbarui menjadi `FAILED` dengan keterangan galat lengkap, sehingga frontend tidak terjebak dalam status pemuatan (_infinite loading_).

### 7.4 Penyesuaian Manual yang Memicu Konflik Baru (_Post-generation Manual Swap_)

- **Skenario:** Admin mencoba menukar jadwal dua kelas secara manual melalui antarmuka tabel, namun perpindahan tersebut memicu dosen atau ruangan menjadi bentrok.
- **Mekanisme Penanganan:** Endpoint `/manual-swap` wajib menjalankan fungsi verifikasi bentrok (_conflict checker_). Jika pertukaran menimbulkan bentrok mutlak, sistem menolak transaksi dengan kode respons `409 Conflict` dan mengembalikan rincian pihak yang bertabrakan.

---

## 8. Rencana Pengujian & Quality Assurance (QA)

### 8.1 Pengujian Unit (Unit Testing - Backend & Algoritma)

- **Verifikasi Fungsi Fitness:** Memastikan setiap jenis pelanggaran (dosen bentrok, rombel bentrok, ruangan penuh) memicu pinalti nilai yang tepat dan terukur.
- **Integritas Operator Genetik:** Menguji bahwa proses _crossover_ dan _mutation_ tidak menghilangkan gen kelas atau menduplikasi entitas sesi kelas yang sama.

### 8.2 Pengujian Integrasi (Integration Testing)

- Menguji siklus hidup tugas: `FastAPI (Trigger) -> Redis (Queue) -> Celery Worker (Compute) -> PostgreSQL (Persist)`.
- Memastikan polling frontend tetap menerima pembaruan status generasi secara periodik tanpa membebani basis data (_throttled update_).

### 8.3 Pengujian Antarmuka & Visual (Frontend UI/UX)

- Mengaudit visualisasi matriks kalender mingguan pada resolusi laptop (1366x768) dan monitor desktop (1920x1080) menggunakan Chrome DevTools.
- Memastikan tidak terjadi _layout shift_, tumpang-tindih (_overlapping_) teks mata kuliah pada kartu jadwal, atau kelambatan rendering saat menampilkan puluhan blok sesi.

### 8.4 Pengujian Beban & Skalabilitas (Stress Testing)

- Menguji batas performa dengan dataset riil: **150 kelas kuliah, 25 ruangan, 80 dosen, dan 30 slot waktu mingguan**.
- Kriteria Lolos: Penggunaan memori worker stabil di bawah 500 MB RAM dan proses generasi selesai di bawah 3 menit dengan 0 pelanggaran batasan mutlak (_zero hard constraints_).

---

## 9. Manajemen Proyek & Pembagian Peran Kelompok

### 9.1 Matriks RACI (Responsible, Accountable, Consulted, Informed)

| Modul / Komponen Tugas                 | Spesialis Algoritma | Backend Developer | Frontend Developer | Project Manager / QA |
| :------------------------------------- | :-----------------: | :---------------: | :----------------: | :------------------: |
| Formulasi Matematis & GA Engine        |        **R**        |         C         |         I          |          A           |
| REST API & Integrasi Celery/Redis      |          C          |       **R**       |         I          |          A           |
| Desain Skema DB & Kueri PostgreSQL     |          C          |       **R**       |         I          |          A           |
| UI Dashboard & Visualisasi Kalender    |          I          |         C         |       **R**        |          A           |
| Pengujian Bentrok, QA, & Laporan Akhir |          C          |         C         |         C          |      **R / A**       |

- **Responsible (R):** Anggota yang mengeksekusi dan menulis kode modul tersebut secara langsung.
- **Accountable (A):** Penanggung jawab utama yang memastikan modul selesai tepat waktu dan sesuai spesifikasi.
- **Consulted (C):** Anggota yang diajak berdiskusi/konsultasi untuk keselarasan teknis.
- **Informed (I):** Anggota yang menerima kabar pembaruan progres atau perubahan antarmuka.

### 9.2 Timeline Pengerjaan Proyek (Sprint 4 Minggu)

- **Minggu 1: Inisialisasi Fondasi & Data Master**
  - Perancangan skema relasional PostgreSQL dan migrasi awal.
  - Setup repositori Git bersama (_branching model_: `main`, `develop`, `feature/*`).
  - Pembuatan REST API CRUD data master (Dosen, Ruangan, Waktu, Kelas).
  - Pembuatan halaman form input data master di Next.js.
- **Minggu 2: Pengembangan Inti Algoritma Genetika**
  - Perancangan struktur kromosom dan formulasi fungsi pinalti/fitness Python.
  - Uji mandiri performa konvergensi algoritma via terminal (CLI).
  - Konfigurasi Celery Worker dan Redis broker untuk pemrosesan asinkron.
- **Minggu 3: Integrasi Antarmuka & Visualisasi Matriks**
  - Pembangunan komponen tabel matriks jadwal mingguan responsif di Next.js.
  - Implementasi mekanisme polling progres (_real-time progress bar_ & indikator generasi).
  - Integrasi data hasil komputasi dari API ke visual kalender jadwal.
- **Minggu 4: Penanganan Kasus Ekstrem, Ekspor, & Finalisasi Laporan**
  - Implementasi validasi awal (_pre-execution check_) dan fitur _manual swap_.
  - Pembuatan fitur ekspor jadwal ke format Excel/PDF.
  - Pengujian menyeluruh (_stress test_ dataset besar) dan pencatatan metrik.
  - Penyusunan laporan akhir tugas manajemen proyek dan materi presentasi kelompok.
