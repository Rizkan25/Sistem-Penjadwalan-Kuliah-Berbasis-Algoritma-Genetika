'use client';

import React, { useState } from 'react';
import { ScheduleItem, Room, TimeSlot } from '@/lib/types';
import { Clock, Lock, ArrowLeftRight, User, BookOpen } from 'lucide-react';

const DAY_NAMES: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
};

// Distinct colors for each semester
const SEMESTER_COLORS: Record<number, { bg: string; text: string; border: string; badge: string }> = {
  1: { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-300', badge: 'bg-emerald-600 text-white' },
  3: { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-300', badge: 'bg-blue-600 text-white' },
  5: { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-300', badge: 'bg-amber-600 text-white' },
  7: { bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-300', badge: 'bg-purple-600 text-white' },
};

interface RoomMatrixGridProps {
  schedules: ScheduleItem[];
  rooms: Room[];
  timeSlots: TimeSlot[];
  onOpenSwapModal: (item: ScheduleItem) => void;
}

export default function RoomMatrixGrid({
  schedules,
  rooms,
  timeSlots,
  onOpenSwapModal,
}: RoomMatrixGridProps) {
  const [selectedDay, setSelectedDay] = useState<number>(1); // Default Senin

  // Filter time slots for selected day, sorted by period_order
  const daySlots = timeSlots
    .filter((ts) => ts.day_of_week === selectedDay)
    .sort((a, b) => a.period_order - b.period_order);

  // Group schedules by key: `${time_slot_id}_${room_id}`
  const scheduleLookup = new Map<string, ScheduleItem>();
  for (const s of schedules) {
    if (s.day_of_week === selectedDay) {
      scheduleLookup.set(`${s.time_slot_id}_${s.room_id}`, s);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 mb-6">
      {/* Day Selector Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 mb-6 border-b border-slate-200 gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Matriks Kalender Jadwal per Ruangan (Room-Time Grid)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualisasi alokasi ruangan laboratorium dan kelas teori per slot waktu
          </p>
        </div>

        {/* Day Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl shrink-0 self-start lg:self-auto">
          {[1, 2, 3, 4, 5, 6].map((dayNum) => (
            <button
              key={dayNum}
              type="button"
              onClick={() => setSelectedDay(dayNum)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDay === dayNum
                  ? 'bg-[#1D8699] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {DAY_NAMES[dayNum]}
            </button>
          ))}
        </div>
      </div>

      {/* Friday Notice if selectedDay is Friday */}
      {selectedDay === 5 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center space-x-2">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Aturan Khusus Hari Jumat (Banda Aceh):</strong> Rentang waktu 11:30 - 14:00 WIB dikunci untuk pelaksanaan ibadah Sholat Jumat (Zero Class Activity).
          </span>
        </div>
      )}

      {/* Timetable Matrix Grid */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-[#1E293B] text-white text-[11px] font-bold">
              <th className="py-3 px-3 w-32 border-r border-slate-700 text-center uppercase tracking-wider sticky left-0 z-10 bg-[#1E293B]">
                Waktu / Sesi
              </th>
              {rooms.map((room) => (
                <th key={room.id} className="py-3 px-2 border-r border-slate-700 text-center min-w-[140px]">
                  <div className="font-mono-metrics font-bold text-xs text-cyan-300">
                    {room.code}
                  </div>
                  <div className="text-[10px] text-slate-300 font-normal truncate max-w-[150px] mx-auto">
                    {room.name}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {room.room_type} ({room.capacity} krs)
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {daySlots.map((slot) => {
              const timeDisplay = `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`;

              return (
                <tr key={slot.id} className="hover:bg-slate-50/50">
                  {/* Y-axis: Time Slot */}
                  <td className="py-4 px-3 bg-slate-50 border-r border-slate-200 text-center align-middle sticky left-0 z-10">
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <span className="font-bold text-xs text-slate-800 font-mono-metrics">
                        Sesi {slot.period_order}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono-metrics flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-[#1D8699]" />
                        <span>{timeDisplay}</span>
                      </span>
                    </div>
                  </td>

                  {/* X-axis: Room Cells */}
                  {rooms.map((room) => {
                    const cellKey = `${slot.id}_${room.id}`;
                    const schedule = scheduleLookup.get(cellKey);

                    if (!schedule) {
                      return (
                        <td
                          key={room.id}
                          className="p-2 border-r border-slate-200 align-top text-center"
                        >
                          <div className="h-28 border border-dashed border-slate-200 rounded-lg p-2 flex flex-col items-center justify-center text-slate-400 text-[10px]">
                            <span className="font-medium">Tersedia</span>
                            <span className="text-[9px] text-slate-300">Kosong</span>
                          </div>
                        </td>
                      );
                    }

                    const theme = SEMESTER_COLORS[schedule.semester] || SEMESTER_COLORS[1];

                    return (
                      <td
                        key={room.id}
                        className="p-2 border-r border-slate-200 align-top"
                      >
                        <div
                          onClick={() => onOpenSwapModal(schedule)}
                          className={`h-28 rounded-lg p-2.5 border ${theme.border} ${theme.bg} shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-sm ${theme.badge}`}>
                                Sem {schedule.semester}
                              </span>
                              <span className="text-[9px] font-semibold text-slate-500 font-mono-metrics">
                                {schedule.class_name.split(' ')[0]}
                              </span>
                            </div>

                            <div className="text-[11px] font-bold text-slate-800 leading-tight line-clamp-2">
                              {schedule.course_name}
                            </div>
                          </div>

                          <div className="pt-1 border-t border-slate-200/50">
                            <div className="flex items-center space-x-1 text-[10px] text-slate-600 truncate">
                              <User className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                              <span className="truncate">{schedule.lecturer_name}</span>
                            </div>
                            <div className="flex items-center justify-between text-[9px] text-slate-400 mt-0.5">
                              <span>{schedule.student_count} mhs</span>
                              <span className="text-[#1D8699] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                Ubah ↗
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center flex-wrap gap-4 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
        <span className="font-bold text-slate-700">Keterangan Semester:</span>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
          <span>Semester 1</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-sm bg-blue-500"></span>
          <span>Semester 3</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-500"></span>
          <span>Semester 5</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-sm bg-purple-500"></span>
          <span>Semester 7</span>
        </div>
      </div>
    </div>
  );
}
