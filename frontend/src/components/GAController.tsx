'use client';

import React, { useState } from 'react';
import { Play, ShieldAlert, CheckCircle2, AlertTriangle, Settings2, RefreshCw } from 'lucide-react';
import { GAParameters, PreCheckResult } from '@/lib/types';
import { api } from '@/lib/api';

interface GAControllerProps {
  onStartGeneration: (params: GAParameters) => void;
  isRunning: boolean;
}

export default function GAController({ onStartGeneration, isRunning }: GAControllerProps) {
  const [params, setParams] = useState<GAParameters>({
    population_size: 100,
    max_generations: 500,
    crossover_rate: 0.85,
    mutation_rate: 0.08,
    elitism_count: 2,
  });

  const [preCheckLoading, setPreCheckLoading] = useState(false);
  const [preCheckResult, setPreCheckResult] = useState<PreCheckResult | null>(null);
  const [showPreCheckModal, setShowPreCheckModal] = useState(false);

  const handleRunPreCheck = async () => {
    setPreCheckLoading(true);
    setPreCheckResult(null);
    try {
      const res = await api.preCheck('2026/2027', 'ODD');
      setPreCheckResult(res);
      setShowPreCheckModal(true);
    } catch (err: any) {
      alert(`Pengecekan gagal: ${err.message}`);
    } finally {
      setPreCheckLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartGeneration(params);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-50 text-[#1D8699] shrink-0">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Panel Kontrol Algoritma Genetika (GA Engine)
            </h2>
            <p className="text-xs text-slate-500">
              Atur parameter evolusi kromosom untuk menghasilkan jadwal kuliah tanpa bentrok (Zero Conflicts)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleRunPreCheck}
            disabled={isRunning || preCheckLoading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {preCheckLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>Cek Kelayakan Data</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-6">
          {/* Populasi */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Ukuran Populasi (N)
            </label>
            <input
              type="number"
              min={20}
              max={300}
              value={params.population_size}
              onChange={(e) => setParams({ ...params, population_size: parseInt(e.target.value) || 50 })}
              disabled={isRunning}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono-metrics bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20 focus:border-[#1D8699]"
            />
            <p className="text-[10px] text-slate-400">Rekomendasi: 50 – 150</p>
          </div>

          {/* Crossover Rate */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Crossover Rate (Pc)
            </label>
            <input
              type="number"
              step="0.01"
              min={0.1}
              max={1.0}
              value={params.crossover_rate}
              onChange={(e) => setParams({ ...params, crossover_rate: parseFloat(e.target.value) || 0.85 })}
              disabled={isRunning}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono-metrics bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20 focus:border-[#1D8699]"
            />
            <p className="text-[10px] text-slate-400">Standar: 0.85 (Uniform)</p>
          </div>

          {/* Mutation Rate */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Mutation Rate (Pm)
            </label>
            <input
              type="number"
              step="0.01"
              min={0.01}
              max={0.5}
              value={params.mutation_rate}
              onChange={(e) => setParams({ ...params, mutation_rate: parseFloat(e.target.value) || 0.08 })}
              disabled={isRunning}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono-metrics bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20 focus:border-[#1D8699]"
            />
            <p className="text-[10px] text-slate-400">Base: 0.08 (Adaptive 0.25)</p>
          </div>

          {/* Max Generation */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Maksimum Generasi
            </label>
            <input
              type="number"
              min={20}
              max={2000}
              value={params.max_generations}
              onChange={(e) => setParams({ ...params, max_generations: parseInt(e.target.value) || 500 })}
              disabled={isRunning}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono-metrics bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20 focus:border-[#1D8699]"
            />
            <p className="text-[10px] text-slate-400">Default: 500 iterasi</p>
          </div>

          {/* Elitism */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Elitism Count
            </label>
            <input
              type="number"
              min={1}
              max={5}
              value={params.elitism_count}
              onChange={(e) => setParams({ ...params, elitism_count: parseInt(e.target.value) || 2 })}
              disabled={isRunning}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono-metrics bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20 focus:border-[#1D8699]"
            />
            <p className="text-[10px] text-slate-400">Amankan 2 individu terbaik</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={isRunning}
            className="flex items-center justify-center space-x-2 px-6 py-2.5 rounded-lg bg-[#1D8699] hover:bg-[#166978] text-white text-xs font-bold shadow-md shadow-[#1D8699]/25 transition-all disabled:opacity-50 cursor-pointer w-full sm:w-auto"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Optimasi Sedang Berlangsung...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Jalankan Algoritma Genetika (Generate)</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Pre-check Modal */}
      {showPreCheckModal && preCheckResult && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                {preCheckResult.is_feasible ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                )}
                <h3 className="text-sm font-bold text-slate-800">
                  Hasil Validasi Kelayakan Data Master
                </h3>
              </div>
              <button 
                onClick={() => setShowPreCheckModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className={`p-3 rounded-xl border ${
                preCheckResult.is_feasible 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <p className="font-semibold">{preCheckResult.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>Total Kelas: <span className="font-bold">{preCheckResult.total_classes}</span></div>
                <div>Kelas Teori: <span className="font-bold">{preCheckResult.total_theory_classes}</span></div>
                <div>Kelas Praktikum (Lab): <span className="font-bold">{preCheckResult.total_lab_classes}</span></div>
                <div>Total Ruangan: <span className="font-bold">{preCheckResult.total_rooms}</span></div>
                <div>Slot Waktu Mingguan: <span className="font-bold">{preCheckResult.total_time_slots}</span></div>
              </div>

              {preCheckResult.capacity_issues.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800">
                  <h4 className="font-bold mb-1">Isu Kapasitas Ruangan:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {preCheckResult.capacity_issues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreCheckModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
