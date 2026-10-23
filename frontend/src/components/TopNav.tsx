'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Building2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';

interface TopNavProps {
  title?: string;
  subtitle?: string;
}

export default function TopNav({ 
  title = "Sistem Penjadwalan Kuliah Berbasis Algoritma Genetika", 
  subtitle = "Prodi Ilmu Komputer — Universitas Bina Bangsa Getsempena" 
}: TopNavProps) {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between shadow-xs shrink-0 z-20 relative select-none w-full">
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 mr-2">
        {/* Toggle Sidebar Button */}
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition border border-slate-200/60 shadow-2xs shrink-0"
          title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar (Perluas Tampilan)"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-5 h-5 text-[#1D8699]" />
          ) : (
            <PanelLeftClose className="w-5 h-5 text-slate-600" />
          )}
        </button>

        {/* App Title & Subtitle with responsive truncation */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <Link href="/" className="group block" title="Menuju Dashboard">
            <h1 className="text-xs sm:text-sm md:text-base font-bold text-slate-800 leading-tight truncate group-hover:text-[#1D8699] transition">
              <span className="lg:hidden">SIM-JADWAL GA</span>
              <span className="hidden lg:inline xl:hidden">Sistem Penjadwalan Kuliah GA</span>
              <span className="hidden xl:inline">{title}</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate hidden lg:block">
              {subtitle}
            </p>
          </Link>
        </div>
      </div>

      {/* Right-hand badges */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
        {/* Semester selector pill */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 bg-slate-100/90 text-slate-700 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] sm:text-xs font-semibold shrink-0">
          <Calendar className="w-3.5 h-3.5 text-[#1D8699] shrink-0" />
          <span className="hidden lg:inline">T.A. 2026/2027 (Ganjil)</span>
          <span className="lg:hidden">26/27 Ganjil</span>
        </div>

        {/* University Pill */}
        <div className="hidden xl:flex items-center space-x-1.5 bg-cyan-50 text-[#1D8699] px-2.5 py-1.5 rounded-lg border border-cyan-200 text-xs font-semibold shrink-0">
          <Building2 className="w-3.5 h-3.5 shrink-0" />
          <span>UBBG Banda Aceh</span>
        </div>

        {/* Engine Status Indicator */}
        <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 px-2 sm:px-2.5 py-1.5 rounded-lg border border-emerald-200 text-[11px] sm:text-xs font-semibold shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <span className="hidden sm:inline">GA Ready</span>
          <span className="sm:hidden">Ready</span>
        </div>
      </div>
    </header>
  );
}
