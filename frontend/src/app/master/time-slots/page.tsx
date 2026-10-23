'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Lock, RefreshCw } from 'lucide-react';
import { TimeSlot } from '@/lib/types';
import { api } from '@/lib/api';

const DAY_NAMES: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
};

export default function TimeSlotsPage() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [periodOrder, setPeriodOrder] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('10:00');

  const loadSlots = async () => {
    setLoading(true);
    try {
      const data = await api.getTimeSlots();
      setTimeSlots(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dayOfWeek === 5) {
      // Check Friday rule
      if (startTime >= '11:30' && startTime < '14:00') {
        alert('Slot waktu pada hari Jumat pukul 11:30 - 14:00 WIB dilarang karena waktu ibadah Sholat Jumat.');
        return;
      }
    }
    try {
      await api.createTimeSlot({
        day_of_week: dayOfWeek,
        period_order: periodOrder,
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
      });
      setShowAddModal(false);
      loadSlots();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Hapus slot waktu ini?')) return;
    try {
      await api.deleteTimeSlot(id);
      loadSlots();
    } catch (err: any) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-[#1D8699]" />
            <span>Data Master Slot Waktu Pembelajaran</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Definisi jam perkuliahan mingguan (Jam 1 s.d 9, Senin–Sabtu) dengan aturan kunci ibadah Sholat Jumat (12:00–14:00 WIB).
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#1D8699] hover:bg-[#166978] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span>Tambah Slot Waktu</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-[#1D8699] mx-auto mb-2" />
          <p className="text-xs font-semibold">Memuat slot waktu...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((dayNum) => {
            const slotsForDay = timeSlots
              .filter((ts) => ts.day_of_week === dayNum)
              .sort((a, b) => a.period_order - b.period_order);

            const isFriday = dayNum === 5;

            return (
              <div
                key={dayNum}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col"
              >
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-xs flex items-center justify-between">
                  <span>{DAY_NAMES[dayNum]}</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                    {slotsForDay.length} Jam Perkuliahan
                  </span>
                </div>

                <div className="p-3.5 space-y-2 flex-1">
                  {slotsForDay.map((slot) => {
                    const timeRange = `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)} WIB`;
                    return (
                      <div
                        key={slot.id}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800">
                            Jam ke-{slot.period_order}
                          </div>
                          <div className="font-mono-metrics text-slate-600 text-[11px]">
                            {timeRange}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Friday Lock Visual Indicator */}
                  {isFriday && (
                    <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-[11px] flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <strong>12:00 - 14:00 WIB Dikunci:</strong>
                        <div className="text-[10px] text-amber-700">Ibadah Sholat Jumat (Zero Class)</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Slot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Tambah Slot Waktu Baru</h3>
            <form onSubmit={handleCreateSlot} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Hari:</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map((d) => (
                    <option key={d} value={d}>{DAY_NAMES[d]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Urutan Sesi Harian (Period Order):</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  required
                  value={periodOrder}
                  onChange={(e) => setPeriodOrder(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jam Mulai (HH:MM):</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jam Selesai (HH:MM):</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  />
                </div>
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
                  Simpan Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
