'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Plus, Trash2, RefreshCw, Search, Filter, AlertCircle, Sparkles } from 'lucide-react';
import { Course } from '@/lib/types';
import { api } from '@/lib/api';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSemester, setFilterSemester] = useState<number | 'ALL'>('ALL');
  const [filterKBK, setFilterKBK] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCredits, setNewCredits] = useState<number>(3);
  const [newSemester, setNewSemester] = useState<number>(1);
  const [newType, setNewType] = useState<'THEORY' | 'LABORATORY'>('THEORY');
  const [newKBK, setNewKBK] = useState<'GENERAL' | 'PEMROGRAMAN' | 'MULTIMEDIA' | 'IOT'>('GENERAL');
  const [newJenisMK, setNewJenisMK] = useState<string>('Wajib');
  const [newPrerequisites, setNewPrerequisites] = useState<string>('');

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await api.getCourses();
      setCourses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCourse({
        code: newCode.trim().toUpperCase(),
        name: newName.trim(),
        credits: newCredits,
        semester: newSemester,
        course_type: newType,
        kbk: newKBK,
        jenis_mk: newJenisMK,
        prerequisites: newPrerequisites.trim() || null,
      });
      setShowAddModal(false);
      setNewCode('');
      setNewName('');
      setNewPrerequisites('');
      loadCourses();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Hapus mata kuliah ini? Pastikan tidak sedang digunakan oleh kelas aktif.')) return;
    try {
      await api.deleteCourse(id);
      loadCourses();
    } catch (err: any) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      // Semester filter
      if (filterSemester !== 'ALL' && c.semester !== filterSemester) return false;
      // KBK filter
      if (filterKBK !== 'ALL' && c.kbk !== filterKBK) return false;
      // Type filter
      if (filterType !== 'ALL' && c.course_type !== filterType) return false;
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCode = c.code.toLowerCase().includes(query);
        const matchesName = c.name.toLowerCase().includes(query);
        const matchesPrereq = c.prerequisites ? c.prerequisites.toLowerCase().includes(query) : false;
        if (!matchesCode && !matchesName && !matchesPrereq) return false;
      }
      return true;
    });
  }, [courses, filterSemester, filterKBK, filterType, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const totalSks = courses.reduce((acc, c) => acc + (c.credits || 0), 0);
    const labCount = courses.filter((c) => c.course_type === 'LABORATORY').length;
    const theoryCount = courses.filter((c) => c.course_type === 'THEORY').length;
    const wajibCount = courses.filter((c) => (c.jenis_mk || 'Wajib').toLowerCase().includes('wajib')).length;
    return { totalSks, labCount, theoryCount, wajibCount, total: courses.length };
  }, [courses]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-[#1D8699]" />
            <span>Data Master Kurikulum Mata Kuliah</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar lengkap kurikulum resmi Prodi S1 Ilmu Komputer UBBG (Semester 1–8) terintegrasi OpenSIMKA.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#1D8699] hover:bg-[#166978] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Tambah Mata Kuliah</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Mata Kuliah</div>
            <div className="text-lg sm:text-xl font-extrabold text-slate-800 mt-0.5 whitespace-nowrap">{stats.total} MK</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#1D8699]/10 text-[#1D8699] flex items-center justify-center font-bold text-xs shrink-0">
            {stats.total}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Beban SKS</div>
            <div className="text-lg sm:text-xl font-extrabold text-slate-800 mt-0.5 whitespace-nowrap">{stats.totalSks} SKS</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
            SKS
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Teori / Praktikum</div>
            <div className="text-xs sm:text-sm font-bold text-slate-800 mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className="text-purple-700 whitespace-nowrap">{stats.theoryCount} Teori</span>
              <span className="text-slate-400">/</span>
              <span className="text-blue-700 whitespace-nowrap">{stats.labCount} Praktikum</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
            LAB
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Wajib / Pilihan</div>
            <div className="text-xs sm:text-sm font-bold text-slate-800 mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className="text-slate-800 whitespace-nowrap">{stats.wajibCount} Wajib</span>
              <span className="text-slate-400">/</span>
              <span className="text-emerald-700 whitespace-nowrap">{stats.total - stats.wajibCount} Pilihan</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
            MK
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode atau nama MK..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20 focus:border-[#1D8699]"
            />
          </div>

          {/* Semester Filter */}
          <div className="flex items-center space-x-1.5">
            <label className="text-xs font-semibold text-slate-600 hidden sm:inline">Semester:</label>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1D8699]"
            >
              <option value="ALL">Semua Semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          {/* KBK Filter */}
          <div className="flex items-center space-x-1.5">
            <label className="text-xs font-semibold text-slate-600 hidden sm:inline">KBK:</label>
            <select
              value={filterKBK}
              onChange={(e) => setFilterKBK(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1D8699]"
            >
              <option value="ALL">Semua KBK</option>
              <option value="GENERAL">GENERAL (Umum)</option>
              <option value="PEMROGRAMAN">PEMROGRAMAN</option>
              <option value="MULTIMEDIA">MULTIMEDIA</option>
              <option value="IOT">IOT</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center space-x-1.5">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1D8699]"
            >
              <option value="ALL">Semua Tipe Ruang</option>
              <option value="THEORY">Teori</option>
              <option value="LABORATORY">Praktikum Lab</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-bold text-slate-500 whitespace-nowrap shrink-0">
          Menampilkan <span className="text-[#1D8699] font-extrabold">{filteredCourses.length}</span> dari {courses.length} MK
        </div>
      </div>

      {/* Course List Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-[#1D8699] mx-auto mb-2" />
          <p className="text-xs font-semibold">Memuat data kurikulum mata kuliah...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase border-b border-slate-200 tracking-wider">
                  <th className="py-3 px-4">Kode MK</th>
                  <th className="py-3 px-4">Nama Mata Kuliah & Prasyarat</th>
                  <th className="py-3 px-3 text-center">SKS</th>
                  <th className="py-3 px-3 text-center">Semester</th>
                  <th className="py-3 px-3 text-center">Sifat</th>
                  <th className="py-3 px-3 text-center">Tipe Ruang</th>
                  <th className="py-3 px-4">Peminatan (KBK)</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tidak ada mata kuliah yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((c) => {
                    const isLab = c.course_type === 'LABORATORY';
                    const isWajib = (c.jenis_mk || 'Wajib').toLowerCase().includes('wajib');
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono-metrics font-bold text-[#1D8699] whitespace-nowrap">
                          {c.code}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 text-[13px]">{c.name}</div>
                          {c.prerequisites && (
                            <div className="text-[11px] text-amber-700 font-medium mt-0.5 flex items-center space-x-1">
                              <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-semibold">
                                Prasyarat:
                              </span>
                              <span>{c.prerequisites}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono-metrics font-bold text-slate-800 whitespace-nowrap">
                          {c.credits} SKS
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                            Sem {c.semester}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isWajib 
                              ? 'bg-slate-100 text-slate-700 border border-slate-300' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {c.jenis_mk || 'Wajib'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isLab 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                            {isLab ? 'Lab Praktikum' : 'Teori'}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.kbk === 'GENERAL'
                              ? 'bg-slate-100 text-slate-600'
                              : c.kbk === 'PEMROGRAMAN'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : c.kbk === 'MULTIMEDIA'
                              ? 'bg-pink-50 text-pink-700 border border-pink-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {c.kbk}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteCourse(c.id)}
                            title="Hapus mata kuliah"
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-[#1D8699]" />
              <span>Tambah Mata Kuliah Baru</span>
            </h3>
            <form onSubmit={handleCreateCourse} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="font-semibold text-slate-700 block mb-1">Kode MK:</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="MKKD1026"
                    className="w-full px-3 py-2 border rounded-lg uppercase font-mono-metrics focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Nama Mata Kuliah:</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Contoh: Pemrograman Mobile Lanjut"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Bobot SKS:</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    required
                    value={newCredits}
                    onChange={(e) => setNewCredits(parseInt(e.target.value) || 3)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Semester:</label>
                  <select
                    value={newSemester}
                    onChange={(e) => setNewSemester(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sifat Mata Kuliah:</label>
                  <select
                    value={newJenisMK}
                    onChange={(e) => setNewJenisMK(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                  >
                    <option value="Wajib">Wajib</option>
                    <option value="Pilihan">Pilihan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipe Ruang Kuliah:</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                  >
                    <option value="THEORY">Teori Reguler (THEORY)</option>
                    <option value="LABORATORY">Praktikum Lab (LABORATORY)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Peminatan (KBK):</label>
                  <select
                    value={newKBK}
                    onChange={(e) => setNewKBK(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                  >
                    <option value="GENERAL">GENERAL (Wajib Umum)</option>
                    <option value="PEMROGRAMAN">PEMROGRAMAN</option>
                    <option value="MULTIMEDIA">MULTIMEDIA</option>
                    <option value="IOT">IOT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mata Kuliah Prasyarat (Opsional):</label>
                <input
                  type="text"
                  value={newPrerequisites}
                  onChange={(e) => setNewPrerequisites(e.target.value)}
                  placeholder="Contoh: Algoritma dan Pemrograman (Minimal C)"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1D8699] hover:bg-[#166978] text-white rounded-lg font-bold cursor-pointer"
                >
                  Simpan Mata Kuliah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
