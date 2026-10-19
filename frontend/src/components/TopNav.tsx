'use client';

import React from 'react';
import { Calendar, Sparkles, Building2 } from 'lucide-react';

interface TopNavProps {
  title?: string;
  subtitle?: string;
}

export default function TopNav({ 
  title = "Sistem Penjadwalan Kuliah Berbasis Algoritma Genetika", 
  subtitle = "Prodi Ilmu Komputer — Universitas Bina Bangsa Getsempena" 
}: TopNavProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs shrink-0">
      <div className="flex items-center space-x-3">
        <div>
          <h1 className="text-base font-bold text-slate-800 leading-tight">
            {title}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Semester selector pill */}
        <div className="flex items-center space-x-2 bg-slate-100/90 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5 text-[#1D8699]" />
          <span>T.A. 2026/2027 (Ganjil)</span>
        </div>

        {/* University Pill */}
        <div className="hidden md:flex items-center space-x-2 bg-cyan-50 text-[#1D8699] px-3 py-1.5 rounded-lg border border-cyan-200 text-xs font-semibold">
          <Building2 className="w-3.5 h-3.5" />
          <span>UBBG Banda Aceh</span>
        </div>

        {/* Engine Status Indicator */}
        <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-lg border border-emerald-200 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>GA Engine Ready</span>
        </div>
      </div>
    </header>
  );
}
