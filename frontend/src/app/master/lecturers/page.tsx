'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Clock, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
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

  // New Lecturer Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNidn, setNewNidn] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

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
      await api.createLecturer({ nidn: newNidn, name: newName, email: newEmail });
      setShowAddModal(false);
      setNewNidn('');
      setNewName('');
      setNewEmail('');
      loadData();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const handleDeleteLecturer = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data dosen ini?')) return;
    try {
      await api.deleteLecturer(id);
      loadData();
    } catch (err: any) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  const handleCreatePreference = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPreference({
        lecturer_id: selectedLecId,
        time_slot_id: selectedSlotId,
        preference_type: prefType,
        reason: prefReason,
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#1D8699]" />
            <span>Data Master Dosen & Preferensi Waktu</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Mengatur daftar dosen pengampu Prodi Ilmu Komputer UBBG dan preferensi waktu mengajar (HC_6 & SC_1).
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
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Tambah Preferensi</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#1D8699] hover:bg-[#166978] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Dosen</span>
          </button>
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
            <div className="p-4 border-b border-slate-100 font-bold text-slate-800 text-xs">
              Daftar Dosen Pengampu ({lecturers.length})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase border-b border-slate-200">
                    <th className="py-2.5 px-4">NIDN</th>
                    <th className="py-2.5 px-4">Nama Dosen</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lecturers.map((lec) => (
                    <tr key={lec.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono-metrics font-semibold text-slate-600">
                        {lec.nidn}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {lec.name}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {lec.email}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteLecturer(lec.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Preferences List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-4">
            <div className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Waktu Berhalangan & Prioritas</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                {preferences.length} Aturan
              </span>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
              {preferences.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
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
                      className={`p-3 rounded-xl border text-xs flex items-start justify-between ${
                        isUnavailable
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-bold">{lec?.name || 'Dosen'}</div>
                        <div className="text-[11px] font-mono-metrics">
                          {slot ? `${DAY_NAMES[slot.day_of_week]}, Sesi ${slot.period_order} (${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)})` : '-'}
                        </div>
                        <div className="text-[10px] flex items-center space-x-1 font-semibold">
                          <span>Status:</span>
                          <span className={`px-1.5 py-0.2 rounded-sm ${isUnavailable ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200 text-emerald-800'}`}>
                            {isUnavailable ? 'UNAVAILABLE (HC_6)' : 'PREFERRED (SC_1)'}
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
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
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
            <h3 className="text-sm font-bold text-slate-800 mb-4">Tambah Dosen Baru</h3>
            <form onSubmit={handleCreateLecturer} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">NIDN:</label>
                <input
                  type="text"
                  required
                  value={newNidn}
                  onChange={(e) => setNewNidn(e.target.value)}
                  placeholder="Contoh: 0012058501"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap & Gelar:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Teuku Rizky, M.Kom."
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

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1D8699] text-white rounded-lg font-bold cursor-pointer"
                >
                  Simpan
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
            <h3 className="text-sm font-bold text-slate-800 mb-4">Atur Preferensi Waktu Dosen</h3>
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
                      {l.name}
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
                  <option value="UNAVAILABLE">UNAVAILABLE — Dosen Berhalangan (Hard Constraint HC_6)</option>
                  <option value="PREFERRED">PREFERRED — Waktu Prioritas (Soft Constraint SC_1)</option>
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
                  className="px-4 py-2 border rounded-lg text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1D8699] text-white rounded-lg font-bold cursor-pointer"
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
