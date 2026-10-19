# Product Requirement Document (PRD)

## Sistem Penjadwalan Kuliah Berbasis Algoritma Genetika

| Metadata               | Keterangan                                                     |
| :--------------------- | :------------------------------------------------------------- |
| **Nama Proyek**        | Sistem Penjadwalan Kuliah Berbasis Algoritma Genetika (SPK-AG) |
| **Studi Kasus**        | Prodi Ilmu Komputer - Universitas Bina Bangsa Getsempena       |
| **Versi Dokumen**      | 2.1.0 (Final Single-Machine Production Spec)                   |
| **Target Rilis**       | Semester Ganjil 2026/2027                                      |
| **Konteks Proyek**     | Tugas Besar Manajemen Proyek Perangkat Lunak (5 Anggota)       |
| **Tumpukan Teknologi** | Next.js, FastAPI, Celery, Redis, PostgreSQL (AlloyDB)          |
| **Desain Antarmuka**   | Mengacu pada dokumen spesifikasi visual di `docs/DESIGN.md`    |

## 1. Ringkasan Eksekutif & Latar Belakang

### 1.1 Latar Belakang Masalah

Penyusunan jadwal kuliah merupakan masalah optimasi kombinatorial klasik yang tergolong ke dalam kategori **NP-Hard** (_University Course Timetabling Problem_ / UCTP). Di Program Studi Ilmu Komputer Universitas Bina Bangsa Getsempena (UBBG) Banda Aceh, kompleksitas penjadwalan meningkat karena adanya pembagian kelompok mahasiswa reguler pada Semester 1–2 (`GENERAL`) serta percabangan 3 Kelompok Bidang Keahlian (KBK) mulai Semester 3 ke atas (`PEMROGRAMAN`, `MULTIMEDIA`, dan `IOT`). Metode penyusunan konvensional (manual/spreadsheet) sering menghadapi kendala:

- Terjadinya bentrok jadwal dosen, ruangan laboratorium/teori, maupun kelompok mahasiswa (rombel) antara mata kuliah wajib umum dengan mata kuliah peminatan KBK.
- Ketidaksesuaian kapasitas kursi ruangan dengan jumlah mahasiswa peserta kelas.
- Waktu penyusunan yang memakan waktu berhari-hari hingga berminggu-minggu.
- Sulitnya mengakomodasi waktu berhalangan hadir dan preferensi waktu mengajar dosen tanpa merusak jadwal lain.

### 1.2 Tujuan Proyek

Membangun aplikasi berbasis web yang mampu mengotomatisasi pembuatan jadwal kuliah menggunakan **Algoritma Genetika (GA)** secara asinkron, memastikan **nol pelanggaran aturan mutlak (_zero hard-constraint violation_)**, meminimalkan ketidaknyamanan jadwal (_soft constraints_), serta menyediakan visualisasi matriks jadwal interaktif yang siap dipublikasikan dan diekspor.

### 1.3 Metrik Keberhasilan (KPIs)

1. **Validitas Jadwal:** 100% bebas bentrok dosen, ruangan, dan rombel mahasiswa baik kelas umum maupun KBK (`hard_conflicts_count = 0`).
2. **Efisiensi Waktu Generasi:** Pembuatan jadwal untuk 100+ sesi kelas selesai dalam waktu < 3 menit.
3. **Resiliensi Sistem:** Tidak ada _request timeout_ pada antarmuka web saat proses komputasi algoritma berlangsung.
4. **Usabilitas Antarmuka:** Pengguna dapat memfilter jadwal berdasarkan semester, KBK, dosen, dan ruangan serta mengekspornya ke format Excel/PDF dalam < 3 klik.

---

## 2. Peran & Alur Pengguna (User Personas & Roles)

1. **Admin Akademik / Bagian Penjadwalan (Superuser):**
   - Mengelola data master (Dosen, Ruangan, Mata Kuliah, Kelas/Rombel, Slot Waktu, dan Preferensi Dosen).
   - Menentukan parameter Algoritma Genetika (Populasi, Mutasi, Crossover, Maksimum Generasi).
   - Memicu proses pembuatan jadwal otomatis dan memantau progres secara _real-time_.
   - Melakukan penyesuaian manual minor (_manual swap_) pasca-generasi jika diperlukan.
   - Menandai hasil generasi jadwal terbaik sebagai jadwal resmi (`is_published = TRUE`) dan mengekspornya ke Excel/PDF.
