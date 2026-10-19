'use client';

import React from 'react';
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
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-xs shrink-0 sticky top-0 z-10">
      <div className="flex items-center space-x-3">
        {/* Toggle Sidebar Button */}
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition border border-slate-200/60 shadow-2xs"
          title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar (Perluas Tampilan)"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-5 h-5 text-[#1D8699]" />
          ) : (
            <PanelLeftClose className="w-5 h-5 text-slate-600" />
          )}
        </button>

        <div>
          <h1 className="text-sm sm:text-base font-bold text-slate-800 leading-tight">
            {title}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Semester selector pill */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 bg-slate-100/90 text-slate-700 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5 text-[#1D8699]" />
          <span className="hidden sm:inline">T.A. 2026/2027 (Ganjil)</span>
          <span className="sm:hidden">2026/2027</span>
        </div>

        {/* University Pill */}
        <div className="hidden lg:flex items-center space-x-2 bg-cyan-50 text-[#1D8699] px-3 py-1.5 rounded-lg border border-cyan-200 text-xs font-semibold">
          <Building2 className="w-3.5 h-3.5" />
          <span>UBBG Banda Aceh</span>
        </div>

        {/* Engine Status Indicator */}
        <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 px-2 sm:px-2.5 py-1.5 rounded-lg border border-emerald-200 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="hidden sm:inline">GA Engine Ready</span>
          <span className="sm:hidden">Ready</span>
        </div>
      </div>
    </header>
  );
}
