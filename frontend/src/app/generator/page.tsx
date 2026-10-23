'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Sparkles, CheckCircle2, ArrowRight, Download, Eye, LayoutGrid, Calendar, RefreshCw
} from 'lucide-react';
import GAController from '@/components/GAController';
import EvolutionMonitor from '@/components/EvolutionMonitor';
import { GAParameters, ScheduleJob } from '@/lib/types';
import { api } from '@/lib/api';

export default function GeneratorPage() {
  const [activeJob, setActiveJob] = useState<(ScheduleJob & { estimated_remaining_seconds?: number }) | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check on mount if there's an ongoing or recent job
  useEffect(() => {
    async function checkRecentJob() {
      try {
        const history = await api.getJobsHistory();
        if (history.data && history.data.length > 0) {
          const latest = history.data[0];
          setActiveJob(latest);
          if (latest.status === 'RUNNING' || latest.status === 'PENDING') {
            setIsRunning(true);
            startPolling(latest.id);
          }
        }
      } catch (err) {
        console.error('Error fetching job history:', err);
      }
    }
    checkRecentJob();

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, []);

  const startPolling = (jobId: string) => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);

    pollingTimerRef.current = setInterval(async () => {
      try {
        const res = await api.getJobStatus(jobId);
        setActiveJob(res.data);

        if (res.data.status === 'COMPLETED' || res.data.status === 'FAILED') {
          setIsRunning(false);
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);
  };

  const handleStartGeneration = async (params: GAParameters) => {
    setIsRunning(true);
    setPublishSuccess(false);

    try {
      const response = await api.generateSchedule({
        academic_year: '2026/2027',
        semester_type: 'ODD',
        parameters: params,
      });

      const jobId = response.data.job_id;
      setActiveJob({
        id: jobId,
        academic_year: '2026/2027',
        semester_type: 'ODD',
        status: 'PENDING',
        is_published: false,
        progress_percentage: 0,
        current_generation: 0,
        max_generations: params.max_generations,
        best_fitness: 0.0,
        hard_conflicts_count: 0,
        soft_conflicts_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      startPolling(jobId);
    } catch (err: any) {
      alert(`Gagal memicu optimasi: ${err.message}`);
      setIsRunning(false);
    }
  };

  const handlePublish = async () => {
    if (!activeJob) return;
    try {
      await api.publishSchedule(activeJob.id);
      setActiveJob({ ...activeJob, is_published: true });
      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 4000);
    } catch (err: any) {
      alert(`Gagal mempublikasikan: ${err.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-800">
              Mesin Optimasi Penjadwalan (GA Generator)
            </h2>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-[#1D8699] text-xs font-bold whitespace-nowrap shadow-2xs shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#1D8699] animate-pulse"></span>
              <span>Async Celery Worker</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mengeksekusi evolusi populasi solusi jadwal dengan evaluasi 6 Batasan Keras (Hard Constraints) dan 3 Batasan Lunak (Soft Constraints).
          </p>
        </div>
      </div>

      {/* GA Controller Panel */}
      <GAController onStartGeneration={handleStartGeneration} isRunning={isRunning} />

      {/* Live Evolution Monitor */}
      <EvolutionMonitor job={activeJob} />

      {/* Completion Action Card */}
      {activeJob && activeJob.status === 'COMPLETED' && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/15 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <h3 className="text-base font-bold">
                  Jadwal Berhasil Dihasilkan Tanpa Bentrok (Zero Conflicts)!
                </h3>
              </div>
              <p className="text-xs text-emerald-100 max-w-xl">
                Solusi terbaik mencapai nilai fitness {activeJob.best_fitness.toFixed(4)} dalam {activeJob.current_generation} generasi ({activeJob.execution_time_seconds || 1.5}s).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {!activeJob.is_published ? (
                <button
                  type="button"
                  onClick={handlePublish}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/25 transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  Publikasikan Jadwal Resmi
                </button>
              ) : (
                <span className="px-3 py-2 bg-white/20 rounded-xl text-xs font-bold text-white backdrop-blur-xs flex items-center space-x-1.5 whitespace-nowrap shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Resmi Dipublikasikan</span>
                </span>
              )}

              <Link
                href="/schedule"
                className="px-4 py-2.5 bg-white text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5 whitespace-nowrap shrink-0"
              >
                <Calendar className="w-4 h-4 text-[#1D8699] shrink-0" />
                <span>Lihat Tabel Jadwal</span>
              </Link>

              <Link
                href="/schedule/matrix"
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold backdrop-blur-xs transition-all flex items-center space-x-1.5 whitespace-nowrap shrink-0"
              >
                <LayoutGrid className="w-4 h-4 shrink-0" />
                <span>Buka Matriks Ruangan</span>
              </Link>
            </div>
          </div>

          {publishSuccess && (
            <div className="mt-3 p-2.5 bg-emerald-700/60 rounded-xl text-xs text-white border border-emerald-400/40 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Jadwal ini sekarang telah aktif sebagai jadwal resmi yang dapat dilihat oleh dosen dan mahasiswa.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