2. **Dosen (Viewer & Contributor):**
   - Melihat jadwal mengajar pribadi yang telah dipublikasikan dan ketersediaan ruangan.
   - Memasukkan data waktu berhalangan hadir (`UNAVAILABLE`) maupun waktu prioritas mengajar (`PREFERRED`).
3. **Mahasiswa (Viewer):**
   - Melihat dan mengunduh jadwal kuliah resmi berdasarkan semester, kelompok kelas (_cohort_), dan peminatan KBK masing-masing.

---

## 3. Arsitektur Teknis & Alur Data

### 3.1 Diagram Arsitektur Sistem

```
+-------------------------------------------------------------+
|                      Frontend (Next.js)                     |
|  - Data Master CRUD            - Status Progress (Polling)  |
|  - Interactive Calendar Grid   - Export & Publish Manager   |
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

1. Admin memilih tahun akademik dan semester (Ganjil/Genap), lalu menekan tombol **"Generate Jadwal"** pada antarmuka Next.js.
2. FastAPI menjalankan validasi kelayakan data master (_pre-feasibility check_), membuat entri baru pada tabel `schedule_jobs` dengan status `PENDING`, dan mendaftarkan pekerjaan ke antrean Redis via Celery.
3. FastAPI langsung mengembalikan respons `202 Accepted` beserta `job_id` ke frontend agar koneksi HTTP tidak terputus (_anti-timeout_).
4. Celery Worker mengambil antrean tugas dari Redis, memuat data relasional ke dalam memori, lalu memulai kalkulasi populasi Algoritma Genetika.
5. Celery Worker memperbarui persentase progres, nomor generasi saat ini, dan nilai _fitness_ terbaik ke Redis/PostgreSQL setiap 5 generasi (_throttled update_).
6. Next.js melakukan polling berkala setiap 2–3 detik ke endpoint `/api/v1/schedules/jobs/{job_id}/status` untuk memperbarui indikator progres di layar.
7. Saat kriteria konvergensi tercapai (`COMPLETED`), hasil penempatan jadwal terbaik disimpan secara transaksional ke tabel `schedules`, dan antarmuka Next.js otomatis memuat matriks kalender interaktif.

### 3.3 Integrasi Perangkat Pengembangan (MCP)

- **AlloyDB for PostgreSQL MCP:** Memungkinkan agent melakukan inspeksi langsung terhadap struktur relasi tabel, mengeksekusi migrasi & _seed data_, menguji query pengecekan bentrok jadwal, serta memvalidasi keutuhan data hasil penjadwalan.
- **Chrome DevTools for agents MCP:** Memungkinkan agent memeriksa elemen antarmuka, memantau _network payload_ saat _polling_, menangkap _console errors_, serta mengaudit rendering tata letak grid kalender di Next.js agar tidak terjadi sel jadwal yang bertumpuk.
- **Context7 MCP:** Memungkinkan agent mengambil dokumentasi resmi dan referensi kode versi terbaru untuk pustaka FastAPI, Celery, SQLAlchemy, Next.js, dan Tailwind CSS guna mencegah penggunaan sintaksis yang usang (_deprecated_).

---

## 4. Pemodelan Matematis Algoritma Genetika

### 4.1 Struktur Kromosom & Model Blok Waktu

- **Model Blok Sesi (_Macro-Slot_):** Setiap entitas `TimeSlotID` merepresentasikan satu blok penuh sesi pertemuan perkuliahan (contoh: Sesi 1 = `08:00 - 10:00`, Sesi 2 = `10:15 - 12:00`, Sesi 3 = `14:00 - 16:00`, Sesi 4 = `16:15 - 18:00`).
- **Aturan Khusus Waktu Ibadah Jumat (Banda Aceh):** Pada hari Jumat (`day_of_week = 5`), rentang waktu pukul `11:30 - 14:00 WIB` dikunci dan dilarang memiliki slot perkuliahan aktif untuk menghormati pelaksanaan ibadah Sholat Jumat.
- **Gen (Sesi Pertemuan Kelas):** Representasi unit jadwal terkecil dalam bentuk tupel:
  $$\text{Gene}_i = \langle \text{ClassID}_i, \text{RoomID}, \text{TimeSlotID} \rangle$$
  Setiap `ClassID` telah mengikat informasi dosen pengampu, mata kuliah, semester, kelompok kelas (_cohort_), jalur KBK, jumlah mahasiswa terdaftar, dan tipe kebutuhan ruangan.
- **Kromosom (Individu / Solusi Lengkap):** Kumpulan gen lengkap yang merepresentasikan seluruh kelas yang wajib dijadwalkan dalam satu semester aktif:
  $$\text{Chromosome} = [\text{Gene}_1, \text{Gene}_2, \dots, \text{Gene}_N]$$

### 4.2 Batasan Sistem (Constraints)

#### A. Batasan Keras (Hard Constraints - Toleransi Pelanggaran = 0)

1. **$HC_1$ (Bebas Bentrok Dosen):** Seorang dosen tidak boleh mengajar lebih dari 1 kelas pada `TimeSlotID` yang bersamaan.
2. **$HC_2$ (Bebas Bentrok Ruangan):** Suatu ruangan tidak boleh digunakan oleh lebih dari 1 sesi perkuliahan pada `TimeSlotID` yang bersamaan.
3. **$HC_3$ (Bebas Bentrok Rombel & Aturan Paralel KBK):** Dua kelas dinyatakan bentrok rombel pada `TimeSlotID` yang sama apabila berada pada `semester` dan `cohort` (misal: kelas `'A'`) yang sama, **DAN** memenuhi salah satu kondisi berikut:
   - Kedua kelas memiliki nilai `kbk` yang sama (misal: sama-sama `'GENERAL'` atau sama-sama `'PEMROGRAMAN'`).
   - Salah satu kelas bertipe `'GENERAL'` (mata kuliah wajib umum) dan kelas lainnya bertipe KBK spesifik (`'PEMROGRAMAN'`, `'MULTIMEDIA'`, atau `'IOT'`).
   - _(Catatan Penting: Dua kelas pada semester dan cohort yang sama dengan KBK spesifik yang berbeda—misal `'PEMROGRAMAN'` vs `'MULTIMEDIA'`—**diizinkan berjalan paralel** pada slot waktu yang sama selama dosen dan ruangannya berbeda)._
4. **$HC_4$ (Kecukupan Kapasitas Ruangan):** Daya tampung kursi ruangan harus lebih besar atau sama dengan jumlah mahasiswa dalam kelas:
   $$\text{Kapasitas Ruangan} \ge \text{Jumlah Mahasiswa}$$
5. **$HC_5$ (Kesesuaian Tipe Ruangan):** Sesi perkuliahan praktikum (`LABORATORY`) wajib dialokasikan pada ruangan bertipe laboratorium; sesi perkuliahan teori (`THEORY`) dialokasikan pada ruang kelas teori reguler.
6. **$HC_6$ (Waktu Dosen Berhalangan Hadir):** Sesi mengajar tidak boleh ditempatkan pada `TimeSlotID` di mana dosen telah mengajukan status `UNAVAILABLE` pada tabel preferensi waktu.

#### B. Batasan Lunak (Soft Constraints - Diupayakan Minimal)

1. **$SC_1$ (Preferensi Waktu Dosen):** Memberikan pinalti ringan apabila sesi mengajar dosen ditempatkan di luar slot waktu yang ditandai `PREFERRED` oleh dosen bersangkutan (jika dosen memiliki preferensi).
2. **$SC_2$ (Minimasi Jam Kosong Mahasiswa / Gap Hours):** Meminimalkan jeda waktu kosong antar-sesi kuliah pada hari yang sama untuk kelompok mahasiswa (`semester`, `cohort`, dan `kbk`) yang sama.
3. **$SC_3$ (Pemerataan Beban Mengajar Harian):** Membatasi dosen agar tidak mengajar lebih dari 3 blok sesi kelas dalam satu hari yang sama.

### 4.3 Formulasi Fungsi Fitness

Total pinalti dihitung dari akumulasi pelanggaran batasan keras dan batasan lunak dengan pembobotan hierarkis:
$$\text{Penalty} = \left( W_{\text{hard}} \sum_{k=1}^{6} HC_k \right) + \left( W_{\text{soft}} \sum_{m=1}^{3} SC_m \right)$$

- Bobot Batasan Keras: $W_{\text{hard}} = 1000$ (pinalti masif).
- Bobot Batasan Lunak: $W_{\text{soft}} = 1$ (pinalti inkremental).
- Fungsi Fitness Solusi:
  $$\text{Fitness} = \frac{1}{1 + \text{Penalty}}$$
  Solusi dinyatakan valid dan layak dipublikasikan hanya jika seluruh batasan keras bernilai 0 ($\sum HC_k = 0$, sehingga $\text{Penalty} < 1000$).

### 4.4 Parameter & Operator Genetika

- **Ukuran Populasi ($N_p$):** 50 hingga 100 individu per generasi (Inisialisasi menggunakan _Heuristic Room-Type & Capacity Matching_ agar $HC_4$ dan $HC_5$ langsung terpenuhi sejak generasi ke-0).
- **Mekanisme Seleksi:** _Tournament Selection_ (ukuran turnamen $k = 3$).
- **Operator Crossover:** _Uniform Crossover_ dengan probabilitas persilangan $P_c = 0.85$.
- **Operator Mutasi:** _Swap Mutation_ (menukar slot waktu antar-gen) dan _Valid-Room Random Resetting_ dengan probabilitas mutasi dasar $P_m = 0.08$.
- **Elitisme:** Mengamankan 2 individu terbaik langsung ke generasi berikutnya tanpa modifikasi genetik.
- **Kriteria Penghentian (Termination Criteria):**
  1. Pelanggaran batasan keras mencapai nol ($\sum HC = 0$) dan pinalti batasan lunak mencapai 0 atau di bawah ambang target.
  2. Batas maksimum generasi tercapai (default: 500 generasi).
  3. Konvergensi mendatar (_plateau_): Nilai _fitness_ terbaik tidak mengalami perbaikan selama 50 generasi berturut-turut.

---

## 5. Skema Basis Data Relasional (PostgreSQL)

_(Urutan pembuatan tabel telah disusun mengikuti hierarki ketergantungan Foreign Key yang valid)._

```sql
-- 1. Data Master Dosen
CREATE TABLE lecturers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nidn VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Data Master Ruangan
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    room_type VARCHAR(30) NOT NULL DEFAULT 'THEORY' CHECK (room_type IN ('THEORY', 'LABORATORY')),
    is_active BOOLEAN DEFAULT TRUE
);

