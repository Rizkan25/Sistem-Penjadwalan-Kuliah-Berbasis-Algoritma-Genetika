'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Plus, Trash2, Clock, CheckCircle2, AlertTriangle, RefreshCw, 
  Search, Filter, UserCheck, Briefcase 
} from 'lucide-react';
import { Lecturer, TimeSlot, LecturerPreference } from '@/lib/types';
import { api } from '@/lib/api';

const DAY_NAMES: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
};

export default function LecturersPage() {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [preferences, setPreferences] = useState<LecturerPreference[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'TETAP' | 'TAMU'>('ALL');

  // New Lecturer Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNidn, setNewNidn] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newJabatan, setNewJabatan] = useState('');
  const [newIsGuest, setNewIsGuest] = useState(false);

  // New Preference Form
  const [showPrefModal, setShowPrefModal] = useState(false);
  const [selectedLecId, setSelectedLecId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [prefType, setPrefType] = useState<'UNAVAILABLE' | 'PREFERRED'>('UNAVAILABLE');
  const [prefReason, setPrefReason] = useState('');

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

  const handleCreateLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLecturer({
        nidn: newNidn.trim() || undefined,
        name: newName.trim(),
        email: newEmail.trim(),
        jabatan: newJabatan.trim() || undefined,
        is_guest: newIsGuest,
      });
      setShowAddModal(false);
      setNewNidn('');
      setNewName('');
      setNewEmail('');
      setNewJabatan('');
      setNewIsGuest(false);
      loadData();
    } catch (err: any) {
      alert(`Gagal membuat dosen: ${err.message}`);
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

  const handleCreatePreference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLecId || !selectedSlotId) return;
    try {
      await api.createPreference({
        lecturer_id: selectedLecId,
        time_slot_id: selectedSlotId,
        preference_type: prefType,
        reason: prefReason.trim() || undefined,
      });
      setShowPrefModal(false);
      setPrefReason('');
      loadData();
    } catch (err: any) {
      alert(`Gagal menyimpan preferensi: ${err.message}`);
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

  // Filtered lecturers
  const filteredLecturers = useMemo(() => {
    return lecturers.filter((l) => {
      // Status filter
      if (filterStatus === 'TETAP' && l.is_guest) return false;
      if (filterStatus === 'TAMU' && !l.is_guest) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = l.name.toLowerCase().includes(q);
        const matchNidn = (l.nidn || '').toLowerCase().includes(q);
        const matchJabatan = (l.jabatan || '').toLowerCase().includes(q);
        const matchEmail = (l.email || '').toLowerCase().includes(q);
        if (!matchName && !matchNidn && !matchJabatan && !matchEmail) return false;
      }
      return true;
    });
  }, [lecturers, filterStatus, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = lecturers.length;
    const guestCount = lecturers.filter((l) => l.is_guest).length;
    const permanentCount = total - guestCount;
    const unavailableCount = preferences.filter((p) => p.preference_type === 'UNAVAILABLE').length;
    return { total, guestCount, permanentCount, unavailableCount, totalPrefs: preferences.length };
  }, [lecturers, preferences]);

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
            Mengatur daftar dosen pengampu Prodi S1 Ilmu Komputer UBBG serta preferensi dan ketersediaan waktu mengajar.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (lecturers.length > 0 && timeSlots.length > 0) {
                setSelectedLecId(lecturers[0].id);
                setSelectedSlotId(timeSlots[0].id);
                setShowPrefModal(true);
              }
            }}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Tambah Preferensi</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#1D8699] hover:bg-[#166978] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
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
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#1D8699]/10 text-[#1D8699] flex items-center justify-center font-bold text-xs shrink-0">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">Dosen Tetap</div>
            <div className="text-base sm:text-lg lg:text-xl font-extrabold text-emerald-700 mt-0.5 whitespace-nowrap">{stats.permanentCount} Orang</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">Dosen Tamu</div>
            <div className="text-base sm:text-lg lg:text-xl font-extrabold text-amber-700 mt-0.5 whitespace-nowrap">{stats.guestCount} Orang</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">Aturan Waktu</div>
            <div className="text-base sm:text-lg lg:text-xl font-extrabold text-indigo-700 mt-0.5 whitespace-nowrap">{stats.totalPrefs} Aturan</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-[#1D8699] mx-auto mb-2" />
          <p className="text-xs font-semibold">Memuat data dosen...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lecturers Table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Table Header Filter & Search */}
            <div className="p-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari dosen, NIDN, jabatan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20 focus:border-[#1D8699]"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1D8699]"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="TETAP">Dosen Tetap</option>
                  <option value="TAMU">Dosen Tamu</option>
                </select>
              </div>

              <div className="text-[11px] font-bold text-slate-500">
                Menampilkan <span className="text-[#1D8699] font-extrabold">{filteredLecturers.length}</span> dari {lecturers.length} Dosen
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase border-b border-slate-200 tracking-wider">
                    <th className="py-3 px-4 whitespace-nowrap">NIDN</th>
                    <th className="py-3 px-4">Nama & Jabatan</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status Kepegawaian</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4 text-center whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLecturers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Tidak ada dosen yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredLecturers.map((lec) => (
                      <tr key={lec.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono-metrics font-bold text-slate-700 whitespace-nowrap">
                          {lec.nidn || <span className="text-slate-400 font-normal italic">-</span>}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 text-[13px]">{lec.name}</div>
                          {lec.jabatan && (
                            <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{lec.jabatan}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {lec.is_guest ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ring-2 ring-amber-200/60 shrink-0" />
                              Dosen Tamu
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200/60 shrink-0" />
                              Dosen Tetap
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                          {lec.email}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteLecturer(lec.id)}
                            title="Hapus Dosen"
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Preferences List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-4">
            <div className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-[#1D8699]" />
                <span>Waktu Berhalangan & Prioritas</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                {preferences.length} Aturan
              </span>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {preferences.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Belum ada preferensi dosen yang diatur.
                </div>
              ) : (
                preferences.map((pref) => {
                  const lec = lecturers.find((l) => l.id === pref.lecturer_id);
                  const slot = timeSlots.find((s) => s.id === pref.time_slot_id);
                  const isUnavailable = pref.preference_type === 'UNAVAILABLE';

                  return (
                    <div
                      key={pref.id}
                      className={`p-3 rounded-xl border text-xs flex items-start justify-between shadow-2xs transition-all ${
                        isUnavailable
                          ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                          : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900">{lec?.name || 'Dosen'}</div>
                        <div className="text-[11px] font-mono-metrics font-medium text-slate-700">
                          {slot ? `${DAY_NAMES[slot.day_of_week]}, Sesi ${slot.period_order} (${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)})` : '-'}
                        </div>
                        <div className="text-[10px] flex items-center space-x-1 font-semibold">
                          <span>Kategori:</span>
                          <span className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] ${
                            isUnavailable ? 'bg-rose-200/80 text-rose-800' : 'bg-emerald-200/80 text-emerald-800'
                          }`}>
                            {isUnavailable ? 'Berhalangan Hadir' : 'Prioritas Mengajar'}
                          </span>
                        </div>
                        {pref.reason && (
                          <div className="text-[10px] text-slate-600 italic">
                            &quot;{pref.reason}&quot;
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeletePreference(pref.id)}
                        title="Hapus Aturan"
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Lecturer */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#1D8699]" />
              <span>Tambah Dosen Baru</span>
            </h3>
            <form onSubmit={handleCreateLecturer} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  NIDN <span className="text-slate-400 font-normal">(Opsional untuk Dosen Tamu)</span>:
                </label>
                <input
                  type="text"
                  value={newNidn}
                  onChange={(e) => setNewNidn(e.target.value)}
                  placeholder="Contoh: 1318018001"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20 font-mono-metrics"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap & Gelar:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Khairuman, S.Kom, M.Kom"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Jabatan Institusi:</label>
                <input
                  type="text"
                  value={newJabatan}
                  onChange={(e) => setNewJabatan(e.target.value)}
                  placeholder="Contoh: Ketua Prodi S1 ILKOM / Dosen Pengampu"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Kampus:</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Contoh: dosen@bbg.ac.id"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1 pb-1">
                <input
                  type="checkbox"
                  id="is_guest_cb"
                  checked={newIsGuest}
                  onChange={(e) => setNewIsGuest(e.target.checked)}
                  className="rounded border-slate-300 text-[#1D8699] focus:ring-[#1D8699]"
                />
                <label htmlFor="is_guest_cb" className="font-semibold text-slate-700 cursor-pointer">
                  Tandai sebagai Dosen Tamu (Guest Lecturer)
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1D8699] hover:bg-[#166978] text-white rounded-lg font-bold cursor-pointer"
                >
                  Simpan Dosen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Preference */}
      {showPrefModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#1D8699]" />
              <span>Atur Preferensi Waktu Dosen</span>
            </h3>
            <form onSubmit={handleCreatePreference} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pilih Dosen:</label>
                <select
                  value={selectedLecId}
                  onChange={(e) => setSelectedLecId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                >
                  {lecturers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} {l.is_guest ? '(Dosen Tamu)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Slot Waktu:</label>
                <select
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                >
                  {timeSlots.map((ts) => (
                    <option key={ts.id} value={ts.id}>
                      {DAY_NAMES[ts.day_of_week]}, Sesi {ts.period_order} ({ts.start_time.slice(0, 5)} - {ts.end_time.slice(0, 5)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tipe Preferensi:</label>
                <select
                  value={prefType}
                  onChange={(e) => setPrefType(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                >
                  <option value="UNAVAILABLE">Berhalangan Hadir (Tidak Boleh Dijadwalkan)</option>
                  <option value="PREFERRED">Prioritas Mengajar (Diutamakan Jika Tersedia)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Alasan / Catatan:</label>
                <input
                  type="text"
                  value={prefReason}
                  onChange={(e) => setPrefReason(e.target.value)}
                  placeholder="Mis. Rapat pimpinan fakultas atau riset lab"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowPrefModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1D8699] hover:bg-[#166978] text-white rounded-lg font-bold cursor-pointer"
                >
                  Simpan Preferensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
