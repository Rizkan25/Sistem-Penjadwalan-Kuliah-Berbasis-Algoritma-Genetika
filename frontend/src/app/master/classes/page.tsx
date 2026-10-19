'use client';

import React, { useState, useEffect } from 'react';
import { School, Plus, Trash2, RefreshCw } from 'lucide-react';
import { AcademicClass, Course, Lecturer } from '@/lib/types';
import { api } from '@/lib/api';

export default function ClassesPage() {
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedLecturerId, setSelectedLecturerId] = useState('');
  const [className, setClassName] = useState('');
  const [semester, setSemester] = useState<number>(1);
  const [cohort, setCohort] = useState<string>('A');
  const [kbk, setKbk] = useState<'GENERAL' | 'PEMROGRAMAN' | 'MULTIMEDIA' | 'IOT'>('GENERAL');
  const [studentCount, setStudentCount] = useState<number>(35);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cls, crs, lecs] = await Promise.all([
        api.getClasses(),
        api.getCourses(),
        api.getLecturers(),
      ]);
      setClasses(cls);
      setCourses(crs);
      setLecturers(lecs);
      if (crs.length > 0) setSelectedCourseId(crs[0].id);
      if (lecs.length > 0) setSelectedLecturerId(lecs[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createClass({
        course_id: selectedCourseId,
        lecturer_id: selectedLecturerId,
        class_name: className,
        semester,
        cohort,
        kbk,
        student_count: studentCount,
        academic_year: '2026/2027',
        semester_type: 'ODD',
      });
      setShowAddModal(false);
      setClassName('');
      loadData();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Hapus kelas rombel ini?')) return;
    try {
      await api.deleteClass(id);
      loadData();
    } catch (err: any) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <School className="w-5 h-5 text-[#1D8699]" />
            <span>Data Master Kelas & Rombel Perkuliahan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Entitas unit perkuliahan yang mengikat mata kuliah, dosen, mahasiswa, kelompok rombel, dan jalur KBK.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#1D8699] hover:bg-[#166978] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Kelas Rombel</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-[#1D8699] mx-auto mb-2" />
          <p className="text-xs font-semibold">Memuat data rombel kelas...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-bold text-slate-800 text-xs">
            Daftar Kelas Semester Ganjil 2026/2027 ({classes.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase border-b border-slate-200">
                  <th className="py-2.5 px-4">Nama Kelas</th>
                  <th className="py-2.5 px-4">Mata Kuliah</th>
                  <th className="py-2.5 px-4">Dosen Pengampu</th>
                  <th className="py-2.5 px-4 text-center">Semester / Cohort</th>
                  <th className="py-2.5 px-4">KBK</th>
                  <th className="py-2.5 px-4 text-center">Jumlah Mhs</th>
                  <th className="py-2.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classes.map((c) => {
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {c.class_name}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {c.course?.name || 'Mata Kuliah'}
                        </div>
                        <div className="font-mono-metrics text-[10px] text-slate-400">
                          {c.course?.code} ({c.course?.credits} SKS, {c.course?.course_type})
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {c.lecturer?.name || 'Dosen'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-800">Sem {c.semester}</span>
                        <span className="text-[10px] text-slate-500 block">Kelas {c.cohort}</span>
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
                      <td className="py-3 px-4 text-center font-mono-metrics font-bold text-slate-700">
                        {c.student_count} Mahasiswa
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteClass(c.id)}
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

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Tambah Kelas / Rombel Baru</h3>
            <form onSubmit={handleCreateClass} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pilih Mata Kuliah:</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value);
                    const found = courses.find((crs) => crs.id === e.target.value);
                    if (found) {
                      setSemester(found.semester);
                      setKbk(found.kbk);
                      setClassName(`IK-${found.semester}${cohort} ${found.name}`);
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                >
                  {courses.map((crs) => (
                    <option key={crs.id} value={crs.id}>
                      {crs.code} - {crs.name} (Sem {crs.semester}, {crs.credits} SKS, {crs.kbk})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Dosen Pengampu:</label>
                <select
                  value={selectedLecturerId}
                  onChange={(e) => setSelectedLecturerId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                >
                  {lecturers.map((lec) => (
                    <option key={lec.id} value={lec.id}>
                      {lec.name} ({lec.nidn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Sesi Kelas:</label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Contoh: IK-3A Pemrograman Web Dasar"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Semester:</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kelompok (Cohort):</label>
                  <select
                    value={cohort}
                    onChange={(e) => setCohort(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  >
                    <option value="A">Kelas A</option>
                    <option value="B">Kelas B</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jumlah Mahasiswa:</label>
                  <input
                    type="number"
                    min={5}
                    max={60}
                    required
                    value={studentCount}
                    onChange={(e) => setStudentCount(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Peminatan (KBK):</label>
                <select
                  value={kbk}
                  onChange={(e) => setKbk(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                >
                  <option value="GENERAL">GENERAL (Wajib Umum)</option>
                  <option value="PEMROGRAMAN">PEMROGRAMAN</option>
                  <option value="MULTIMEDIA">MULTIMEDIA</option>
                  <option value="IOT">IOT</option>
                </select>
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
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