-- 3. Data Master Slot Waktu Pembelajaran (Blok Sesi)
CREATE TABLE time_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 6), -- 1: Senin, 5: Jumat, 6: Sabtu
    period_order INT NOT NULL CHECK (period_order > 0), -- Urutan sesi harian (1, 2, 3, dst.)
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CHECK (end_time > start_time),
    CONSTRAINT unique_day_period UNIQUE (day_of_week, period_order)
);

-- 4. Data Preferensi & Ketidaktersediaan Waktu Dosen (Mendukung HC_6 dan SC_1)
CREATE TABLE lecturer_time_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecturer_id UUID NOT NULL REFERENCES lecturers(id) ON DELETE CASCADE,
    time_slot_id UUID NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
    preference_type VARCHAR(20) NOT NULL CHECK (preference_type IN ('UNAVAILABLE', 'PREFERRED')),
    reason VARCHAR(255),
    CONSTRAINT unique_lecturer_slot_pref UNIQUE (lecturer_id, time_slot_id)
);

-- 5. Data Master Mata Kuliah
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    credits INT NOT NULL CHECK (credits BETWEEN 1 AND 6),
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    course_type VARCHAR(20) NOT NULL DEFAULT 'THEORY' CHECK (course_type IN ('THEORY', 'LABORATORY')),
    kbk VARCHAR(30) NOT NULL DEFAULT 'GENERAL' CHECK (kbk IN ('GENERAL', 'PEMROGRAMAN', 'MULTIMEDIA', 'IOT'))
);

