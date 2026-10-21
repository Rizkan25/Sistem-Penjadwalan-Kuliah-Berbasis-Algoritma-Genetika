'use client';

import React from 'react';
import { ScheduleItem } from '@/lib/types';
import { CheckCircle2, AlertTriangle, ArrowLeftRight, User } from 'lucide-react';

const DAY_NAMES: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
};

interface ScheduleTableProps {
  schedules: ScheduleItem[];
  onOpenSwapModal: (item: ScheduleItem) => void;
}

export default function ScheduleTable({ schedules, onOpenSwapModal }: ScheduleTableProps) {
  if (schedules.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
        <p className="text-sm font-medium">Tidak ada data jadwal yang sesuai dengan filter.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1D8699] text-white text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3 px-4 border-b border-cyan-800">Waktu (Hari & Sesi)</th>
              <th className="py-3 px-4 border-b border-cyan-800">Ruang & Kapasitas</th>
              <th className="py-3 px-4 border-b border-cyan-800">Mata Kuliah & Rombel</th>
              <th className="py-3 px-4 border-b border-cyan-800">Dosen Pengampu</th>
              <th className="py-3 px-4 border-b border-cyan-800 text-center">Status & Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
            {schedules.map((item, idx) => {
              const dayStr = DAY_NAMES[item.day_of_week] || `Hari ${item.day_of_week}`;
              const timeStr = `${item.start_time.slice(0, 5)} - ${item.end_time.slice(0, 5)}`;
              const isLab = item.course_type === 'LABORATORY';

              return (
                <tr 
                  key={item.id} 
                  className={`hover:bg-cyan-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                >
                  {/* Kolom 1 — Waktu */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex flex-col space-y-1">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-800 text-white font-bold text-[10px] w-fit">
                        {dayStr}
                      </span>
                      <span className="font-mono-metrics font-bold text-slate-800 text-xs">
                        {timeStr} WIB
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Sesi ke-{item.period_order}
                      </span>
                    </div>
                  </td>

                  {/* Kolom 2 — Ruang & Kapasitas */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono-metrics font-bold text-[#1D8699] text-xs">
                          {item.room_code}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isLab 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {item.room_type}
                        </span>
                      </div>
                      <span className="text-slate-600 font-medium text-xs">
                        {item.room_name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Kapasitas: <strong>{item.student_count}</strong> / {item.room_capacity} kursi
                      </span>
                    </div>
                  </td>

                  {/* Kolom 3 — Mata Kuliah & Rombel */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex flex-col space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono-metrics font-semibold text-slate-500 text-[11px]">
                          {item.course_code}
                        </span>
                        <span className="font-bold text-slate-800 text-xs">
                          {item.course_name}
                        </span>
                      </div>
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-cyan-100 text-[#1D8699] font-bold text-[10px]">
                          {item.class_name}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-semibold text-[10px]">
                          {item.credits} SKS
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-semibold text-[10px]">
                          Sem {item.semester}
                        </span>
                        {item.kbk !== 'GENERAL' && (
                          <span className="px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 border border-pink-200 font-bold text-[10px]">
                            KBK: {item.kbk}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Kolom 4 — Dosen Pengampu */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex items-start space-x-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-xs">
                          {item.lecturer_name}
                        </span>
                        <span className="font-mono-metrics text-[10px] text-slate-400">
                          {item.lecturer_nidn && item.lecturer_nidn !== '-' ? `NIDN: ${item.lecturer_nidn}` : 'Dosen Tamu / Pengampu'}
                        </span>
                        {item.is_preferred_slot ? (
                          <span className="text-[10px] text-emerald-600 font-medium mt-0.5">
                            ✓ Sesuai Preferensi Waktu
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-medium mt-0.5">
                            ⚠ Di luar preferensi waktu
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Kolom 5 — Status & Aksi */}
                  <td className="py-3.5 px-4 align-top text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Optimal (0 Bentrok)</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => onOpenSwapModal(item)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                      >
                        <ArrowLeftRight className="w-3 h-3 text-[#1D8699]" />
                        <span>Tukar Slot</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
