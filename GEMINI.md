# Aturan Proyek: Sistem Penjadwalan Kuliah Berbasis Algoritma Genetika (SPK-AG)

Seluruh spesifikasi arsitektur, pemodelan matematis, skema basis data, dan referensi desain visual mengacu penuh pada dua dokumen utama berikut:

- **PRD (Backend, API, & Mesin GA):** @[PRD](docs/PRD.md)
- **DESIGN System (Frontend & UI/UX):** @[DESIGN](docs/DESIGN.md)

## Panduan Utama Eksekusi (Single-Machine Local):

1. **Integritas Batasan Jadwal:**
   - Wajib mematuhi 6 Batasan Keras ($HC_1$ hingga $HC_6$) dengan toleransi pelanggaran 0 (`hard_conflicts_count = 0`).
   - Optimalkan 3 Batasan Lunak ($SC_1$ hingga $SC_3$) menggunakan fungsi penalti bertingkat.

2. **Aturan Akademik Prodi Ilmu Komputer UBBG:**
   - Semester 1 & 2 menggunakan rombel umum (`kbk = 'GENERAL'`).
   - Semester 3 ke atas terbagi menjadi 3 peminatan: `PEMROGRAMAN`, `MULTIMEDIA`, dan `IOT`.
   - Pada semester dan kelompok kelas (_cohort_) yang sama, kelas `GENERAL` tidak boleh bentrok dengan kelas KBK mana pun, tetapi kelas antar-KBK yang berbeda boleh berjalan paralel di jam yang sama.
   - Kunci waktu bebas perkuliahan pada hari Jumat pukul `11:30 - 14:00 WIB`.

3. **Arsitektur & Pencegahan Timeout:**
   - Gunakan Python (FastAPI), Celery + Redis, Next.js (Tailwind CSS), dan PostgreSQL.
   - Seluruh komputasi Algoritma Genetika wajib dieksekusi di latar belakang melalui Celery Worker agar request HTTP tidak mengalami _timeout_.

4. **Implementasi Antarmuka (Frontend UI/UX):**
   - Wajib mematuhi aturan palet warna (OpenSIMKA Theme), hierarki komponen, dan tipografi yang tercantum di `docs/DESIGN.md`.
   - Bangun komponen khusus seperti _Live Evolution Monitor_ untuk status asinkron GA dan _Room-Time Timetable Grid_ (Matriks Ruangan) secara interaktif.

## Aturan Penggunaan MCP Server:

1. **Context7 (`context7`):** Gunakan sebelum menulis kode FastAPI, SQLAlchemy, Celery, dan Next.js untuk mengambil referensi dokumentasi versi terbaru yang bebas sintaksis usang (_deprecated_).
2. **Database (`AlloyDB for PostgreSQL`):** Gunakan untuk mengeksekusi pembuatan tabel, mengisi data awal (_seed data_), dan menguji query pendeteksi bentrok jadwal secara langsung.
3. **Frontend Debugging (`Chrome DevTools for agents`):** Gunakan setelah membuat atau memperbarui halaman Next.js untuk memeriksa _console errors_, memantau _network polling_ status generasi jadwal, dan merapikan visualisasi komponen tata letak matriks jadwal agar sesuai dengan panduan `DESIGN.md`.
