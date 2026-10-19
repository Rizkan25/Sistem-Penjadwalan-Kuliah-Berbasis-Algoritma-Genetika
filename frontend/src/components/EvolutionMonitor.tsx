'use client';

import React from 'react';
import { Activity, CheckCircle2, AlertOctagon, Clock, Gauge, Award } from 'lucide-react';
import { ScheduleJob } from '@/lib/types';

interface EvolutionMonitorProps {
  job: (ScheduleJob & { estimated_remaining_seconds?: number }) | null;
  history?: Array<{ generation: number; fitness: number }>;
}

export default function EvolutionMonitor({ job, history = [] }: EvolutionMonitorProps) {
  if (!job) return null;

  const isCompleted = job.status === 'COMPLETED';
  const isRunning = job.status === 'RUNNING';
  const isFailed = job.status === 'FAILED';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className={`p-2 rounded-lg ${
            isCompleted 
              ? 'bg-emerald-50 text-emerald-600' 
              : isRunning 
              ? 'bg-cyan-50 text-[#1D8699]' 
              : 'bg-rose-50 text-rose-600'
          }`}>
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <span>Live Evolution Monitor</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isCompleted 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : isRunning 
                  ? 'bg-cyan-100 text-cyan-800 animate-pulse' 
                  : isFailed
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {job.status}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              {isRunning 
                ? 'Mengevaluasi mutasi kromosom dan kalkulasi batasan penalti...' 
                : isCompleted 
                ? 'Evolusi konvergen! Seluruh batasan keras mutlak (HC) terpenuhi dengan sukses.'
                : isFailed
                ? `Terjadi kesalahan: ${job.error_message || 'Optimasi dihentikan.'}`
                : 'Menunggu antrean komputasi...'}
            </p>
          </div>
        </div>

        {/* Badges for Conflicts */}
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${
            job.hard_conflicts_count === 0 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            {job.hard_conflicts_count === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertOctagon className="w-4 h-4 text-rose-600" />
            )}
            <span>{job.hard_conflicts_count} Hard Conflicts</span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border bg-amber-50 border-amber-200 text-amber-700 text-xs font-bold">
            <span>{job.soft_conflicts_count} Soft Conflicts</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
          <span>Progres Evolusi Algoritma</span>
          <span className="font-mono-metrics text-slate-800 font-bold">{job.progress_percentage}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isCompleted
                ? 'bg-emerald-500'
                : isFailed
                ? 'bg-rose-500'
                : 'bg-[#1D8699]'
            }`}
            style={{ width: `${job.progress_percentage}%` }}
          />
        </div>
      </div>

      {/* Key Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Generasi Saat Ini */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Generasi</div>
            <div className="text-sm font-bold font-mono-metrics text-slate-800">
              {job.current_generation} <span className="text-xs text-slate-400 font-normal">/ {job.max_generations}</span>
            </div>
          </div>
        </div>

        {/* Best Fitness */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Best Fitness Score</div>
            <div className="text-sm font-bold font-mono-metrics text-emerald-700">
              {job.best_fitness > 0 ? job.best_fitness.toFixed(5) : '0.00000'}
            </div>
          </div>
        </div>

        {/* Waktu Komputasi */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-purple-100 text-purple-700">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Waktu Komputasi</div>
            <div className="text-sm font-bold font-mono-metrics text-slate-800">
              {job.execution_time_seconds 
                ? `${job.execution_time_seconds.toFixed(1)}s` 
                : isRunning && job.estimated_remaining_seconds
                ? `Sisa ~${Math.ceil(job.estimated_remaining_seconds)}s`
                : '-'}
            </div>
          </div>
        </div>

        {/* Status Publikasi */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center space-x-3">
          <div className={`p-2.5 rounded-lg ${job.is_published ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Status Jadwal</div>
            <div className="text-xs font-bold text-slate-800">
              {job.is_published ? (
                <span className="text-amber-600 font-bold">Resmi Dipublikasikan</span>
              ) : (
                <span className="text-slate-500">Draft / Belum Rilis</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
