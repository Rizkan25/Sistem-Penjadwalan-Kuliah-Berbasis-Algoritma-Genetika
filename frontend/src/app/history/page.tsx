'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  History, CheckCircle2, AlertOctagon, Clock, RefreshCw, 
  Sparkles, Copy, Check, Eye, AlertTriangle, ShieldCheck, 
  Layers, ArrowUpRight, Lock, CheckCheck
} from 'lucide-react';
import { ScheduleJob } from '@/lib/types';
import { api } from '@/lib/api';

export default function HistoryPage() {
  const [jobs, setJobs] = useState<ScheduleJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'ALL' | 'PUBLISHED' | 'READY' | 'REVISE'>('ALL');

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getJobsHistory();
      setJobs(res.data);
    } catch (err) {
      console.error('Failed to load jobs history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePublish = async (jobId: string) => {
    try {
      const val = await api.validateSchedule(jobId);
      if (!val.is_valid) {
        alert(
          `Gagal publikasi: Jadwal ini memiliki ${val.hard_conflicts_count} bentrok mutlak terhadap data master terbaru (${val.conflict_details.slice(0, 2).join(', ')}). Status: Perlu dibuat ulang.`
        );
        loadHistory();
        return;
      }
      await api.publishSchedule(jobId);
      alert('Jadwal ini sekarang telah resmi dipublikasikan sebagai jadwal aktif prodi!');
      loadHistory();
    } catch (err: any) {
      alert(`Gagal mempublikasikan: ${err.message}`);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = jobs.length;
    const published = jobs.filter((j) => j.is_published).length;
    const ready = jobs.filter((j) => j.status === 'COMPLETED' && j.hard_conflicts_count === 0 && !j.is_published).length;
    const needsRevise = jobs.filter((j) => j.status === 'COMPLETED' && j.hard_conflicts_count > 0).length;
    return { total, published, ready, needsRevise };
  }, [jobs]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    if (filterTab === 'PUBLISHED') return jobs.filter((j) => j.is_published);
    if (filterTab === 'READY') return jobs.filter((j) => j.status === 'COMPLETED' && j.hard_conflicts_count === 0 && !j.is_published);
    if (filterTab === 'REVISE') return jobs.filter((j) => j.status === 'COMPLETED' && j.hard_conflicts_count > 0);
    return jobs;
  }, [jobs, filterTab]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 min-w-10 min-h-10 max-w-10 max-h-10 aspect-square shrink-0 rounded-xl bg-[#1D8699]/10 border border-[#1D8699]/20 flex items-center justify-center text-[#1D8699] self-start sm:self-center shadow-2xs">
              <History className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">
                Riwayat Generasi & Arsip Jadwal
              </h1>
              <p className="text-xs text-slate-500">
                Log eksekusi Algoritma Genetika, metrik konvergensi fitness, dan status rilis resmi.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
          <button
            onClick={loadHistory}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Segarkan daftar riwayat"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin text-[#1D8699]' : ''}`} />
            <span>Muat Ulang</span>
          </button>

          <Link
            href="/generator"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#1D8699] text-white text-xs font-semibold hover:bg-[#166978] transition-all shadow-xs hover:shadow-md hover:shadow-[#1D8699]/20"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Generasi Baru</span>
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Optimasi */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-500 truncate" title="Total Optimasi">
              Total Optimasi
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-800 font-mono-metrics leading-none">
              {stats.total}
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 truncate">
              pekerjaan komputasi
            </div>
          </div>
        </div>

        {/* Resmi Aktif */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-amber-200/80 shadow-2xs hover:shadow-xs transition-all bg-gradient-to-br from-white to-amber-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-amber-800 truncate" title="Resmi Aktif">
              Resmi Aktif
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-100/80 flex items-center justify-center text-amber-700 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-800 font-mono-metrics leading-none">
              {stats.published}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-1.5 truncate">
              jadwal dipublikasikan
            </div>
          </div>
        </div>

        {/* Siap Dirilis */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-emerald-200/80 shadow-2xs hover:shadow-xs transition-all bg-gradient-to-br from-white to-emerald-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-emerald-800 truncate" title="Siap Dirilis">
              Siap Dirilis
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100/80 flex items-center justify-center text-emerald-700 shrink-0">
              <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-800 font-mono-metrics leading-none">
              {stats.ready}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1.5 truncate">
              0 bentrok (draft optimal)
            </div>
          </div>
        </div>

        {/* Perlu Dibuat Ulang */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-rose-200/80 shadow-2xs hover:shadow-xs transition-all bg-gradient-to-br from-white to-rose-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-rose-800 truncate" title="Perlu Dibuat Ulang">
              Perlu Dibuat Ulang
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-100/80 flex items-center justify-center text-rose-700 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-rose-700 font-mono-metrics leading-none">
              {stats.needsRevise}
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-1.5 truncate">
              memiliki bentrok mutlak
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Filter Tabs */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-1 p-1 bg-slate-200/60 rounded-xl text-xs font-semibold text-slate-600 overflow-x-auto max-w-full">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Semua ({stats.total})
            </button>
            <button
              onClick={() => setFilterTab('PUBLISHED')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                filterTab === 'PUBLISHED' ? 'bg-white text-amber-800 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>Resmi ({stats.published})</span>
            </button>
            <button
              onClick={() => setFilterTab('READY')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                filterTab === 'READY' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Siap Rilis ({stats.ready})</span>
            </button>
            <button
              onClick={() => setFilterTab('REVISE')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                filterTab === 'REVISE' ? 'bg-white text-rose-700 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>Perlu Revisi ({stats.needsRevise})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium shrink-0">
            Menampilkan <span className="font-bold text-slate-700">{filteredJobs.length}</span> pekerjaan
          </div>
        </div>

        {/* Content State */}
        {loading ? (
          <div className="p-16 text-center text-slate-500">
            <RefreshCw className="w-7 h-7 animate-spin text-[#1D8699] mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-700">Memuat riwayat eksekusi GA...</p>
            <p className="text-[11px] text-slate-400 mt-1">Mengambil status konvergensi dari basis data</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <History className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Tidak ada riwayat pada tab ini</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {filterTab === 'ALL'
                  ? 'Belum ada eksekusi algoritma genetika yang tersimpan.'
                  : 'Tidak ada pekerjaan dengan kriteria filter yang dipilih.'}
              </p>
            </div>
            {filterTab === 'ALL' ? (
              <Link
                href="/generator"
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1D8699] text-white rounded-xl text-xs font-bold hover:bg-[#166978] transition shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mulai Generasi Baru</span>
              </Link>
            ) : (
              <button
                onClick={() => setFilterTab('ALL')}
                className="text-xs font-semibold text-[#1D8699] hover:underline cursor-pointer"
              >
                Lihat Semua Riwayat
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-2.5 px-2 min-w-[115px]">Sesi & ID</th>
                  <th className="py-2.5 px-1.5 min-w-[115px]">Status</th>
                  <th className="py-2.5 px-1 text-center min-w-[46px]">Generasi</th>
                  <th className="py-2.5 px-1 text-center min-w-[48px]">Fitness</th>
                  <th className="py-2.5 px-1 text-center min-w-[56px]">Konflik</th>
                  <th className="py-2.5 px-1 text-center min-w-[48px] hidden lg:table-cell">Durasi</th>
                  <th className="py-2.5 px-2 text-center min-w-[145px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredJobs.map((j) => {
                  const hasHardConflicts = j.hard_conflicts_count > 0 || j.is_valid === false;
                  const shortId = j.id ? j.id.slice(0, 8) : '--------';
                  const isCopied = copiedId === j.id;

                  return (
                    <tr 
                      key={j.id} 
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        j.is_published ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Kolom 1: Sesi & ID */}
                      <td className="py-2 px-2 align-middle">
                        <div className="flex items-center space-x-1">
                          <span className="font-bold text-slate-900 text-xs whitespace-nowrap">
                            T.A. {j.academic_year}
                          </span>
                          <span className="text-[9.5px] px-1 py-0.2 rounded font-semibold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                            {j.semester_type === 'ODD' ? 'Ganjil' : 'Genap'}
                          </span>
                        </div>

                        {/* ID Badge + Copy Button */}
                        <div className="flex items-center space-x-1 mt-0.5">
                          <button
                            type="button"
                            onClick={(e) => handleCopyId(j.id, e)}
                            className="inline-flex items-center space-x-0.5 font-mono-metrics text-[9.5px] text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200/80 px-1 py-0.5 rounded transition cursor-pointer shrink-0"
                            title="Klik untuk menyalin UUID lengkap"
                          >
                            <span>#{shortId}</span>
                            {isCopied ? (
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-600" />
                            )}
                          </button>
                          {isCopied ? (
                            <span className="text-[9.5px] font-bold text-emerald-600 animate-fade-in whitespace-nowrap">
                              Tersalin!
                            </span>
                          ) : (
                            <span className="text-[9.5px] text-slate-400 whitespace-nowrap">
                              • {new Date(j.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Kolom 2: Status Badge */}
                      <td className="py-2 px-1.5 align-middle whitespace-nowrap">
                        {j.is_published ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                            <span>Resmi Dipublikasikan</span>
                          </span>
                        ) : j.status === 'COMPLETED' ? (
                          hasHardConflicts ? (
                            <span 
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs"
                              title={`${j.hard_conflicts_count} bentrok mutlak: Dosen, Ruangan, atau Rombel bentrok. Perlu optimasi ulang.`}
                            >
                              <AlertOctagon className="w-3 h-3 text-rose-600 shrink-0" />
                              <span>Perlu Dibuat Ulang</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Siap Dirilis</span>
                            </span>
                          )
                        ) : j.status === 'RUNNING' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-300 shadow-2xs">
                            <RefreshCw className="w-3 h-3 text-[#1D8699] animate-spin shrink-0" />
                            <span>Progres {j.progress_percentage}%</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
                            <AlertOctagon className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>Gagal</span>
                          </span>
                        )}
                      </td>

                      {/* Kolom 3: Generasi */}
                      <td className="py-2 px-1 text-center align-middle font-mono-metrics whitespace-nowrap">
                        <span className="font-bold text-slate-800 text-xs">
                          {j.current_generation}
                        </span>
                        <span className="text-[10px] text-slate-400">/{j.max_generations}</span>
                      </td>

                      {/* Kolom 4: Fitness Score */}
                      <td className="py-2 px-1 text-center align-middle whitespace-nowrap">
                        <span className="inline-block font-mono-metrics font-bold text-[10.5px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {j.best_fitness > 0 ? j.best_fitness.toFixed(4) : '-'}
                        </span>
                      </td>

                      {/* Kolom 5: Konflik */}
                      <td className="py-2 px-1 text-center align-middle whitespace-nowrap">
                        <div className="inline-flex items-center space-x-0.5 font-mono-metrics text-xs">
                          {j.hard_conflicts_count === 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              0 HC
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-300">
                              {j.hard_conflicts_count} HC
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-medium">
                            {j.soft_conflicts_count} SC
                          </span>
                        </div>
                      </td>

                      {/* Kolom 6: Durasi (Tampil pada layar laptop/desktop lg: ke atas) */}
                      <td className="py-2 px-1 text-center align-middle font-mono-metrics text-xs text-slate-600 font-medium whitespace-nowrap hidden lg:table-cell">
                        {j.execution_time_seconds ? `${j.execution_time_seconds.toFixed(1)}s` : '-'}
                      </td>

                      {/* Kolom 7: Aksi (Format 2 Kolom Sejajar & Rapi) */}
                      <td className="py-2 px-2 text-center align-middle">
                        <div className="grid grid-cols-2 gap-1.5 w-[145px] mx-auto items-center whitespace-nowrap">
                          {j.status === 'COMPLETED' ? (
                            <>
                              {/* Tombol 1: Buka Jadwal (Selalu Kolom Kiri) */}
                              <Link
                                href="/schedule"
                                className="w-full inline-flex items-center justify-center space-x-1 px-2 py-1 bg-[#1D8699] text-white rounded-lg text-[10.5px] font-semibold hover:bg-[#166978] transition-colors shadow-2xs"
                                title="Lihat matriks dan tabel jadwal hasil optimasi"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Buka</span>
                              </Link>

                              {/* Tombol 2 / Status: Publikasi / Terkunci / Aktif (Selalu Kolom Kanan) */}
                              {j.is_published ? (
                                <span 
                                  className="w-full inline-flex items-center justify-center space-x-1 px-1.5 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-lg text-[10.5px] font-bold shadow-2xs"
                                  title="Jadwal resmi yang sedang aktif"
                                >
                                  <Check className="w-2.5 h-2.5 text-amber-600" />
                                  <span>Aktif</span>
                                </span>
                              ) : !hasHardConflicts ? (
                                <button
                                  type="button"
                                  onClick={() => handlePublish(j.id)}
                                  className="w-full inline-flex items-center justify-center space-x-1 px-1.5 py-1 bg-amber-600 text-white rounded-lg text-[10.5px] font-semibold hover:bg-amber-700 cursor-pointer transition-colors shadow-2xs"
                                  title="Publikasikan jadwal ini sebagai jadwal resmi yang aktif"
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-amber-200" />
                                  <span>Publikasi</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  title="Jadwal memiliki bentrok mutlak sehingga terkunci dan tidak dapat dipublikasikan. Silakan generate ulang."
                                  className="w-full inline-flex items-center justify-center space-x-1 px-1.5 py-1 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-[10px] font-medium cursor-not-allowed"
                                >
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>Terkunci</span>
                                </button>
                              )}
                            </>
                          ) : (
                            <div className="col-span-2 text-[10px] text-slate-400 italic">
                              -
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