-- 6. Data Kelas / Rombel Perkuliahan
CREATE TABLE academic_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    lecturer_id UUID NOT NULL REFERENCES lecturers(id) ON DELETE RESTRICT,
    class_name VARCHAR(50) NOT NULL, -- Contoh: "IK-3A (Pemrograman)"
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    cohort VARCHAR(10) NOT NULL DEFAULT 'A', -- Kelompok kelas ('A', 'B') untuk deteksi HC_3
    kbk VARCHAR(30) NOT NULL DEFAULT 'GENERAL' CHECK (kbk IN ('GENERAL', 'PEMROGRAMAN', 'MULTIMEDIA', 'IOT')),
    student_count INT NOT NULL CHECK (student_count > 0),
    academic_year VARCHAR(10) NOT NULL, -- Contoh: "2026/2027"
    semester_type VARCHAR(10) NOT NULL CHECK (semester_type IN ('ODD', 'EVEN'))
);

-- 7. Antrean Tugas & Riwayat Eksekusi Algoritma
CREATE TABLE schedule_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year VARCHAR(10) NOT NULL,
    semester_type VARCHAR(10) NOT NULL CHECK (semester_type IN ('ODD', 'EVEN')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    progress_percentage INT DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
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
    job_id UUID NOT NULL REFERENCES schedule_jobs(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES academic_classes(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    time_slot_id UUID NOT NULL REFERENCES time_slots(id) ON DELETE RESTRICT,
    CONSTRAINT unique_class_per_job UNIQUE (job_id, class_id),
    CONSTRAINT unique_room_slot_per_job UNIQUE (job_id, room_id, time_slot_id)
);
```

---

## 6. Spesifikasi Antarmuka Pemrograman Aplikasi (REST API)

### 6.1 Ringkasan Endpoint

| Metode                | Endpoint                                      | Deskripsi                                                                               | Respons Utama                          |
| :-------------------- | :-------------------------------------------- | :-------------------------------------------------------------------------------------- | :------------------------------------- |
| `GET/POST/PUT/DELETE` | `/api/v1/master/{resource}`                   | CRUD untuk `lecturers`, `rooms`, `time-slots`, `courses`, `classes`, `preferences`      | `200 OK` / `201 Created`               |
| `GET`                 | `/api/v1/conflicts/pre-check`                 | Validasi kelayakan kapasitas slot sebelum algoritma dijalankan                          | `200 OK` / `422 Unprocessable Entity`  |
| `POST`                | `/api/v1/schedules/generate`                  | Memicu komputasi algoritma genetika di latar belakang via Celery                        | `202 Accepted` + `job_id`              |
| `GET`                 | `/api/v1/schedules/jobs/{job_id}/status`      | Polling progres komputasi pekerjaan                                                     | `200 OK` (status, generation, fitness) |
| `GET`                 | `/api/v1/schedules/jobs/{job_id}/result`      | Mengambil matriks jadwal (mendukung filter `semester`, `kbk`, `lecturer_id`, `room_id`) | `200 OK` (array matriks jadwal)        |
| `PATCH`               | `/api/v1/schedules/jobs/{job_id}/publish`     | Menetapkan jadwal hasil generasi sebagai jadwal resmi aktif (`is_published`)            | `200 OK`                               |
| `POST`                | `/api/v1/schedules/{schedule_id}/manual-swap` | Validasi bentrok & tukar slot waktu/ruangan secara manual                               | `200 OK` atau `409 Conflict`           |
| `GET`                 | `/api/v1/schedules/jobs/{job_id}/export`      | Unduh jadwal resmi (`?format=excel` / `pdf`)                                            | `200 OK` (binary stream file)          |

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
    "created_at": "2026-10-19T13:00:00Z"
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

- **Skenario:** Total kelas teori/praktikum melebihi akumulasi total slot waktu dan kapasitas ruangan yang tersedia, atau seorang dosen mengampu kelas melebihi total slot waktu mingguan.
- **Mekanisme Penanganan:** Sebelum antrean Celery dieksekusi, backend memanggil fungsi `pre_execution_feasibility_check()`. Jika beban kelas melampaui kapasitas ruangan/waktu, sistem langsung menolak inisiasi pembuatan jadwal dengan kode `422 Unprocessable Entity` disertai rincian diagnostik yang spesifik.

### 7.2 Jebakan Optimum Lokal (_Premature Convergence_)

- **Skenario:** Seluruh populasi memiliki susunan gen serupa pada generasi awal sehingga algoritma berhenti berkembang meskipun masih terdapat pelanggaran _hard constraints_.
- **Mekanisme Penanganan:** Terapkan strategi **Adaptive Mutation Rate & Heuristic Initialization**. Saat populasi awal dibentuk, gen langsung dipasangkan hanya dengan ruangan yang memenuhi tipe ($HC_5$) dan kapasitas ($HC_4$). Apabila nilai _fitness_ terbaik stagnan selama 15 generasi berturut-turut, tingkat mutasi dinaikkan otomatis dari $0.08$ ke $0.25$ selama 5 generasi (_diversity injection_).

### 7.3 Crash pada Komputasi Latar Belakang (_Worker Out-of-Memory / Timeout_)

- **Skenario:** Worker Celery terhenti mendadak karena beban kalkulasi matriks memori melonjak.
- **Mekanisme Penanganan:**
  - Pasang batas waktu eksekusi tugas (`CELERY_TASK_TIME_LIMIT = 600`).
  - Manfaatkan blok `try...except` di Celery: jika tugas gagal, status pada tabel `schedule_jobs` di PostgreSQL langsung diperbarui menjadi `FAILED` dengan keterangan galat lengkap agar frontend menghentikan _polling_.

### 7.4 Penyesuaian Manual yang Memicu Konflik Baru (_Post-generation Manual Swap_)

- **Skenario:** Admin mencoba memindahkan jadwal suatu kelas secara manual di tabel antarmuka, namun perpindahan tersebut memicu bentrok dosen, ruangan, atau bentrok antara kelas `GENERAL` dan kelas `KBK`.
- **Mekanisme Penanganan:** Endpoint `/manual-swap` wajib menjalankan fungsi verifikasi $HC_1$ hingga $HC_6$. Jika pertukaran menimbulkan bentrok mutlak, sistem menolak transaksi dengan kode respons `409 Conflict` dan mengembalikan detail alasan bentroknya.

---

## 8. Rencana Pengujian & Quality Assurance (QA)

### 8.1 Pengujian Unit (Unit Testing - Backend & Algoritma)

- **Verifikasi Fungsi Fitness:** Memastikan setiap jenis pelanggaran ($HC_1 - HC_6$ dan $SC_1 - SC_3$) memicu pinalti nilai yang tepat, termasuk pengujian aturan paralel antar-KBK vs bentrok kelas `GENERAL`.
- **Integritas Operator Genetik:** Menguji bahwa proses _crossover_ dan _mutation_ tidak menghilangkan `class_id` atau menduplikasi kelas yang sama.

### 8.2 Pengujian Integrasi (Integration Testing)

- Menguji siklus hidup tugas: `FastAPI (Trigger) -> Redis (Queue) -> Celery Worker (Compute) -> PostgreSQL (Persist)`.
- Memastikan mekanisme _polling_ frontend menerima pembaruan progres secara mulus.

### 8.3 Pengujian Antarmuka & Visual (Frontend UI/UX)

- Mengaudit visualisasi matriks kalender mingguan pada resolusi laptop (1366x768) dan monitor desktop (1920x1080) menggunakan Chrome DevTools MCP.
- Memastikan antarmuka secara ketat mematuhi palet warna, tipografi, dan struktur komponen (seperti GA Control Panel & Room-Time Grid) yang tertuang dalam dokumen `docs/DESIGN.md`.
- Memastikan filter tampilan berdasarkan Semester dan KBK (`PEMROGRAMAN`, `MULTIMEDIA`, `IOT`) merender kartu jadwal dengan warna pembeda yang jelas tanpa tumpang-tindih.

### 8.4 Pengujian Beban & Skalabilitas (Stress Testing)

- Menguji batas performa dengan dataset simulasi penuh Prodi Ilmu Komputer UBBG (Semester 1, 3, 5, 7 lengkap dengan 3 jalur KBK).
- Kriteria Lolos: Penggunaan memori worker stabil di bawah 500 MB RAM dan proses generasi selesai di bawah 3 menit dengan `hard_conflicts_count = 0`.

---

## 9. Manajemen Proyek & Pembagian Peran Kelompok (5 Anggota)

### 9.1 Matriks RACI (Responsible, Accountable, Consulted, Informed)

| Modul / Komponen Tugas                         | Anggota 1 (PM & QA) | Anggota 2 (GA Specialist) | Anggota 3 (Backend & Async) | Anggota 4 (DB & Data Specialist) | Anggota 5 (Frontend Engineer) |
| :--------------------------------------------- | :-----------------: | :-----------------------: | :-------------------------: | :------------------------------: | :---------------------------: |
| Manajemen Proyek, Dokumentasi, & QA Testing    |      **R / A**      |             C             |              C              |                C                 |               C               |
| Formulasi Matematis & Mesin Algoritma Genetika |          A          |           **R**           |              C              |                C                 |               I               |
| REST API, Celery Worker, & Redis Queue         |          A          |             C             |            **R**            |                C                 |               I               |
| Skema PostgreSQL, Seed Data UBBG, & Ekspor     |          A          |             C             |              C              |              **R**               |               I               |
| UI Dashboard, CRUD Master, & Matriks Kalender  |          A          |             I             |              C              |                I                 |             **R**             |

- **Responsible (R):** Anggota yang mengeksekusi dan bertanggung jawab langsung atas pengerjaan modul tersebut.
- **Accountable (A):** Penanggung jawab utama yang memastikan modul selesai tepat waktu dan sesuai spesifikasi.
- **Consulted (C):** Anggota yang diajak berdiskusi/konsultasi untuk keselarasan teknis dan kebutuhan data.
- **Informed (I):** Anggota yang menerima kabar pembaruan progres atau perubahan antarmuka.

### 9.2 Timeline Pengerjaan Proyek (Sprint 4 Minggu - Eksekusi Lokal)

- **Minggu 1: Inisialisasi Fondasi & Data Master**
  - Penyiapan lingkungan lokal di perangkat utama (PostgreSQL/AlloyDB, Redis, FastAPI, dan Next.js).
  - Implementasi skema 8 tabel PostgreSQL dan pembuatan skrip _seed data_ Prodi Ilmu Komputer UBBG (Semester 1–7 beserta 3 KBK).
  - Pembuatan REST API CRUD data master dan halaman form manajemen data di Next.js.
- **Minggu 2: Pengembangan Inti Algoritma Genetika & Antrean Asinkron**
  - Implementasi inisialisasi populasi heuristik, fungsi pinalti/fitness ($HC_1 - HC_6$, $SC_1 - SC_3$), dan operator evolusi di Python.
  - Uji mandiri performa konvergensi algoritma via terminal lokal (CLI).
  - Integrasi mesin algoritma ke dalam Celery Worker dan Redis broker.
- **Minggu 3: Integrasi Antarmuka & Visualisasi Matriks Kalender**
  - Pembangunan komponen tabel matriks jadwal mingguan responsif dengan filter Semester, KBK, Dosen, dan Ruangan di Next.js.
  - Implementasi mekanisme polling progres (_real-time progress bar_ & metrik generasi).
  - Integrasi tampilan hasil komputasi jadwal dan fitur publikasi jadwal (`is_published`).
- **Minggu 4: Penanganan Kasus Ekstrem, Ekspor, & Finalisasi Laporan**
  - Implementasi validasi awal (_pre-execution check_), fitur _manual swap_ anti-bentrok, dan ekspor ke Excel/PDF.
  - Pengujian menyeluruh (_stress test_ dataset penuh) dan pencatatan metrik eksperimen algoritma.
  - Penyusunan laporan akhir tugas manajemen proyek dan persiapan presentasi kelompok.
