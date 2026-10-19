'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, BookOpen, DoorClosed, School, Cpu, Calendar, LayoutGrid, 
  ArrowRight, CheckCircle2, AlertOctagon, Sparkles, Building2, ShieldCheck
} from 'lucide-react';
import { api } from '@/lib/api';
import { ScheduleJob } from '@/lib/types';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    lecturers: 0,
    courses: 0,
    rooms: 0,
    classes: 0,
  });
  const [latestJob, setLatestJob] = useState<ScheduleJob | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [lecs, crs, rms, cls, jobs] = await Promise.all([
          api.getLecturers().catch(() => []),
          api.getCourses().catch(() => []),
          api.getRooms().catch(() => []),
          api.getClasses().catch(() => []),
          api.getJobsHistory().catch(() => ({ data: [] })),
        ]);

        setStats({
          lecturers: lecs.length,
          courses: crs.length,
          rooms: rms.length,
          classes: cls.length,
        });

        if (jobs.data && jobs.data.length > 0) {
          setLatestJob(jobs.data[0]);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Banner Selamat Datang */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1D8699] to-[#0F4C5C] text-white p-7 shadow-lg shadow-[#1D8699]/15">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Sistem Optimasi Berbasis AI & Algoritma Genetika</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-2">
            Selamat Datang di SIM-JADWAL GA
          </h2>
          <p className="text-sm text-cyan-100 leading-relaxed mb-5">
            Sistem penjadwalan kuliah otomatis Program Studi Ilmu Komputer Universitas Bina Bangsa Getsempena. Mengakomodasi 3 Kelompok Bidang Keahlian (KBK: Pemrograman, Multimedia, IoT) dan batasan ibadah Jumat dengan jaminan bebas bentrok mutlak (Zero Hard Conflicts).
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/generator"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#D4822A] hover:bg-[#b86d1f] text-white text-xs font-bold shadow-md shadow-[#D4822A]/30 transition-all cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              <span>Buka Generator Jadwal (GA)</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              href="/schedule"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Lihat Jadwal Terpublikasi</span>
            </Link>
          </div>
        </div>

        {/* Decorative background watermark */}
        <div className="absolute right-6 -bottom-8 opacity-10 pointer-events-none text-white text-9xl font-black">
          UBBG
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Dosen */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-cyan-50 text-[#1D8699]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Dosen</div>
            <div className="text-xl font-bold font-mono-metrics text-slate-800">
              {loading ? '...' : stats.lecturers}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Dosen Pengampu</div>
          </div>
        </div>

        {/* Total Mata Kuliah */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-amber-50 text-[#D4822A]">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Mata Kuliah</div>
            <div className="text-xl font-bold font-mono-metrics text-slate-800">
              {loading ? '...' : stats.courses}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Teori & Praktikum</div>
          </div>
        </div>

        {/* Total Ruangan */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
            <DoorClosed className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Ruangan</div>
            <div className="text-xl font-bold font-mono-metrics text-slate-800">
              {loading ? '...' : stats.rooms}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Lab Komputer & Teori</div>
          </div>
        </div>

        {/* Total Rombel / Kelas */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <School className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Kelas Perkuliahan</div>
            <div className="text-xl font-bold font-mono-metrics text-slate-800">
              {loading ? '...' : stats.classes}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Rombel Aktif</div>
          </div>
        </div>
      </div>

      {/* Status Jadwal Terkini & Card Penjelasan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Hasil Generasi Terkini */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Status Penjadwalan Terakhir</span>
            </h3>
            <Link
              href="/history"
              className="text-xs text-[#1D8699] hover:underline font-semibold"
            >
              Lihat Semua Riwayat ↗
            </Link>
          </div>

          {latestJob ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800 text-sm">
                      Semester {latestJob.semester_type === 'ODD' ? 'Ganjil' : 'Genap'} T.A. {latestJob.academic_year}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      latestJob.is_published 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {latestJob.is_published ? 'Resmi Dipublikasikan' : 'Draft'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Job ID: <span className="font-mono-metrics text-[11px]">{latestJob.id.slice(0, 18)}...</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    href={`/schedule`}
                    className="px-3.5 py-2 bg-[#1D8699] hover:bg-[#166978] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Buka Hasil Jadwal
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-slate-500 text-[11px]">Hard Conflicts</div>
                  <div className="text-base font-bold font-mono-metrics text-emerald-700">
                    {latestJob.hard_conflicts_count}
                  </div>
                  <div className="text-[10px] text-emerald-600">Bebas Bentrok Mutlak</div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="text-slate-500 text-[11px]">Soft Conflicts</div>
                  <div className="text-base font-bold font-mono-metrics text-amber-700">
                    {latestJob.soft_conflicts_count}
                  </div>
                  <div className="text-[10px] text-amber-600">Pinalti Preferensi</div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="text-slate-500 text-[11px]">Fitness Score</div>
                  <div className="text-base font-bold font-mono-metrics text-blue-700">
                    {latestJob.best_fitness.toFixed(4)}
                  </div>
                  <div className="text-[10px] text-blue-600">Waktu: {latestJob.execution_time_seconds || '-'}s</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">
              Belum ada riwayat komputasi jadwal. Klik tombol &quot;Buka Generator Jadwal&quot; untuk memulai.
            </div>
          )}
        </div>

        {/* Aturan Spesifikasi UBBG */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-[#1D8699]" />
            <h3 className="text-sm font-bold text-slate-800">
              Spesifikasi Aturan UBBG
            </h3>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
              <strong className="text-slate-800 block mb-0.5">1. Pembagian KBK</strong>
              <span>Sem 1–2 menggunakan kelas umum (`GENERAL`). Sem 3+ terbagi 3 KBK: Pemrograman, Multimedia, & IoT.</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
              <strong className="text-slate-800 block mb-0.5">2. Paralelisasi KBK</strong>
              <span>Kelas antar-KBK pada cohort yang sama diizinkan berjalan paralel di waktu bersamaan selama dosen & ruang berbeda.</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
              <strong className="text-slate-800 block mb-0.5">3. Waktu Sholat Jumat</strong>
              <span>Pukul 11:30 - 14:00 WIB pada hari Jumat dikunci untuk menghormati ibadah Sholat Jumat di Banda Aceh.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
