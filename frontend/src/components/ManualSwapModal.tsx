'use client';

import React, { useState } from 'react';
import { ArrowLeftRight, AlertTriangle, CheckCircle2, DoorClosed, Clock, RefreshCw } from 'lucide-react';
import { ScheduleItem, Room, TimeSlot } from '@/lib/types';
import { api } from '@/lib/api';

const DAY_NAMES: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
};

interface ManualSwapModalProps {
  schedule: ScheduleItem | null;
  rooms: Room[];
  timeSlots: TimeSlot[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManualSwapModal({
  schedule,
  rooms,
  timeSlots,
  onClose,
  onSuccess,
}: ManualSwapModalProps) {
  if (!schedule) return null;

  const [selectedRoomId, setSelectedRoomId] = useState<string>(schedule.room_id);
  const [selectedSlotId, setSelectedSlotId] = useState<string>(schedule.time_slot_id);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessages([]);
    setSuccessMessage(null);

    try {
      const res = await api.manualSwap(schedule.id, selectedRoomId, selectedSlotId);
      setSuccessMessage(res.message);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.conflicts && Array.isArray(parsed.conflicts)) {
          setErrorMessages(parsed.conflicts);
        } else {
          setErrorMessages([parsed.message || err.message]);
        }
      } catch {
        setErrorMessages([err.message]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-50 text-[#1D8699]">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Penyesuaian Jadwal Manual (Manual Swap)
              </h3>
              <p className="text-xs text-slate-500">
                Pindahkan sesi kelas ke slot waktu atau ruangan lain dengan verifikasi anti-bentrok
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-xs"
          >
            ✕
          </button>
        </div>

        {/* Current Class Info */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-4 space-y-1.5 text-xs">
          <div className="font-bold text-slate-800 flex items-center space-x-2">
            <span>{schedule.course_code} — {schedule.course_name}</span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-[#1D8699] text-[10px] font-bold">
              {schedule.class_name}
            </span>
          </div>
          <div className="text-slate-600 flex items-center justify-between">
            <span>Dosen: <strong className="text-slate-800">{schedule.lecturer_name}</strong></span>
            <span>Mahasiswa: <strong className="text-slate-800">{schedule.student_count} orang</strong></span>
          </div>
          <div className="text-slate-500 text-[11px]">
            Tipe: <span className="font-semibold text-purple-700">{schedule.course_type}</span> | KBK: <span className="font-semibold text-pink-700">{schedule.kbk}</span>
          </div>
        </div>

        {/* Conflict Error Alerts */}
        {errorMessages.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl mb-4 text-xs space-y-1.5 animate-in shake duration-200">
            <div className="flex items-center space-x-2 font-bold text-rose-700">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Bentrok Mutlak Terdeteksi (Hard Conflict):</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
              {errorMessages.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl mb-4 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSwap} className="space-y-4">
          {/* New Room Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
              <DoorClosed className="w-4 h-4 text-[#1D8699]" />
              <span>Pilih Ruangan Baru:</span>
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20 focus:border-[#1D8699]"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} - {r.name} ({r.room_type}, Kapasitas: {r.capacity} kursi)
                </option>
              ))}
            </select>
          </div>

          {/* New Time Slot Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-[#1D8699]" />
              <span>Pilih Slot Waktu Baru:</span>
            </label>
            <select
              value={selectedSlotId}
              onChange={(e) => setSelectedSlotId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20 focus:border-[#1D8699]"
            >
              {timeSlots.map((ts) => (
                <option key={ts.id} value={ts.id}>
                  {DAY_NAMES[ts.day_of_week] || `Hari ${ts.day_of_week}`}, Sesi {ts.period_order} ({ts.start_time.slice(0, 5)} - {ts.end_time.slice(0, 5)} WIB)
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-[#1D8699] hover:bg-[#166978] text-white text-xs font-bold shadow-sm shadow-[#1D8699]/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Validasi Konflik...</span>
                </>
              ) : (
                <span>Simpan Perubahan Jadwal</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
