'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, BookOpen, DoorClosed, Clock, School, 
  Cpu, History, Calendar, LayoutGrid, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar, setCollapsed } = useSidebar();

  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setCollapsed(true);
    }
  };

  const navGroups = [
    {
      title: 'NAVIGASI UTAMA',
      items: [
        { label: 'Dashboard', href: '/', icon: LayoutDashboard },
      ],
    },
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
    <>
      {/* Mobile Backdrop when Sidebar is Open */}
      {!isCollapsed && (
        <div 
          onClick={() => setCollapsed(true)} 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-30 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside 
        className={`
          ${isCollapsed ? 'w-0 -translate-x-full md:translate-x-0 md:w-[72px] overflow-hidden md:overflow-visible' : 'w-64 translate-x-0 shadow-2xl md:shadow-none'} 
          fixed md:relative inset-y-0 left-0 z-40 md:z-20
          bg-[#1E293B] text-slate-300 flex flex-col shrink-0 h-full border-r border-slate-700 
          transition-all duration-300 ease-in-out select-none
        `}
      >
        {/* Brand Header */}
        <div className={`border-b border-slate-700/80 bg-[#0F172A]/60 ${isCollapsed ? 'p-3.5 flex justify-center' : 'p-4'}`}>
          <Link 
            href="/"
            onClick={handleNavClick}
            className={`flex items-center space-x-3 group ${isCollapsed ? 'justify-center' : ''}`}
            title="Kembali ke Dashboard Utama"
          >
            <div 
              className="w-9 h-9 rounded-lg bg-[#1D8699] group-hover:bg-[#166d7d] flex items-center justify-center font-bold text-white shadow-md shadow-[#1D8699]/30 shrink-0 transition"
            >
              AG
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden transition-all duration-300">
                <h1 className="text-sm font-bold text-white tracking-wide leading-tight whitespace-nowrap group-hover:text-cyan-400 transition">
                  SIM-JADWAL GA
                </h1>
                <p className="text-[11px] text-cyan-400 font-medium whitespace-nowrap">
                  FSTIK — UBBG Banda Aceh
                </p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation List */}
        <nav className={`flex-1 overflow-y-auto ${isCollapsed ? 'p-2 space-y-3' : 'p-3 space-y-5'}`}>
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {/* Group Header or Divider */}
              {isCollapsed ? (
                gIdx > 0 && <div className="border-t border-slate-700/50 my-2 mx-1" />
              ) : (
                <h2 className="px-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase whitespace-nowrap">
                  {group.title}
                </h2>
              )}

              <div className="space-y-1 pt-0.5">
                {group.items.map((item) => {
                  const isActive = item.href === '/' ? pathname === '/' : (pathname === item.href || pathname.startsWith(item.href + '/'));
                  const Icon = item.icon;

                  if (isCollapsed) {
                    return (
                      <div key={item.href} className="relative group flex justify-center">
                        <Link
                          href={item.href}
                          onClick={handleNavClick}
                          className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${
                            isActive
                              ? 'bg-[#1D8699] text-white shadow-md shadow-[#1D8699]/30 font-bold scale-105'
                              : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                        </Link>

                        {/* Tooltip on Hover */}
                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 flex items-center space-x-1.5">
                          <span>{item.label}</span>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#1D8699] text-white shadow-sm shadow-[#1D8699]/20 font-semibold'
                          : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70 shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Academic Year Badge */}
        <div className={`border-t border-slate-700/80 bg-slate-900/60 ${isCollapsed ? 'p-2 flex justify-center m-1 rounded-xl' : 'p-3 m-2 rounded-xl'}`}>
          {isCollapsed ? (
            <div 
              className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center cursor-pointer group relative"
              title="Semester Aktif: Ganjil 2026/2027"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {/* Tooltip on Hover */}
              <div className="absolute left-full ml-3 bottom-0 px-2.5 py-1.5 bg-slate-900 text-white text-[11px] font-semibold rounded-lg shadow-xl border border-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
                <span className="text-emerald-400 font-bold block">Semester Aktif:</span>
                <span>Ganjil 2026/2027</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Semester Aktif:</span>
              <span className="font-semibold text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Ganjil 2026/2027</span>
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
