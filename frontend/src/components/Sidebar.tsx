'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, BookOpen, DoorClosed, Clock, School, 
  Cpu, History, Calendar, LayoutGrid, CheckCircle2, ChevronRight
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navGroups = [
    {
      title: 'MESIN OPTIMASI (GA)',
      items: [
        { label: 'Konfigurasi & Run', href: '/generator', icon: Cpu },
        { label: 'Riwayat Generasi', href: '/history', icon: History },
      ],
    },
    {
      title: 'OUTPUT JADWAL',
      items: [
        { label: 'Tabel Jadwal', href: '/schedule', icon: Calendar },
        { label: 'Matriks Ruangan', href: '/schedule/matrix', icon: LayoutGrid },
      ],
    },
    {
      title: 'DATA MASTER',
      items: [
        { label: 'Dosen & Preferensi', href: '/master/lecturers', icon: Users },
        { label: 'Mata Kuliah & SKS', href: '/master/courses', icon: BookOpen },
        { label: 'Ruang & Kapasitas', href: '/master/rooms', icon: DoorClosed },
        { label: 'Rombel & Kuota', href: '/master/classes', icon: School },
        { label: 'Slot Waktu', href: '/master/time-slots', icon: Clock },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#1E293B] text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-700">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-700/80 bg-[#0F172A]/50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#1D8699] flex items-center justify-center font-bold text-white shadow-md shadow-[#1D8699]/30">
            AG
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide leading-tight">
              SIM-JADWAL GA
            </h1>
            <p className="text-[11px] text-cyan-400 font-medium">
              FSTIK — UBBG Banda Aceh
            </p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <h2 className="px-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              {group.title}
            </h2>
            <div className="space-y-0.5 pt-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#1D8699] text-white shadow-sm shadow-[#1D8699]/20'
                        : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Academic Year Badge */}
      <div className="p-3 border-t border-slate-700/80 bg-slate-900/60 m-2 rounded-xl">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Semester Aktif:</span>
          <span className="font-semibold text-emerald-400 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Ganjil 2026/2027</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
