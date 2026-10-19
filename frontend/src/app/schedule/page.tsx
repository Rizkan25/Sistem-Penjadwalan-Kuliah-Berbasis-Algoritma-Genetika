'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, LayoutGrid, FileSpreadsheet, FileText, CheckCircle2, 
  Search, Filter, RefreshCw, AlertCircle 
} from 'lucide-react';
import ScheduleTable from '@/components/ScheduleTable';
import ManualSwapModal from '@/components/ManualSwapModal';
import { ScheduleItem, ScheduleJob, Room, TimeSlot, Lecturer } from '@/lib/types';
import { api } from '@/lib/api';

export default function ScheduleTablePage() {
  const [job, setJob] = useState<ScheduleJob | null>(null);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<ScheduleItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSemester, setSelectedSemester] = useState<number | 'ALL'>('ALL');
  const [selectedKBK, setSelectedKBK] = useState<string>('ALL');
  const [selectedLecturerId, setSelectedLecturerId] = useState<string>('ALL');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Manual Swap Modal state
  const [swapTarget, setSwapTarget] = useState<ScheduleItem | null>(null);

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [history, rms, slots, lecs] = await Promise.all([
        api.getJobsHistory(),
        api.getRooms(),
        api.getTimeSlots(),
        api.getLecturers(),
      ]);

      setRooms(rms);
      setTimeSlots(slots);
      setLecturers(lecs);

      // Pick latest completed job or published job
      const completedJobs = history.data.filter((j) => j.status === 'COMPLETED');
      if (completedJobs.length > 0) {
        const published = completedJobs.find((j) => j.is_published) || completedJobs[0];
        setJob(published);

        const result = await api.getScheduleResult(published.id);
        setSchedules(result.data);
      }
    } catch (err) {
      console.error('Failed to load schedule data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter schedules locally for instant UI responsiveness
  useEffect(() => {
    let result = [...schedules];

    if (selectedSemester !== 'ALL') {
      result = result.filter((s) => s.semester === selectedSemester);
    }

    if (selectedKBK !== 'ALL') {
      result = result.filter((s) => s.kbk === selectedKBK);
    }

    if (selectedLecturerId !== 'ALL') {
      result = result.filter((s) => s.lecturer_id === selectedLecturerId);
    }

    if (selectedRoomId !== 'ALL') {
      result = result.filter((s) => s.room_id === selectedRoomId);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.course_name.toLowerCase().includes(q) ||
          s.course_code.toLowerCase().includes(q) ||
          s.lecturer_name.toLowerCase().includes(q) ||
          s.room_code.toLowerCase().includes(q) ||
          s.class_name.toLowerCase().includes(q)
      );
    }

    setFilteredSchedules(result);
  }, [schedules, selectedSemester, selectedKBK, selectedLecturerId, selectedRoomId, searchQuery]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <span>Tabel Jadwal Perkuliahan Resmi</span>
            {job && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                job.is_published 
                  ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                {job.is_published ? 'Resmi Dipublikasikan' : 'Draft / Hasil Generasi'}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Menampilkan seluruh sesi mata kuliah yang telah dioptimasi oleh Algoritma Genetika tanpa bentrok mutlak.
          </p>
        </div>

        {/* View Switcher & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Switch to Matrix view */}
          <Link
            href="/schedule/matrix"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#1D8699]" />
            <span>Matriks Ruangan</span>
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

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari MK, Dosen, Ruang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20 focus:border-[#1D8699]"
            />
          </div>

          {/* Filter Semester */}
          <div>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
            >
              <option value="ALL">Semua Semester</option>
              <option value={1}>Semester 1</option>
              <option value={3}>Semester 3</option>
              <option value={5}>Semester 5</option>
              <option value={7}>Semester 7</option>
            </select>
          </div>

          {/* Filter KBK */}
          <div>
            <select
              value={selectedKBK}
              onChange={(e) => setSelectedKBK(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
            >
              <option value="ALL">Semua Jalur KBK</option>
              <option value="GENERAL">Umum (GENERAL)</option>
              <option value="PEMROGRAMAN">KBK Pemrograman</option>
              <option value="MULTIMEDIA">KBK Multimedia</option>
              <option value="IOT">KBK Internet of Things (IoT)</option>
            </select>
          </div>

          {/* Filter Dosen */}
          <div>
            <select
              value={selectedLecturerId}
              onChange={(e) => setSelectedLecturerId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
            >
              <option value="ALL">Semua Dosen Pengampu</option>
              {lecturers.map((lec) => (
                <option key={lec.id} value={lec.id}>
                  {lec.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Ruangan */}
          <div>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
            >
              <option value="ALL">Semua Ruangan</option>
              {rooms.map((rm) => (
                <option key={rm.id} value={rm.id}>
                  {rm.code} ({rm.room_type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Total stats filter result */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Menampilkan <strong>{filteredSchedules.length}</strong> dari {schedules.length} sesi perkuliahan
          </span>
          {(selectedSemester !== 'ALL' || selectedKBK !== 'ALL' || selectedLecturerId !== 'ALL' || selectedRoomId !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedSemester('ALL');
                setSelectedKBK('ALL');
                setSelectedLecturerId('ALL');
                setSelectedRoomId('ALL');
                setSearchQuery('');
              }}
              className="text-[#1D8699] hover:underline font-semibold text-xs"
            >
              Reset Filter ↺
            </button>
          )}
        </div>
      </div>

      {/* Main Table or Loading */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-[#1D8699] mx-auto mb-2" />
          <p className="text-xs font-semibold">Memuat data jadwal perkuliahan...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Belum Ada Jadwal Kuliah yang Dibuat</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Sistem belum memiliki jadwal teroptimasi. Silakan buka halaman Generator untuk menjalankan proses penyusunan otomatis.
          </p>
          <Link
            href="/generator"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1D8699] text-white rounded-lg text-xs font-bold"
          >
            Buka Generator Jadwal ↗
          </Link>
        </div>
      ) : (
        <ScheduleTable
          schedules={filteredSchedules}
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
