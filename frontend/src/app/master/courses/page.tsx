'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, RefreshCw } from 'lucide-react';
import { Course } from '@/lib/types';
import { api } from '@/lib/api';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSemester, setFilterSemester] = useState<number | 'ALL'>('ALL');

  // Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCredits, setNewCredits] = useState<number>(3);
  const [newSemester, setNewSemester] = useState<number>(1);
  const [newType, setNewType] = useState<'THEORY' | 'LABORATORY'>('THEORY');
  const [newKBK, setNewKBK] = useState<'GENERAL' | 'PEMROGRAMAN' | 'MULTIMEDIA' | 'IOT'>('GENERAL');

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
        code: newCode,
        name: newName,
        credits: newCredits,
        semester: newSemester,
        course_type: newType,
        kbk: newKBK,
      });
      setShowAddModal(false);
      setNewCode('');
      setNewName('');
      loadCourses();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Hapus mata kuliah ini?')) return;
    try {
      await api.deleteCourse(id);
      loadCourses();
    } catch (err: any) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  const filteredCourses = filterSemester === 'ALL'
    ? courses
    : courses.filter((c) => c.semester === filterSemester);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-[#1D8699]" />
            <span>Data Master Mata Kuliah & SKS</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar kurikulum mata kuliah wajib umum dan peminatan KBK Prodi Ilmu Komputer UBBG.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Semester Filter */}
          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700"
          >
            <option value="ALL">Semua Semester</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#1D8699] hover:bg-[#166978] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Mata Kuliah</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-[#1D8699] mx-auto mb-2" />
          <p className="text-xs font-semibold">Memuat data mata kuliah...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-bold text-slate-800 text-xs">
            Daftar Mata Kuliah ({filteredCourses.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase border-b border-slate-200">
                  <th className="py-2.5 px-4">Kode MK</th>
                  <th className="py-2.5 px-4">Nama Mata Kuliah</th>
                  <th className="py-2.5 px-4 text-center">SKS</th>
                  <th className="py-2.5 px-4 text-center">Semester</th>
                  <th className="py-2.5 px-4">Tipe Kuliah</th>
                  <th className="py-2.5 px-4">Peminatan (KBK)</th>
                  <th className="py-2.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCourses.map((c) => {
                  const isLab = c.course_type === 'LABORATORY';
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono-metrics font-bold text-[#1D8699]">
                        {c.code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {c.name}
                      </td>
                      <td className="py-3 px-4 text-center font-mono-metrics font-bold text-slate-700">
                        {c.credits} SKS
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        Sem {c.semester}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isLab 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {c.course_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.kbk === 'GENERAL'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-pink-50 text-pink-700 border border-pink-200'
                        }`}>
                          {c.kbk}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteCourse(c.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Tambah Mata Kuliah Baru</h3>
            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kode MK:</label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="Contoh: MKKD1001 atau MKKB3001"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Mata Kuliah:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Pemrograman Web Lanjut"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1D8699] text-white rounded-lg font-bold cursor-pointer"
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
