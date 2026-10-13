# Aturan Proyek: Sistem Penjadwalan Kuliah Berbasis Algoritma Genetika (SPK-AG)

Dokumen acuan utama seluruh arsitektur, batasan matematis, skema database, dan API didefinisikan dalam berkas PRD berikut:
@[PRD](docs/PRD.md)

## Panduan Perilaku Utama AI Agent:

1. **Integritas Batasan (Zero Tolerance):**
   - Wajib mematuhi 6 Batasan Keras ($HC_1$ hingga $HC_6$) dengan toleransi pelanggaran 0 ($HC = 0$).
   - Optimasi batasan lunak ($SC_1$ hingga $SC_3$) dengan bobot pinalti lebih rendah.
2. **Karakteristik Akademik UBBG:**
   - Semester 1 & 2 menggunakan rombel umum (`kbk = 'GENERAL'`).
   - Semester 3 ke atas terbagi ke dalam 3 KBK: `PEMROGRAMAN`, `MULTIMEDIA`, dan `IOT`.
   - Kelas antar-KBK pada semester yang sama dapat berjalan paralel di jam yang sama selama ruang dan dosen berbeda.
3. **Tumpukan Teknologi Wajib:**
   - Backend: Python (FastAPI).
   - Antrean & Worker Asinkron: Celery + Redis.
   - Frontend: Next.js + Tailwind CSS.
   - Basis Data: PostgreSQL (AlloyDB).
4. **Pencegahan Timeout:**
   - Seluruh proses kalkulasi Algoritma Genetika wajib dijalankan secara asinkron via Celery worker, bukan langsung di dalam HTTP request FastAPI.
