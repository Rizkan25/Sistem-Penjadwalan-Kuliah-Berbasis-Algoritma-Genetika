'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { History, CheckCircle2, AlertOctagon, Clock, ArrowRight, RefreshCw, Award } from 'lucide-react';
import { ScheduleJob } from '@/lib/types';
import { api } from '@/lib/api';

export default function HistoryPage() {
  const [jobs, setJobs] = useState<ScheduleJob[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handlePublish = async (jobId: string) => {
    try {
      await api.publishSchedule(jobId);
      alert('Jadwal ini sekarang telah resmi dipublikasikan!');
      loadHistory();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <History className="w-5 h-5 text-[#1D8699]" />
            <span>Riwayat Eksekusi Algoritma Genetika</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar seluruh proses generasi jadwal, riwayat konvergensi fitness, dan log eksekusi.
          </p>
        </div>

        <button
          onClick={loadHistory}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Muat Ulang</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-[#1D8699] mx-auto mb-2" />
          <p className="text-xs font-semibold">Memuat riwayat generasi...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
          <p className="text-xs font-medium">Belum ada riwayat pekerjaan optimasi.</p>
          <Link
            href="/generator"
            className="inline-block px-4 py-2 bg-[#1D8699] text-white rounded-lg text-xs font-bold"
          >
            Mulai Generasi Baru ↗
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 border-b border-slate-200">Job ID & Tahun Akademik</th>
                  <th className="py-3 px-4 border-b border-slate-200">Status</th>
                  <th className="py-3 px-4 border-b border-slate-200 text-center">Generasi</th>
                  <th className="py-3 px-4 border-b border-slate-200 text-center">Fitness Score</th>
                  <th className="py-3 px-4 border-b border-slate-200 text-center">Konflik</th>
                  <th className="py-3 px-4 border-b border-slate-200 text-center">Durasi</th>
                  <th className="py-3 px-4 border-b border-slate-200 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 text-xs">
                        T.A. {j.academic_year} ({j.semester_type === 'ODD' ? 'Ganjil' : 'Genap'})
                      </div>
                      <div className="font-mono-metrics text-[10px] text-slate-400">
                        {j.id}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(j.created_at).toLocaleString('id-ID')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${
                          j.status === 'COMPLETED' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : j.status === 'RUNNING'
                            ? 'bg-cyan-100 text-cyan-800 animate-pulse'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {j.status}
                        </span>
                        {j.is_published && (
                          <span className="text-[10px] text-amber-700 font-bold">
                            ✓ Resmi Dipublikasikan
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono-metrics font-bold">
                      {j.current_generation} / {j.max_generations}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono-metrics font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {j.best_fitness > 0 ? j.best_fitness.toFixed(4) : '-'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center space-y-0.5 text-[10px]">
                        <span className={`font-bold ${j.hard_conflicts_count === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {j.hard_conflicts_count} Hard
                        </span>
                        <span className="text-amber-600 font-semibold">
                          {j.soft_conflicts_count} Soft
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono-metrics text-slate-600">
                      {j.execution_time_seconds ? `${j.execution_time_seconds.toFixed(1)}s` : '-'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {j.status === 'COMPLETED' && (
                          <>
                            <Link
                              href="/schedule"
                              className="px-2.5 py-1 bg-[#1D8699] text-white rounded-md text-[11px] font-semibold hover:bg-[#166978]"
                            >
                              Buka
                            </Link>

                            {!j.is_published && (
                              <button
                                type="button"
                                onClick={() => handlePublish(j.id)}
                                className="px-2.5 py-1 bg-amber-600 text-white rounded-md text-[11px] font-semibold hover:bg-amber-700 cursor-pointer"
                              >
                                Publikasi
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
