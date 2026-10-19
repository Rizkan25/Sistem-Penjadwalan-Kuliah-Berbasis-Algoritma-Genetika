'use client';

import React, { useState, useEffect } from 'react';
import { School, Plus, Trash2, RefreshCw, Filter, BookOpen, Layers } from 'lucide-react';
import { AcademicClass, Course, Lecturer } from '@/lib/types';
import { api } from '@/lib/api';

export default function ClassesPage() {
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(true);

  // Table filter state
  const [tableSemesterFilter, setTableSemesterFilter] = useState<number | 'ALL'>('ALL');

  // Modal & Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalFilterSemester, setModalFilterSemester] = useState<number | 'ALL'>(1);
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

      // Pre-select Semester 1 course by default
      const sem1Courses = crs.filter((c) => c.semester === 1);
      const initialCourse = sem1Courses.length > 0 ? sem1Courses[0] : (crs[0] || null);
      if (initialCourse) {
        setSelectedCourseId(initialCourse.id);
        setSemester(initialCourse.semester);
        setKbk(initialCourse.kbk);
        setClassName(`IK-${initialCourse.semester}A ${initialCourse.name}`);
      }
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

  // Helper when opening add modal
  const handleOpenAddModal = (targetSem: number | 'ALL' = 1) => {
    setModalFilterSemester(targetSem);
    const targetCourses = targetSem === 'ALL' ? courses : courses.filter((c) => c.semester === targetSem);
    const initialCourse = targetCourses.length > 0 ? targetCourses[0] : (courses.length > 0 ? courses[0] : null);
    if (initialCourse) {
      setSelectedCourseId(initialCourse.id);
      setSemester(initialCourse.semester);
      setKbk(initialCourse.kbk);
      setClassName(`IK-${initialCourse.semester}${cohort} ${initialCourse.name}`);
    } else {
      setSelectedCourseId('');
      setClassName('');
    }
    setShowAddModal(true);
  };

  // Helper when user clicks a semester button inside modal
  const handleSelectModalSemester = (targetSem: number | 'ALL') => {
    setModalFilterSemester(targetSem);
    const targetCourses = targetSem === 'ALL' ? courses : courses.filter((c) => c.semester === targetSem);
    const exists = targetCourses.find((c) => c.id === selectedCourseId);
    if (!exists) {
      if (targetCourses.length > 0) {
        const first = targetCourses[0];
        setSelectedCourseId(first.id);
        setSemester(first.semester);
        setKbk(first.kbk);
        setClassName(`IK-${first.semester}${cohort} ${first.name}`);
      } else {
        setSelectedCourseId('');
        if (typeof targetSem === 'number') {
          setSemester(targetSem);
        }
      }
    }
  };

  // Helper when user selects a course from the dropdown
  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    const found = courses.find((crs) => crs.id === courseId);
    if (found) {
      setSemester(found.semester);
      setKbk(found.kbk);
      setClassName(`IK-${found.semester}${cohort} ${found.name}`);
    }
  };

  // Helper when user changes cohort ('A' vs 'B')
  const handleCohortChange = (newCohort: string) => {
    setCohort(newCohort);
    const found = courses.find((crs) => crs.id === selectedCourseId);
    if (found) {
      setClassName(`IK-${found.semester}${newCohort} ${found.name}`);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      alert('Silakan pilih mata kuliah terlebih dahulu.');
      return;
    }
    if (!selectedLecturerId) {
      alert('Silakan pilih dosen pengampu.');
      return;
    }
    if (!className.trim()) {
      alert('Nama sesi kelas tidak boleh kosong.');
      return;
    }
    try {
      await api.createClass({
        course_id: selectedCourseId,
        lecturer_id: selectedLecturerId,
        class_name: className.trim(),
        semester,
        cohort,
        kbk,
        student_count: studentCount,
        academic_year: '2026/2027',
        semester_type: 'ODD',
      });
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      alert(`Gagal membuat kelas: ${err.message || 'Terjadi kesalahan'}`);
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

  // Filtered courses for modal
  const filteredModalCourses = modalFilterSemester === 'ALL'
    ? courses
    : courses.filter((c) => c.semester === modalFilterSemester);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  // Filtered classes for table
  const filteredClasses = tableSemesterFilter === 'ALL'
    ? classes
    : classes.filter((c) => c.semester === tableSemesterFilter);

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
          onClick={() => handleOpenAddModal(tableSemesterFilter === 'ALL' ? 1 : tableSemesterFilter)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#1D8699] hover:bg-[#166978] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition"
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
          {/* Table Header & Semester Filter Tabs */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="font-bold text-slate-800 text-xs">
              Daftar Kelas Semester Ganjil 2026/2027 ({filteredClasses.length} dari {classes.length} Kelas)
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
              <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center space-x-1">
                <Filter className="w-3 h-3 text-[#1D8699]" />
                <span>Semester:</span>
              </span>
              <button
                onClick={() => setTableSemesterFilter('ALL')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  tableSemesterFilter === 'ALL'
                    ? 'bg-[#1D8699] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              {[1, 3, 5, 7].map((s) => (
                <button
                  key={s}
                  onClick={() => setTableSemesterFilter(s)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    tableSemesterFilter === s
                      ? 'bg-[#1D8699] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sem {s}
                </button>
              ))}
            </div>
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
                {filteredClasses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada kelas yang ditemukan untuk filter ini.
                    </td>
                  </tr>
                ) : (
                  filteredClasses.map((c) => {
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
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md cursor-pointer transition"
                            title="Hapus Kelas"
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

      {/* Add Class Modal (Revised with Semester Selector & Clean Course Dropdown) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-teal-50 text-[#1D8699] rounded-lg">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Tambah Kelas / Rombel Baru</h3>
                  <p className="text-[11px] text-slate-500">
                    Gunakan tombol semester untuk menyaring mata kuliah agar mudah dipilih
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
              {/* 1. SEMESTER SELECTOR BUTTONS */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700 flex items-center space-x-1.5">
                    <Filter className="w-3.5 h-3.5 text-[#1D8699]" />
                    <span>Pilih Semester (Penyaring MK):</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {modalFilterSemester === 'ALL'
                      ? 'Semua Semester'
                      : `Semester ${modalFilterSemester}`}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100/90 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleSelectModalSemester('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      modalFilterSemester === 'ALL'
                        ? 'bg-[#1D8699] text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    Semua ({courses.length})
                  </button>

                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => {
                    const count = courses.filter((c) => c.semester === s).length;
                    const isActive = modalFilterSemester === s;
                    const hasCourses = count > 0;

                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={!hasCourses}
                        onClick={() => handleSelectModalSemester(s)}
                        title={hasCourses ? `${count} mata kuliah tersedia` : 'Tidak ada mata kuliah aktif di semester ini'}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1 ${
                          !hasCourses
                            ? 'bg-slate-100 text-slate-300 border border-slate-200/40 cursor-not-allowed opacity-60'
                            : isActive
                            ? 'bg-[#1D8699] text-white shadow-xs font-bold'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                        }`}
                      >
                        <span>Sem {s}</span>
                        {hasCourses && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. REVISED COURSE SELECT DROPDOWN */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700 flex items-center space-x-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#1D8699]" />
                    <span>Pilih Mata Kuliah:</span>
                  </label>
                  <span className="text-[11px] font-semibold text-teal-700">
                    {filteredModalCourses.length} mata kuliah ditampilkan
                  </span>
                </div>

                <select
                  value={selectedCourseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  disabled={filteredModalCourses.length === 0}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D8699]/30 focus:border-[#1D8699] transition shadow-2xs"
                >
                  {filteredModalCourses.length === 0 ? (
                    <option value="">(Tidak ada mata kuliah untuk semester ini)</option>
                  ) : modalFilterSemester === 'ALL' ? (
                    [1, 2, 3, 4, 5, 6, 7, 8].map((s) => {
                      const sCourses = courses.filter((c) => c.semester === s);
                      if (sCourses.length === 0) return null;
                      return (
                        <optgroup key={s} label={`--- SEMESTER ${s} ---`}>
                          {sCourses.map((crs) => (
                            <option key={crs.id} value={crs.id}>
                              [{crs.code}] {crs.name} • {crs.credits} SKS ({crs.course_type === 'LABORATORY' ? 'Praktikum' : 'Teori'}) • {crs.kbk}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })
                  ) : (
                    filteredModalCourses.map((crs) => (
                      <option key={crs.id} value={crs.id}>
                        [{crs.code}] {crs.name} — {crs.credits} SKS ({crs.course_type === 'LABORATORY' ? 'Praktikum Lab' : 'Teori'}) • {crs.kbk}
                      </option>
                    ))
                  )}
                </select>

                {/* Selected Course Visual Preview Card */}
                {selectedCourse && (
                  <div className="mt-2.5 p-3 bg-teal-50/50 border border-teal-200/60 rounded-xl flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-800 text-xs flex items-center space-x-2">
                        <span>{selectedCourse.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-slate-700 bg-white px-1.5 py-0.5 border border-slate-200 rounded">
                          {selectedCourse.code}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">Semester {selectedCourse.semester}</span>
                        <span>•</span>
                        <span>{selectedCourse.credits} SKS</span>
                        <span>•</span>
                        <span className={selectedCourse.course_type === 'LABORATORY' ? 'text-amber-800 font-semibold' : 'text-slate-600'}>
                          {selectedCourse.course_type === 'LABORATORY' ? 'Praktikum Laboratorium' : 'Kuliah Teori'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                        selectedCourse.kbk === 'GENERAL'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-[#1D8699] text-white shadow-xs'
                      }`}
                    >
                      {selectedCourse.kbk}
                    </span>
                  </div>
                )}
              </div>

              {/* 3. DOSEN PENGAMPU */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Dosen Pengampu:
                </label>
                <select
                  value={selectedLecturerId}
                  onChange={(e) => setSelectedLecturerId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D8699]/30"
                >
                  {lecturers.map((lec) => (
                    <option key={lec.id} value={lec.id}>
                      {lec.name} ({lec.nidn})
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. NAMA SESI KELAS */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nama Sesi Kelas (Otomatis Sesuai Mata Kuliah & Cohort):
                </label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Contoh: IK-1A Algoritma & Pemrograman I"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D8699]/30"
                />
              </div>

              {/* 5. COHORT, STUDENT COUNT & SYNCED METRICS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kelompok (Cohort):</label>
                  <select
                    value={cohort}
                    onChange={(e) => handleCohortChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D8699]/30"
                  >
                    <option value="A">Kelas A (Reguler A)</option>
                    <option value="B">Kelas B (Reguler B)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jumlah Mahasiswa:</label>
                  <input
                    type="number"
                    min={5}
                    max={60}
                    required
                    value={studentCount}
                    onChange={(e) => setStudentCount(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D8699]/30"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Semester & Jalur KBK:</label>
                  <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span>Sem {semester}</span>
                    <span className="text-[10px] text-teal-800 font-extrabold uppercase">{kbk}</span>
                  </div>
                </div>
              </div>

              {/* MODAL ACTIONS */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!selectedCourseId || filteredModalCourses.length === 0}
                  className={`px-5 py-2 bg-[#1D8699] hover:bg-[#166978] text-white rounded-lg font-bold shadow-xs cursor-pointer transition ${
                    (!selectedCourseId || filteredModalCourses.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Simpan Kelas Rombel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
