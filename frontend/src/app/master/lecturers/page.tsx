'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Plus, Trash2, Edit2, Clock, CheckCircle2, AlertTriangle, RefreshCw, 
  Search, Filter, UserCheck, Briefcase, Calendar, CheckSquare, Square, X, 
  Sparkles, SlidersHorizontal, ArrowRight, ShieldAlert, Check
} from 'lucide-react';
import { Lecturer, TimeSlot, LecturerPreference, BatchPreferenceRequest, BulkPreferenceRequest } from '@/lib/types';
import { api } from '@/lib/api';

const DAY_NAMES: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
};

const KBK_CONFIG: Record<string, { label: string; badge: string; border: string }> = {
  GENERAL: { label: 'Bisa Semua KBK', badge: 'bg-slate-100 text-slate-700 border-slate-200', border: 'border-slate-300' },
  PEMROGRAMAN: { label: 'KBK Pemrograman', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', border: 'border-indigo-300' },
  MULTIMEDIA: { label: 'KBK Multimedia', badge: 'bg-pink-50 text-pink-700 border-pink-200', border: 'border-pink-300' },
  IOT: { label: 'KBK IoT', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', border: 'border-emerald-300' },
};

export default function LecturersPage() {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [preferences, setPreferences] = useState<LecturerPreference[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'TETAP' | 'TAMU'>('ALL');
  const [filterKbk, setFilterKbk] = useState<'ALL' | 'GENERAL' | 'PEMROGRAMAN' | 'MULTIMEDIA' | 'IOT'>('ALL');

  // Add/Edit Lecturer Modal
  const [showLecturerModal, setShowLecturerModal] = useState(false);
  const [editingLecturerId, setEditingLecturerId] = useState<string | null>(null);
  const [formNidn, setFormNidn] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formJabatan, setFormJabatan] = useState('');
  const [formIsGuest, setFormIsGuest] = useState(false);
  const [formKbk, setFormKbk] = useState<'GENERAL' | 'PEMROGRAMAN' | 'MULTIMEDIA' | 'IOT'>('GENERAL');

  // Preference Modal State
  const [showPrefModal, setShowPrefModal] = useState(false);
  const [prefTab, setPrefTab] = useState<'BATCH' | 'MATRIX' | 'SINGLE'>('BATCH');
  const [targetLecId, setTargetLecId] = useState('');

  // Batch Day Preference Form State
  const [batchMode, setBatchMode] = useState<'UNAVAILABLE_DAYS' | 'ONLY_AVAILABLE_DAYS' | 'PREFERRED_DAYS'>('UNAVAILABLE_DAYS');
  const [selectedDays, setSelectedDays] = useState<number[]>([1]); // default Senin
  const [batchTimeRange, setBatchTimeRange] = useState<'ALL' | 'MORNING' | 'AFTERNOON'>('ALL');
  const [batchReason, setBatchReason] = useState('');
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  // Single Slot Preference Form State
  const [singleSlotId, setSingleSlotId] = useState('');
  const [singlePrefType, setSinglePrefType] = useState<'UNAVAILABLE' | 'PREFERRED'>('UNAVAILABLE');
  const [singleReason, setSingleReason] = useState('');

  // Interactive Matrix Local Changes State (slotId -> 'UNAVAILABLE' | 'PREFERRED' | 'NONE')
  const [matrixDraft, setMatrixDraft] = useState<Record<string, 'UNAVAILABLE' | 'PREFERRED' | 'NONE'>>({});
  const [matrixSaving, setMatrixSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lecs, slots, prefs] = await Promise.all([
        api.getLecturers(),
        api.getTimeSlots(),
        api.getPreferences(),
      ]);
      setLecturers(lecs);
      setTimeSlots(slots);
      setPreferences(prefs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingLecturerId(null);
    setFormNidn('');
    setFormName('');
    setFormEmail('');
    setFormJabatan('');
    setFormIsGuest(false);
    setFormKbk('GENERAL');
    setShowLecturerModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (lec: Lecturer) => {
    setEditingLecturerId(lec.id);
    setFormNidn(lec.nidn || '');
    setFormName(lec.name);
    setFormEmail(lec.email);
    setFormJabatan(lec.jabatan || '');
    setFormIsGuest(!!lec.is_guest);
    setFormKbk(lec.kbk || 'GENERAL');
    setShowLecturerModal(true);
  };

  // Save Lecturer (Add or Edit)
  const handleSaveLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLecturerId) {
        await api.updateLecturer(editingLecturerId, {
          nidn: formNidn.trim() || undefined,
          name: formName.trim(),
          email: formEmail.trim(),
          jabatan: formJabatan.trim() || undefined,
          is_guest: formIsGuest,
          kbk: formKbk,
        });
      } else {
        await api.createLecturer({
          nidn: formNidn.trim() || undefined,
          name: formName.trim(),
          email: formEmail.trim(),
          jabatan: formJabatan.trim() || undefined,
          is_guest: formIsGuest,
          kbk: formKbk,
        });
      }
      setShowLecturerModal(false);
      loadData();
    } catch (err: any) {
      alert(`Gagal menyimpan data dosen: ${err.message}`);
    }
  };

  const handleDeleteLecturer = async (id: string) => {
    if (!confirm('Hapus dosen ini? Pastikan tidak ada kelas perkuliahan aktif yang mengikat dosen ini.')) return;
    try {
      await api.deleteLecturer(id);
      loadData();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  // Open Preference Modal for a specific lecturer or general
  const handleOpenPrefModal = (lecturerId?: string, defaultTab: 'BATCH' | 'MATRIX' | 'SINGLE' = 'BATCH') => {
    const chosenLec = lecturerId || (lecturers.length > 0 ? lecturers[0].id : '');
    setTargetLecId(chosenLec);
    setPrefTab(defaultTab);
    if (timeSlots.length > 0) {
      setSingleSlotId(timeSlots[0].id);
    }
    setBatchReason('');
    setSelectedDays([1]); // default Senin
    setShowPrefModal(true);
  };

  // Synchronize matrix draft whenever target lecturer changes or modal opens
  useEffect(() => {
    if (!targetLecId) return;
    const currentPrefs = preferences.filter((p) => p.lecturer_id === targetLecId);
    const draft: Record<string, 'UNAVAILABLE' | 'PREFERRED' | 'NONE'> = {};
    currentPrefs.forEach((p) => {
      draft[p.time_slot_id] = p.preference_type;
    });
    setMatrixDraft(draft);
  }, [targetLecId, preferences, showPrefModal]);

  // Handle Batch Day Preference Submission
  const handleApplyBatchPreference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLecId) {
      alert('Silakan pilih dosen terlebih dahulu.');
      return;
    }
    if (selectedDays.length === 0) {
      alert('Pilih minimal satu hari.');
      return;
    }

    setBatchSubmitting(true);
    try {
      const res = await api.createBatchPreference({
        lecturer_id: targetLecId,
        mode: batchMode,
        days: selectedDays,
        time_range: batchTimeRange,
        reason: batchReason.trim() || undefined,
        clear_existing_days: true,
      });
      alert(res.message);
      setShowPrefModal(false);
      loadData();
    } catch (err: any) {
      alert(`Gagal menerapkan preferensi: ${err.message}`);
    } finally {
      setBatchSubmitting(false);
    }
  };

  // Toggle Day Selection for Batch Form
  const toggleDaySelection = (dayNum: number) => {
    setSelectedDays((prev) => 
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]
    );
  };

  // Handle Single Slot Preference
  const handleCreateSinglePreference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLecId || !singleSlotId) return;
    try {
      await api.createPreference({
        lecturer_id: targetLecId,
        time_slot_id: singleSlotId,
        preference_type: singlePrefType,
        reason: singleReason.trim() || undefined,
      });
      setShowPrefModal(false);
      setSingleReason('');
      loadData();
    } catch (err: any) {
      alert(`Gagal menyimpan preferensi: ${err.message}`);
    }
  };

  // Handle Matrix Slot Click: NONE -> UNAVAILABLE -> PREFERRED -> NONE
  const handleMatrixCellClick = (slotId: string) => {
    setMatrixDraft((prev) => {
      const current = prev[slotId] || 'NONE';
      let next: 'UNAVAILABLE' | 'PREFERRED' | 'NONE' = 'NONE';
      if (current === 'NONE') next = 'UNAVAILABLE';
      else if (current === 'UNAVAILABLE') next = 'PREFERRED';
      else next = 'NONE';

      return { ...prev, [slotId]: next };
    });
  };

  // Quick Action on Whole Day in Matrix
  const handleSetDayInMatrix = (dayNum: number, targetType: 'UNAVAILABLE' | 'PREFERRED' | 'NONE') => {
    const daySlots = timeSlots.filter((ts) => ts.day_of_week === dayNum);
    setMatrixDraft((prev) => {
      const updated = { ...prev };
      daySlots.forEach((ts) => {
        updated[ts.id] = targetType;
      });
      return updated;
    });
  };

  // Save Interactive Matrix
  const handleSaveMatrixDraft = async () => {
    if (!targetLecId) return;
    setMatrixSaving(true);
    try {
      const slotsPayload = Object.entries(matrixDraft).map(([timeSlotId, prefType]) => ({
        time_slot_id: timeSlotId,
        preference_type: prefType,
        reason: prefType === 'UNAVAILABLE' ? 'Berhalangan hadir' : (prefType === 'PREFERRED' ? 'Prioritas mengajar' : undefined),
      }));

      const res = await api.bulkUpdatePreferences({
        lecturer_id: targetLecId,
        slots: slotsPayload,
      });
      alert(res.message);
      setShowPrefModal(false);
      loadData();
    } catch (err: any) {
      alert(`Gagal menyimpan perubahan matriks: ${err.message}`);
    } finally {
      setMatrixSaving(false);
    }
  };

  // Clear all preferences for a lecturer
  const handleResetLecturerPreferences = async () => {
    if (!targetLecId) return;
    const lec = lecturers.find((l) => l.id === targetLecId);
    if (!confirm(`Hapus dan reset semua aturan ketersediaan/preferensi waktu untuk ${lec?.name || 'dosen ini'}?`)) return;

    try {
      const res = await api.clearLecturerPreferences(targetLecId);
      alert(res.message);
      setShowPrefModal(false);
      loadData();
    } catch (err: any) {
      alert(`Gagal mereset: ${err.message}`);
    }
  };

  const handleDeletePreference = async (id: string) => {
    try {
      await api.deletePreference(id);
      loadData();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  // Filtered lecturers list
  const filteredLecturers = useMemo(() => {
    return lecturers.filter((l) => {
      // Status filter
      if (filterStatus === 'TETAP' && l.is_guest) return false;
      if (filterStatus === 'TAMU' && !l.is_guest) return false;

      // KBK filter
      if (filterKbk !== 'ALL' && (l.kbk || 'GENERAL') !== filterKbk) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = l.name.toLowerCase().includes(q);
        const matchNidn = (l.nidn || '').toLowerCase().includes(q);
        const matchJabatan = (l.jabatan || '').toLowerCase().includes(q);
        const matchEmail = (l.email || '').toLowerCase().includes(q);
        const matchKbk = (l.kbk || 'GENERAL').toLowerCase().includes(q);
        if (!matchName && !matchNidn && !matchJabatan && !matchEmail && !matchKbk) return false;
      }
      return true;
    });
  }, [lecturers, filterStatus, filterKbk, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = lecturers.length;
    const guestCount = lecturers.filter((l) => l.is_guest).length;
    const permanentCount = total - guestCount;
    const unavailableCount = preferences.filter((p) => p.preference_type === 'UNAVAILABLE').length;
    const preferredCount = preferences.filter((p) => p.preference_type === 'PREFERRED').length;
    
    // Group by KBK
    const kbkCounts = {
      GENERAL: lecturers.filter((l) => (l.kbk || 'GENERAL') === 'GENERAL').length,
      PEMROGRAMAN: lecturers.filter((l) => l.kbk === 'PEMROGRAMAN').length,
      MULTIMEDIA: lecturers.filter((l) => l.kbk === 'MULTIMEDIA').length,
      IOT: lecturers.filter((l) => l.kbk === 'IOT').length,
    };

    return { total, guestCount, permanentCount, unavailableCount, preferredCount, kbkCounts, totalPrefs: preferences.length };
  }, [lecturers, preferences]);

  // Lecturer preference count map
  const prefCountByLec = useMemo(() => {
    const counts: Record<string, { unavail: number; pref: number }> = {};
    preferences.forEach((p) => {
      if (!counts[p.lecturer_id]) {
        counts[p.lecturer_id] = { unavail: 0, pref: 0 };
      }
      if (p.preference_type === 'UNAVAILABLE') counts[p.lecturer_id].unavail += 1;
      else if (p.preference_type === 'PREFERRED') counts[p.lecturer_id].pref += 1;
    });
    return counts;
  }, [preferences]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#1D8699]" />
            <span>Data Master Dosen & Preferensi Waktu</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Mengatur profil dosen, kategori bidang keahlian (KBK), serta jadwal kehadiran dan preferensi waktu mengajar.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
          <button
            onClick={() => handleOpenPrefModal(undefined, 'BATCH')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0 shadow-2xs border border-slate-300/70"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Atur Jadwal & Preferensi</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#1D8699] hover:bg-[#166978] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Tambah Dosen</span>
          </button>
        </div>
      </div>

      {/* Summary Statistic Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">Total Dosen</div>
            <div className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-800 mt-0.5 whitespace-nowrap">{stats.total} Orang</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Tetap: {stats.permanentCount} • Tamu: {stats.guestCount}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#1D8699]/10 text-[#1D8699] flex items-center justify-center font-bold text-xs shrink-0">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">Spesialisasi KBK</div>
            <div className="text-xs font-bold text-slate-700 mt-1 flex flex-wrap gap-1">
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">Umum: {stats.kbkCounts.GENERAL}</span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px]">Prog: {stats.kbkCounts.PEMROGRAMAN}</span>
            </div>
            <div className="text-xs font-bold text-slate-700 mt-0.5 flex flex-wrap gap-1">
              <span className="px-1.5 py-0.5 rounded bg-pink-50 text-pink-700 text-[10px]">Multi: {stats.kbkCounts.MULTIMEDIA}</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px]">IoT: {stats.kbkCounts.IOT}</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">Waktu Berhalangan</div>
            <div className="text-base sm:text-lg lg:text-xl font-extrabold text-rose-700 mt-0.5 whitespace-nowrap">{stats.unavailableCount} Slot</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Aturan Keras (HC6)</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">Prioritas Mengajar</div>
            <div className="text-base sm:text-lg lg:text-xl font-extrabold text-emerald-700 mt-0.5 whitespace-nowrap">{stats.preferredCount} Slot</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Preferensi Lunak (SC1)</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-[#1D8699] mx-auto mb-2" />
          <p className="text-xs font-semibold">Memuat data dosen dan preferensi...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lecturers Table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Table Header Filter & Search */}
            <div className="p-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama, NIDN, jabatan, KBK..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20 focus:border-[#1D8699]"
                  />
                </div>

                {/* Filter Status */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1D8699]"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="TETAP">Dosen Tetap</option>
                  <option value="TAMU">Dosen Tamu</option>
                </select>

                {/* Filter KBK */}
                <select
                  value={filterKbk}
                  onChange={(e) => setFilterKbk(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1D8699]"
                >
                  <option value="ALL">Semua Bidang KBK</option>
                  <option value="GENERAL">Semua KBK / Umum</option>
                  <option value="PEMROGRAMAN">KBK Pemrograman</option>
                  <option value="MULTIMEDIA">KBK Multimedia</option>
                  <option value="IOT">KBK IoT</option>
                </select>
              </div>

              <div className="text-[11px] font-bold text-slate-500 whitespace-nowrap shrink-0">
                Menampilkan <span className="text-[#1D8699] font-extrabold">{filteredLecturers.length}</span> dari {lecturers.length} Dosen
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase border-b border-slate-200 tracking-wider">
                    <th className="py-3 px-3.5 whitespace-nowrap">NIDN</th>
                    <th className="py-3 px-3.5">Nama & Jabatan</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Kategori KBK</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Status</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Jadwal / Preferensi</th>
                    <th className="py-3 px-3.5 text-center whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLecturers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Tidak ada dosen yang cocok dengan pencarian atau filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLecturers.map((lec) => {
                      const kbkInfo = KBK_CONFIG[lec.kbk || 'GENERAL'] || KBK_CONFIG.GENERAL;
                      const lecPrefCount = prefCountByLec[lec.id] || { unavail: 0, pref: 0 };

                      return (
                        <tr key={lec.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3.5 font-mono-metrics font-bold text-slate-700 whitespace-nowrap">
                            {lec.nidn || <span className="text-slate-400 font-normal italic">-</span>}
                          </td>
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-slate-800 text-[13px]">{lec.name}</div>
                            {lec.jabatan && (
                              <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{lec.jabatan}</div>
                            )}
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{lec.email}</div>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${kbkInfo.badge}`}>
                              {kbkInfo.label}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            {lec.is_guest ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                Dosen Tamu
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Dosen Tetap
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenPrefModal(lec.id, 'BATCH')}
                              className="group text-left"
                              title="Klik untuk membuka pengatur jadwal ketersediaan dosen ini"
                            >
                              <div className="flex items-center space-x-1.5 text-[11px]">
                                {lecPrefCount.unavail > 0 ? (
                                  <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded font-semibold text-[10px]">
                                    {lecPrefCount.unavail} Libur
                                  </span>
                                ) : null}
                                {lecPrefCount.pref > 0 ? (
                                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold text-[10px]">
                                    {lecPrefCount.pref} Prioritas
                                  </span>
                                ) : null}
                                {lecPrefCount.unavail === 0 && lecPrefCount.pref === 0 ? (
                                  <span className="text-slate-400 text-[10px] italic group-hover:text-[#1D8699]">
                                    + Atur Waktu
                                  </span>
                                ) : null}
                              </div>
                            </button>
                          </td>
                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handleOpenPrefModal(lec.id, 'BATCH')}
                                title="Atur Preferensi Waktu"
                                className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-md cursor-pointer transition-colors"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(lec)}
                                title="Edit Data Dosen & KBK"
                                className="p-1 text-[#1D8699] hover:text-[#166978] hover:bg-cyan-50 rounded-md cursor-pointer transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteLecturer(lec.id)}
                                title="Hapus Dosen"
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Preferences Summary & Quick View List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-4">
            <div className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-[#1D8699]" />
                <span>Daftar Preferensi Waktu Aktif</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                {preferences.length} Aturan
              </span>
            </div>

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 no-scrollbar">
              {preferences.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <Clock className="w-7 h-7 mx-auto text-slate-300 mb-2" />
                  <p className="font-medium text-slate-500">Belum ada aturan preferensi waktu.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Gunakan tombol <strong>&quot;Atur Jadwal & Preferensi&quot;</strong> untuk menentukan hari libur atau hari prioritas mengajar dosen.
                  </p>
                </div>
              ) : (
                preferences.map((pref) => {
                  const lec = lecturers.find((l) => l.id === pref.lecturer_id);
                  const slot = timeSlots.find((s) => s.id === pref.time_slot_id);
                  const isUnavailable = pref.preference_type === 'UNAVAILABLE';

                  return (
                    <div
                      key={pref.id}
                      className={`p-2.5 rounded-xl border text-xs flex items-start justify-between shadow-2xs transition-all ${
                        isUnavailable
                          ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                          : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="font-bold text-slate-900 truncate">{lec?.name || 'Dosen'}</div>
                        <div className="text-[11px] font-mono-metrics font-medium text-slate-700">
                          {slot ? `${DAY_NAMES[slot.day_of_week]}, Sesi ${slot.period_order} (${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)})` : '-'}
                        </div>
                        <div className="text-[10px] flex items-center space-x-1 font-semibold pt-0.5">
                          <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                            isUnavailable ? 'bg-rose-200/80 text-rose-800' : 'bg-emerald-200/80 text-emerald-800'
                          }`}>
                            {isUnavailable ? 'Berhalangan (Tidak Bisa)' : 'Prioritas Mengajar'}
                          </span>
                        </div>
                        {pref.reason && (
                          <div className="text-[10px] text-slate-500 italic truncate max-w-[200px]">
                            &quot;{pref.reason}&quot;
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeletePreference(pref.id)}
                        title="Hapus Aturan Slot Ini"
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT LECTURER (WITH KBK SPECIALIZATION CATEGORY)           */}
      {/* ========================================================================= */}
      {showLecturerModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#1D8699]" />
                <span>{editingLecturerId ? 'Edit Data Dosen & KBK' : 'Tambah Dosen Baru'}</span>
              </h3>
              <button
                onClick={() => setShowLecturerModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLecturer} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    NIDN <span className="text-slate-400 font-normal">(Opsional)</span>:
                  </label>
                  <input
                    type="text"
                    value={formNidn}
                    onChange={(e) => setFormNidn(e.target.value)}
                    placeholder="Contoh: 1318018001"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20 font-mono-metrics"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email Kampus:</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="Contoh: dosen@bbg.ac.id"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap & Gelar:</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Khairuman, S.Kom, M.Kom"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Jabatan Institusi:</label>
                <input
                  type="text"
                  value={formJabatan}
                  onChange={(e) => setFormJabatan(e.target.value)}
                  placeholder="Contoh: Ketua Prodi S1 ILKOM / Dosen Pengampu"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                />
              </div>

              {/* KATEGORI BIDANG KEAHLIAN (KBK) */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <label className="font-bold text-slate-800 block">
                  Kategori Spesialisasi KBK Dosen:
                </label>
                <p className="text-[11px] text-slate-500">
                  Menentukan kesesuaian mengajar dosen dengan mata kuliah peminatan KBK (Pemrograman, Multimedia, IoT) atau kelas wajib umum.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {[
                    { id: 'GENERAL', label: 'Bisa Semua KBK', desc: 'Mata kuliah umum & lintas peminatan', color: 'border-slate-300 peer-checked:border-[#1D8699] peer-checked:bg-teal-50/60' },
                    { id: 'PEMROGRAMAN', label: 'KBK Pemrograman', desc: 'Software, Web, Data Science, AI', color: 'border-slate-300 peer-checked:border-indigo-500 peer-checked:bg-indigo-50/60' },
                    { id: 'MULTIMEDIA', label: 'KBK Multimedia', desc: 'Game Dev, Grafika, Animasi, UI/UX', color: 'border-slate-300 peer-checked:border-pink-500 peer-checked:bg-pink-50/60' },
                    { id: 'IOT', label: 'KBK IoT', desc: 'Jaringan, Embedded, Sensor, Robotika', color: 'border-slate-300 peer-checked:border-emerald-500 peer-checked:bg-emerald-50/60' },
                  ].map((kbkItem) => (
                    <label
                      key={kbkItem.id}
                      className="relative flex flex-col p-2.5 rounded-lg border cursor-pointer hover:bg-slate-100/50 transition-all text-xs"
                    >
                      <input
                        type="radio"
                        name="form_kbk"
                        value={kbkItem.id}
                        checked={formKbk === kbkItem.id}
                        onChange={() => setFormKbk(kbkItem.id as any)}
                        className="peer sr-only"
                      />
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{kbkItem.label}</span>
                        {formKbk === kbkItem.id && <Check className="w-3.5 h-3.5 text-[#1D8699]" />}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 leading-snug">{kbkItem.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Dosen Tamu */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="is_guest_cb"
                  checked={formIsGuest}
                  onChange={(e) => setFormIsGuest(e.target.checked)}
                  className="rounded border-slate-300 text-[#1D8699] focus:ring-[#1D8699] cursor-pointer"
                />
                <label htmlFor="is_guest_cb" className="font-semibold text-slate-700 cursor-pointer">
                  Tandai sebagai Dosen Tamu / Pengampu Luar (Guest Lecturer)
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLecturerModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1D8699] hover:bg-[#166978] text-white rounded-lg font-bold cursor-pointer"
                >
                  {editingLecturerId ? 'Simpan Perubahan' : 'Simpan Dosen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: COMPLETE PREFERENCE & AVAILABILITY MANAGER (BATCH, MATRIX, SLOT) */}
      {/* ========================================================================= */}
      {showPrefModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Atur Preferensi & Ketersediaan Waktu Dosen
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tentukan hari libur berhalangan hadir atau hari masuk prioritas mengajar dosen.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPrefModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lecturer Picker Selector */}
            <div className="py-3 px-3.5 bg-slate-50 border border-slate-200/80 rounded-xl my-3 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Dosen Target:</span>
                <select
                  value={targetLecId}
                  onChange={(e) => setTargetLecId(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D8699]/30 min-w-[240px]"
                >
                  {lecturers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} • [{l.kbk || 'GENERAL'}] {l.is_guest ? '(Tamu)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleResetLecturerPreferences}
                className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold flex items-center space-x-1 cursor-pointer hover:underline self-end sm:self-auto"
                title="Hapus seluruh preferensi untuk dosen ini dan kembalikan ke kondisi bebas"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Semua Aturan Waktu Dosen Ini</span>
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b border-slate-200 text-xs font-semibold mb-4 shrink-0">
              <button
                onClick={() => setPrefTab('BATCH')}
                className={`pb-2.5 px-4 cursor-pointer transition-colors border-b-2 flex items-center space-x-1.5 ${
                  prefTab === 'BATCH'
                    ? 'border-[#1D8699] text-[#1D8699] font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Pilihan Hari Cepat (Batch Aturan Hari)</span>
              </button>

              <button
                onClick={() => setPrefTab('MATRIX')}
                className={`pb-2.5 px-4 cursor-pointer transition-colors border-b-2 flex items-center space-x-1.5 ${
                  prefTab === 'MATRIX'
                    ? 'border-[#1D8699] text-[#1D8699] font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Matriks Mingguan Interaktif</span>
              </button>

              <button
                onClick={() => setPrefTab('SINGLE')}
                className={`pb-2.5 px-4 cursor-pointer transition-colors border-b-2 flex items-center space-x-1.5 ${
                  prefTab === 'SINGLE'
                    ? 'border-[#1D8699] text-[#1D8699] font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Per-Sesi Manual</span>
              </button>
            </div>

            {/* TAB 1: BATCH DAY SELECTION FORM */}
            {prefTab === 'BATCH' && (
              <form onSubmit={handleApplyBatchPreference} className="space-y-4 overflow-y-auto pr-1 text-xs">
                {/* 1. Pilih Jenis Kebijakan Hari */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1.5">
                    1. Pilih Jenis Kebijakan Ketersediaan Hari:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <label
                      onClick={() => setBatchMode('UNAVAILABLE_DAYS')}
                      className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                        batchMode === 'UNAVAILABLE_DAYS'
                          ? 'border-rose-500 bg-rose-50/70 text-rose-950 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-extrabold flex items-center space-x-1.5 text-xs text-rose-700">
                          <ShieldAlert className="w-4 h-4 shrink-0" />
                          <span>TIDAK BISA pada Hari Ini</span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1 leading-snug">
                          Dosen berhalangan hadir pada hari-hari yang Anda centang (mis. Tidak bisa hari Senin).
                        </p>
                      </div>
                      <span className="text-[9px] font-bold text-rose-600 mt-2 block uppercase">Batasan Keras (HC6)</span>
                    </label>

                    <label
                      onClick={() => setBatchMode('ONLY_AVAILABLE_DAYS')}
                      className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                        batchMode === 'ONLY_AVAILABLE_DAYS'
                          ? 'border-amber-500 bg-amber-50/70 text-amber-950 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-extrabold flex items-center space-x-1.5 text-xs text-amber-700">
                          <Calendar className="w-4 h-4 shrink-0" />
                          <span>HANYA BISA Hari Tertentu Saja</span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1 leading-snug">
                          Dosen hanya masuk pada hari yang dicentang (mis. Hanya Selasa & Kamis). Hari lainnya otomatis ditutup!
                        </p>
                      </div>
                      <span className="text-[9px] font-bold text-amber-600 mt-2 block uppercase">Kunci Hari Masuk</span>
                    </label>

                    <label
                      onClick={() => setBatchMode('PREFERRED_DAYS')}
                      className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                        batchMode === 'PREFERRED_DAYS'
                          ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-extrabold flex items-center space-x-1.5 text-xs text-emerald-700">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>PRIORITAS pada Hari Ini</span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1 leading-snug">
                          Mengutamakan penempatan kelas dosen pada hari yang dicentang jika ruangan tersedia.
                        </p>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-600 mt-2 block uppercase">Preferensi Lunak (SC1)</span>
                    </label>
                  </div>
                </div>

                {/* 2. Checklist Hari */}
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">
                      2. Centang Hari yang Dipilih:
                    </label>
                    <div className="space-x-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSelectedDays([1, 2, 3, 4, 5])}
                        className="text-[#1D8699] font-bold hover:underline cursor-pointer"
                      >
                        Senin - Jumat
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedDays([1, 2, 3, 4, 5, 6])}
                        className="text-[#1D8699] font-bold hover:underline cursor-pointer"
                      >
                        Semua Hari
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedDays([])}
                        className="text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Bersihkan
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
                    {[1, 2, 3, 4, 5, 6].map((dayNum) => {
                      const isChecked = selectedDays.includes(dayNum);
                      return (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => toggleDaySelection(dayNum)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                            isChecked
                              ? 'bg-[#1D8699] text-white border-[#1D8699] shadow-xs scale-102'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <div className="text-xs">{DAY_NAMES[dayNum]}</div>
                          <div className="text-[10px] font-normal opacity-90 mt-0.5">
                            {isChecked ? '✓ Terpilih' : '+ Pilih'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Rentang Jam */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      3. Rentang Jam Pembelajaran:
                    </label>
                    <select
                      value={batchTimeRange}
                      onChange={(e) => setBatchTimeRange(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D8699]/30"
                    >
                      <option value="ALL">Sepanjang Hari Penuh (Semua Sesi 1 s/d 9)</option>
                      <option value="MORNING">Sesi Pagi Saja (Sesi 1 s/d 4: 09:00 - 12:20)</option>
                      <option value="AFTERNOON">Sesi Sore Saja (Sesi 5 s/d 9: 14:00 - 18:10)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      4. Alasan / Keterangan (Opsional):
                    </label>
                    <input
                      type="text"
                      value={batchReason}
                      onChange={(e) => setBatchReason(e.target.value)}
                      placeholder="Contoh: Rapat struktural fakultas / dinas luar kota"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D8699]/30"
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPrefModal(false)}
                    className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={batchSubmitting}
                    className="px-5 py-2 bg-[#1D8699] hover:bg-[#166978] text-white rounded-lg font-bold cursor-pointer shadow-xs disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    {batchSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Menerapkan...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Terapkan Aturan Hari</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: INTERACTIVE WEEKLY MATRIX GRID */}
            {prefTab === 'MATRIX' && (
              <div className="space-y-3 overflow-y-auto pr-1 text-xs flex-1 flex flex-col">
                <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-slate-700">Keterangan Klik Sel:</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-white border border-dashed border-slate-300" /> Bebas
                    </span>
                    <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
                      <span className="w-3 h-3 rounded bg-rose-500 text-white flex items-center justify-center text-[9px]">✕</span> Tidak Bisa
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                      <span className="w-3 h-3 rounded bg-emerald-500 text-white flex items-center justify-center text-[9px]">★</span> Prioritas
                    </span>
                  </div>
                  <span className="text-slate-400">Klik sel untuk mengubah status ketersediaan</span>
                </div>

                {/* Matrix Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl flex-1">
                  <table className="w-full text-center border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2 px-2 border-r border-slate-200 text-left">Sesi / Jam</th>
                        {[1, 2, 3, 4, 5, 6].map((dayNum) => (
                          <th key={dayNum} className="py-2 px-2 border-r border-slate-200 min-w-[90px]">
                            <div className="font-bold text-slate-800">{DAY_NAMES[dayNum]}</div>
                            <div className="flex items-center justify-center space-x-1 mt-1 text-[9px] font-normal">
                              <button
                                type="button"
                                onClick={() => handleSetDayInMatrix(dayNum, 'UNAVAILABLE')}
                                title="Tandai seluruh hari ini Tidak Bisa"
                                className="px-1 py-0.5 rounded bg-rose-100 text-rose-700 hover:bg-rose-200 font-bold"
                              >
                                ✕ Libur
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetDayInMatrix(dayNum, 'PREFERRED')}
                                title="Tandai seluruh hari ini Prioritas"
                                className="px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-bold"
                              >
                                ★ Prior
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetDayInMatrix(dayNum, 'NONE')}
                                title="Reset hari ini ke Bebas"
                                className="px-1 py-0.5 rounded bg-slate-200 text-slate-600 hover:bg-slate-300"
                              >
                                ↺
                              </button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((period) => (
                        <tr key={period} className="hover:bg-slate-50/50">
                          <td className="py-2 px-2 border-r border-slate-200 font-mono-metrics text-left font-bold text-slate-600 bg-slate-50/60 whitespace-nowrap">
                            Jam ke-{period}
                          </td>
                          {[1, 2, 3, 4, 5, 6].map((dayNum) => {
                            const slot = timeSlots.find((s) => s.day_of_week === dayNum && s.period_order === period);
                            if (!slot) {
                              return <td key={dayNum} className="p-1 border-r border-slate-200 text-slate-300">-</td>;
                            }

                            const currentType = matrixDraft[slot.id] || 'NONE';

                            return (
                              <td key={dayNum} className="p-1 border-r border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => handleMatrixCellClick(slot.id)}
                                  className={`w-full py-2 px-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                                    currentType === 'UNAVAILABLE'
                                      ? 'bg-rose-500 text-white border-rose-600 shadow-2xs scale-102'
                                      : currentType === 'PREFERRED'
                                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-2xs scale-102'
                                      : 'bg-white hover:bg-slate-100 text-slate-400 border-dashed border-slate-200'
                                  }`}
                                  title={`${DAY_NAMES[dayNum]} Jam ${period}: Klik untuk ubah`}
                                >
                                  {currentType === 'UNAVAILABLE' && <span>✕ Tidak Bisa</span>}
                                  {currentType === 'PREFERRED' && <span>★ Prioritas</span>}
                                  {currentType === 'NONE' && <span className="text-[10px] text-slate-300">Bebas</span>}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Matrix Actions */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500">
                    Perubahan langsung terlihat di tabel atas setelah disimpan.
                  </div>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowPrefModal(false)}
                      className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveMatrixDraft}
                      disabled={matrixSaving}
                      className="px-5 py-2 bg-[#1D8699] hover:bg-[#166978] text-white rounded-lg font-bold cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {matrixSaving ? 'Menyimpan Matriks...' : 'Simpan Perubahan Matriks'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SINGLE SLOT MANUAL FORM */}
            {prefTab === 'SINGLE' && (
              <form onSubmit={handleCreateSinglePreference} className="space-y-3.5 overflow-y-auto pr-1 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Pilih Slot Sesi Tertentu:</label>
                  <select
                    value={singleSlotId}
                    onChange={(e) => setSingleSlotId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20 font-medium"
                  >
                    {timeSlots.map((ts) => (
                      <option key={ts.id} value={ts.id}>
                        {DAY_NAMES[ts.day_of_week]}, Sesi {ts.period_order} ({ts.start_time.slice(0, 5)} - {ts.end_time.slice(0, 5)} WIB)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipe Aturan:</label>
                  <select
                    value={singlePrefType}
                    onChange={(e) => setSinglePrefType(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20 font-semibold"
                  >
                    <option value="UNAVAILABLE">Berhalangan Hadir (Tidak Boleh Dijadwalkan - Hard Constraint HC6)</option>
                    <option value="PREFERRED">Prioritas Mengajar (Diutamakan Jika Tersedia - Soft Constraint SC1)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Alasan / Catatan:</label>
                  <input
                    type="text"
                    value={singleReason}
                    onChange={(e) => setSingleReason(e.target.value)}
                    placeholder="Misal: Kuliah S3 / Jadwal Praktikum Luar"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPrefModal(false)}
                    className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1D8699] hover:bg-[#166978] text-white rounded-lg font-bold cursor-pointer shadow-xs"
                  >
                    Simpan Sesi Ini
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
