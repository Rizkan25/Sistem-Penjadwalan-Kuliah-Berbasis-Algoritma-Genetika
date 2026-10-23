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
          ${isCollapsed ? 'w-0 -translate-x-full md:translate-x-0 md:w-[72px]' : 'w-64 translate-x-0 shadow-2xl md:shadow-none'} 
          fixed md:relative inset-y-0 left-0 z-40 md:z-20
          bg-[#2F4050] text-slate-300 flex flex-col shrink-0 h-full border-r border-[#3b4f63] overflow-x-hidden
          transition-all duration-300 ease-in-out select-none
        `}
      >
        {/* Brand Header with UBBG Motif */}
        <div className="relative overflow-hidden border-b border-[#3b4f63] bg-[#243340]/90 h-16 flex items-center px-4 shrink-0">
          <Link 
            href="/"
            onClick={handleNavClick}
            className="flex items-center space-x-3 group relative z-10 w-full"
            title="Kembali ke Dashboard Utama"
          >
            {/* Official UBBG Logo Emblem */}
            <div 
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E5F8A] via-[#1D8699] to-[#0E4D6E] p-1.5 flex items-center justify-center ring-1 ring-cyan-400/40 shadow-md shadow-cyan-950/50 shrink-0 group-hover:ring-cyan-300 group-hover:scale-105 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent)] pointer-events-none" />
              <img 
                src="/ubbg-logo.png" 
                alt="Logo UBBG" 
                className="w-7 h-7 object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] shrink-0"
              />
            </div>

            <div className={`overflow-hidden transition-all duration-300 min-w-0 ${isCollapsed ? 'w-0 opacity-0 -translate-x-2' : 'w-auto opacity-100 translate-x-0'}`}>
              <h1 className="text-sm font-bold text-white tracking-wide leading-tight whitespace-nowrap group-hover:text-cyan-200 transition">
                Penjadwalan Kuliah
              </h1>
            </div>
          </Link>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-3 py-4 space-y-4">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {/* Group Header or Divider */}
              <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-0 opacity-0 my-0' : 'h-4 opacity-100 mb-1'}`}>
                <h2 className="px-2 text-[10px] font-bold tracking-wider text-slate-300/80 uppercase whitespace-nowrap">
                  {group.title}
                </h2>
              </div>
              {isCollapsed && gIdx > 0 && <div className="border-t border-[#3b4f63]/80 my-2 mx-1" />}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      title={item.label}
                      className={`flex items-center rounded-xl transition-all duration-200 cursor-pointer h-10 px-2.5 group ${
                        isActive
                          ? 'bg-[#1D8699] text-white shadow-md shadow-[#1D8699]/30 font-semibold'
                          : 'text-slate-200 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`} />
                      </div>
                      <div className={`overflow-hidden whitespace-nowrap transition-all duration-300 ml-3 flex-1 flex items-center justify-between ${
                        isCollapsed ? 'w-0 opacity-0 -translate-x-2 pointer-events-none' : 'w-auto opacity-100 translate-x-0'
                      }`}>
                        <span className="truncate text-xs font-medium">{item.label}</span>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70 shrink-0 ml-1" />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Academic Year Badge */}
        <div className="border-t border-[#3b4f63] bg-[#243340]/80 p-2.5 m-2 rounded-xl shrink-0 overflow-hidden">
          <div className="flex items-center space-x-2.5">
            <div 
              className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 cursor-pointer group relative"
              title="Semester Aktif: Ganjil 2026/2027"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {isCollapsed && (
                <div className="absolute left-full ml-3 bottom-0 px-2.5 py-1.5 bg-slate-900 text-white text-[11px] font-semibold rounded-lg shadow-xl border border-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
                  <span className="text-emerald-400 font-bold block">Semester Aktif:</span>
                  <span>Ganjil 2026/2027</span>
                </div>
              )}
            </div>
            <div className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0 -translate-x-2' : 'w-auto opacity-100 translate-x-0'}`}>
              <span className="text-[10px] text-slate-300 block leading-tight">Semester Aktif:</span>
              <span className="text-xs font-bold text-emerald-400 leading-tight">Ganjil 2026/2027</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
