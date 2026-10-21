'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, LayoutGrid, FileSpreadsheet, FileText, CheckCircle2, RefreshCw, AlertCircle 
} from 'lucide-react';
import RoomMatrixGrid from '@/components/RoomMatrixGrid';
import ManualSwapModal from '@/components/ManualSwapModal';
import { ScheduleItem, ScheduleJob, Room, TimeSlot } from '@/lib/types';
import { api } from '@/lib/api';

export default function ScheduleMatrixPage() {
  const [job, setJob] = useState<ScheduleJob | null>(null);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual Swap Modal state
  const [swapTarget, setSwapTarget] = useState<ScheduleItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [history, rms, slots] = await Promise.all([
        api.getJobsHistory(),
        api.getRooms(),
        api.getTimeSlots(),
      ]);

      setRooms(rms);
      setTimeSlots(slots);

      const completedJobs = history.data.filter((j) => j.status === 'COMPLETED');
      if (completedJobs.length > 0) {
        const published = completedJobs.find((j) => j.is_published) || completedJobs[0];
        setJob(published);

        const result = await api.getScheduleResult(published.id);
        setSchedules(result.data);
      }
    } catch (err) {
      console.error('Failed to load matrix data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePublish = async () => {
    if (!job) return;
    try {
      await api.publishSchedule(job.id);
      setJob({ ...job, is_published: true });
      alert('Jadwal berhasil ditetapkan sebagai jadwal resmi aktif!');
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
              Matriks Ruangan & Jadwal Kuliah (Room-Time Grid)
            </h2>
            {job && (
              <span className={`whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center ${
                job.is_published 
                  ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                {job.is_published ? 'Resmi Dipublikasikan' : 'Draft / Hasil Generasi'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualisasi pemetaan slot waktu mingguan dan ketersediaan ruangan teori serta laboratorium UBBG.
          </p>
        </div>

        {/* View Switcher & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Switch to Table view */}
          <Link
            href="/schedule"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-[#1D8699]" />
            <span>Tampilan Tabel</span>
          </Link>

          {job && (
            <>
              {/* Export Excel */}
              <a
                href={api.getExportUrl(job.id, 'excel')}
                download
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                <span>Ekspor Excel</span>
              </a>

              {/* Export PDF */}
              <a
                href={api.getExportUrl(job.id, 'pdf')}
                download
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-white" />
                <span>Ekspor PDF</span>
              </a>

              {/* Publish Toggle */}
              {!job.is_published && (
                <button
                  type="button"
                  onClick={handlePublish}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Publikasikan Jadwal</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-[#1D8699] mx-auto mb-2" />
          <p className="text-xs font-semibold">Memuat matriks penggunaan ruangan...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Belum Ada Jadwal Kuliah</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Sistem belum memiliki jadwal teroptimasi. Silakan jalankan proses komputasi pada halaman Generator.
          </p>
          <Link
            href="/generator"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1D8699] text-white rounded-lg text-xs font-bold"
          >
            Buka Generator Jadwal ↗
          </Link>
        </div>
      ) : (
        <RoomMatrixGrid
          schedules={schedules}
          rooms={rooms}
          timeSlots={timeSlots}
          onOpenSwapModal={(item) => setSwapTarget(item)}
        />
      )}

      {/* Manual Swap Modal */}
      {swapTarget && (
        <ManualSwapModal
          schedule={swapTarget}
          rooms={rooms}
          timeSlots={timeSlots}
          onClose={() => setSwapTarget(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
