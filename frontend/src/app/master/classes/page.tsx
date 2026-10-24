'use client';

import React, { useState, useEffect } from 'react';
import { 
  School, Plus, Trash2, RefreshCw, Filter, BookOpen, Layers, Pencil,
  ArrowUpDown, ArrowUp, ArrowDown, Search, X 
} from 'lucide-react';
import { AcademicClass, Course, Lecturer } from '@/lib/types';
import { api } from '@/lib/api';

type SortField = 'class_name' | 'course' | 'lecturer' | 'semester' | 'cohort' | 'kbk' | 'student_count';

export default function ClassesPage() {
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(true);

  // Table filter, search & sort state
  const [tableSemesterFilter, setTableSemesterFilter] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('semester');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal & Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
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

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition shrink-0 ml-1" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#1D8699] font-bold shrink-0 ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#1D8699] font-bold shrink-0 ml-1" />
    );
  };

  // Helper when opening add modal
  const handleOpenAddModal = (targetSem: number | 'ALL' = 1) => {
    setEditingClassId(null);
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

  // Helper when opening edit modal
  const handleOpenEditModal = (cls: AcademicClass) => {
    setEditingClassId(cls.id);
    setModalFilterSemester(cls.semester);
    setSelectedCourseId(cls.course_id);
    setSelectedLecturerId(cls.lecturer_id);
    setClassName(cls.class_name);
    setSemester(cls.semester);
    setCohort(cls.cohort);
    setKbk(cls.kbk);
    setStudentCount(cls.student_count);
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

  // Helper when user manually customizes the semester for this class
  const handleSemesterChange = (newSem: number) => {
    setSemester(newSem);
    const found = courses.find((crs) => crs.id === selectedCourseId);
    if (found) {
      setClassName(`IK-${newSem}${cohort} ${found.name}`);
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

  const handleSubmitClass = async (e: React.FormEvent) => {
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
      if (editingClassId) {
        await api.updateClass(editingClassId, {
          course_id: selectedCourseId,
          lecturer_id: selectedLecturerId,
          class_name: className.trim(),
          semester,
          cohort,
          kbk,
          student_count: studentCount,
          academic_year: '2026/2027',
          semester_type: semester % 2 !== 0 ? 'ODD' : 'EVEN',
        });
      } else {
        await api.createClass({
          course_id: selectedCourseId,
          lecturer_id: selectedLecturerId,
          class_name: className.trim(),
          semester,
          cohort,
          kbk,
          student_count: studentCount,
          academic_year: '2026/2027',
          semester_type: semester % 2 !== 0 ? 'ODD' : 'EVEN',
        });
      }
      setShowAddModal(false);
      setEditingClassId(null);
      loadData();
    } catch (err: any) {
      alert(`Gagal ${editingClassId ? 'memperbarui' : 'membuat'} kelas: ${err.message || 'Terjadi kesalahan'}`);
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

  // Filtered & Searched classes for table
  const filteredClasses = classes.filter((c) => {
    // 1. Filter Semester
    if (tableSemesterFilter !== 'ALL' && c.semester !== tableSemesterFilter) {
      return false;
    }
    // 2. Filter Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = c.class_name.toLowerCase().includes(q);
      const matchCourse = (c.course?.name || '').toLowerCase().includes(q);
      const matchCode = (c.course?.code || '').toLowerCase().includes(q);
      const matchLecturer = (c.lecturer?.name || '').toLowerCase().includes(q);
      const matchKbk = c.kbk.toLowerCase().includes(q);
      const matchCohort = `rombel ${c.cohort.toLowerCase()}`.includes(q) || `kelas ${c.cohort.toLowerCase()}`.includes(q);
      if (!matchName && !matchCourse && !matchCode && !matchLecturer && !matchKbk && !matchCohort) {
        return false;
      }
    }
    return true;
  });

  // Sorted classes
  const sortedClasses = [...filteredClasses].sort((a, b) => {
    let valA: string | number = '';
    let valB: string | number = '';

    switch (sortField) {
      case 'class_name':
        valA = a.class_name.toLowerCase();
        valB = b.class_name.toLowerCase();
        break;
      case 'course':
        valA = (a.course?.name || '').toLowerCase();
        valB = (b.course?.name || '').toLowerCase();
        break;
      case 'lecturer':
        valA = (a.lecturer?.name || '').toLowerCase();
        valB = (b.lecturer?.name || '').toLowerCase();
        break;
      case 'semester':
        valA = a.semester;
        valB = b.semester;
        break;
      case 'cohort':
        valA = a.cohort.toLowerCase();
        valB = b.cohort.toLowerCase();
        break;
      case 'kbk':
        valA = a.kbk.toLowerCase();
        valB = b.kbk.toLowerCase();
        break;
      case 'student_count':
        valA = a.student_count;
        valB = b.student_count;
        break;
      default:
        return 0;
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

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
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#1D8699] hover:bg-[#166978] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
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
          {/* Table Header & Controls (Quick Search & Semester Filter) */}
          <div className="p-4 border-b border-slate-100 bg-white space-y-3">
            {/* Tier 1: Title, Count Badge, and Sort info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
                  Daftar Rombel Semester Ganjil 2026/2027
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200 whitespace-nowrap shrink-0">
                  {sortedClasses.length} dari {classes.length} Rombel
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span>
                  Urutan: <strong className="text-[#1D8699] font-bold">
                    {sortField === 'class_name' && 'Nama Kelas'}
                    {sortField === 'course' && 'Mata Kuliah'}
                    {sortField === 'lecturer' && 'Dosen Pengampu'}
                    {sortField === 'semester' && 'Semester'}
                    {sortField === 'cohort' && 'Kelompok Rombel'}
                    {sortField === 'kbk' && 'Jalur KBK'}
                    {sortField === 'student_count' && 'Jumlah Mahasiswa'}
                  </strong> ({sortDirection === 'asc' ? 'Menaik / A-Z' : 'Menurun / Z-A'})
                </span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="text-slate-400 text-[10px]">Klik header kolom untuk mengganti urutan</span>
              </div>
            </div>

            {/* Tier 2: Filter Semester + Quick Search Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1.5 border-t border-slate-100">
              {/* Semester Filter */}
              <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:border-[#1D8699] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1D8699]/20 transition shadow-2xs shrink-0">
                <Filter className="w-3.5 h-3.5 text-[#1D8699] shrink-0" />
                <span className="text-[11px] font-semibold text-slate-500 shrink-0">Filter Semester:</span>
                <select
                  value={tableSemesterFilter === 'ALL' ? 'ALL' : tableSemesterFilter}
                  onChange={(e) => setTableSemesterFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer pr-1"
                >
                  <option value="ALL">Semua Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              {/* Quick Search Input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari rombel, MK, dosen, KBK..."
                  className="w-full pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D8699]/30 focus:border-[#1D8699] transition shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                    title="Hapus pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[760px]">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase border-b border-slate-200 select-none">
                  {/* Kolom 1: Nama Kelas */}
                  <th 
                    onClick={() => handleSort('class_name')}
                    className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 transition group"
                    title="Klik untuk mengurutkan berdasarkan Nama Kelas"
                  >
                    <div className="flex items-center space-x-1">
                      <span className={sortField === 'class_name' ? 'text-[#1D8699]' : ''}>Nama Kelas</span>
                      {renderSortIcon('class_name')}
                    </div>
                  </th>

                  {/* Kolom 2: Mata Kuliah */}
                  <th 
                    onClick={() => handleSort('course')}
                    className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 transition group"
                    title="Klik untuk mengurutkan berdasarkan Mata Kuliah"
                  >
                    <div className="flex items-center space-x-1">
                      <span className={sortField === 'course' ? 'text-[#1D8699]' : ''}>Mata Kuliah</span>
                      {renderSortIcon('course')}
                    </div>
                  </th>

                  {/* Kolom 3: Dosen Pengampu */}
                  <th 
                    onClick={() => handleSort('lecturer')}
                    className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 transition group"
                    title="Klik untuk mengurutkan berdasarkan Dosen Pengampu"
                  >
                    <div className="flex items-center space-x-1">
                      <span className={sortField === 'lecturer' ? 'text-[#1D8699]' : ''}>Dosen Pengampu</span>
                      {renderSortIcon('lecturer')}
                    </div>
                  </th>

                  {/* Kolom 4: Semester */}
                  <th 
                    onClick={() => handleSort('semester')}
                    className="py-2.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition group"
                    title="Klik untuk mengurutkan berdasarkan Semester"
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span className={sortField === 'semester' ? 'text-[#1D8699]' : ''}>Semester</span>
                      {renderSortIcon('semester')}
                    </div>
                  </th>

                  {/* Kolom 5: Rombel */}
                  <th 
                    onClick={() => handleSort('cohort')}
                    className="py-2.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition group"
                    title="Klik untuk mengurutkan berdasarkan Kelompok Rombel"
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span className={sortField === 'cohort' ? 'text-[#1D8699]' : ''}>Rombel</span>
                      {renderSortIcon('cohort')}
                    </div>
                  </th>

                  {/* Kolom 6: KBK */}
                  <th 
                    onClick={() => handleSort('kbk')}
                    className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 transition group"
                    title="Klik untuk mengurutkan berdasarkan Peminatan (KBK)"
                  >
                    <div className="flex items-center space-x-1">
                      <span className={sortField === 'kbk' ? 'text-[#1D8699]' : ''}>KBK</span>
                      {renderSortIcon('kbk')}
                    </div>
                  </th>

                  {/* Kolom 7: Jumlah Mahasiswa */}
                  <th 
                    onClick={() => handleSort('student_count')}
                    className="py-2.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition group"
                    title="Klik untuk mengurutkan berdasarkan Jumlah Mahasiswa"
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span className={sortField === 'student_count' ? 'text-[#1D8699]' : ''}>Jumlah Mhs</span>
                      {renderSortIcon('student_count')}
                    </div>
                  </th>

                  {/* Kolom 8: Aksi */}
                  <th className="py-2.5 px-4 text-center">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedClasses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      {searchQuery ? (
                        <div>
                          <p className="font-semibold text-slate-600">Tidak ada kelas yang cocok dengan pencarian &quot;{searchQuery}&quot;</p>
                          <p className="text-[11px] mt-1 text-slate-400">Coba gunakan kata kunci lain atau bersihkan kotak pencarian.</p>
                        </div>
                      ) : (
                        'Tidak ada kelas yang ditemukan untuk filter semester ini.'
                      )}
                    </td>
                  </tr>
                ) : (
                  sortedClasses.map((c) => {
                    const cleanName = c.class_name.replace(/\s*-\s*Rombel.*$/i, '').replace(/\s*\(\*\)/g, '').trim();
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {cleanName}
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
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#E6F4F7] text-[#1D8699] border border-[#BCE3EB] font-mono-metrics shadow-2xs">
                            Rombel {c.cohort}
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
                        <td className="py-3 px-4 text-center font-mono-metrics font-bold text-slate-700">
                          {c.student_count} Mahasiswa
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleOpenEditModal(c)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md cursor-pointer transition"
                              title="Edit Kelas"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClass(c.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md cursor-pointer transition"
                              title="Hapus Kelas"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Add / Edit Class Modal (Revised with Semester Selector & Clean Course Dropdown) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-lg ${editingClassId ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-[#1D8699]'}`}>
                  {editingClassId ? <Pencil className="w-5 h-5" /> : <School className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {editingClassId ? 'Edit Kelas / Rombel' : 'Tambah Kelas / Rombel Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingClassId
                      ? 'Perbarui mata kuliah, dosen pengampu, nama kelas, semester, atau kelompok'
                      : 'Pilih semester untuk menyaring mata kuliah agar mudah dipilih'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingClassId(null);
                }}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitClass} className="space-y-4 text-xs">
              {/* 1. SEMESTER SELECTOR DROPDOWN */}
              <div>
                <label className="font-bold text-slate-700 flex items-center space-x-1.5 mb-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#1D8699]" />
                  <span>Pilih Semester (Penyaring MK):</span>
                </label>

                <select
                  value={modalFilterSemester}
                  onChange={(e) =>
                    handleSelectModalSemester(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                  }
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D8699]/30 focus:border-[#1D8699] transition shadow-2xs cursor-pointer"
                >
                  <option value="ALL">Semua Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
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
                  {lecturers.map((lec) => {
                    const kbkText = !lec.kbk || lec.kbk === 'GENERAL' ? 'Semua KBK' : `KBK: ${lec.kbk}`;
                    return (
                      <option key={lec.id} value={lec.id}>
                        {lec.name} ({lec.nidn || '-'}) • [{kbkText}] {lec.is_guest ? '(Tamu)' : ''}
                      </option>
                    );
                  })}
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

              {/* 5. CUSTOM SEMESTER, COHORT, MAHASISWA & KBK */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Semester Kelas:
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => handleSemesterChange(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D8699]/30"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rombel:</label>
                  <select
                    value={cohort}
                    onChange={(e) => handleCohortChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D8699]/30"
                  >
                    <option value="A">Rombel A</option>
                    <option value="B">Rombel B</option>
                    <option value="C">Rombel C</option>
                    <option value="D">Rombel D</option>
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
                  <label className="font-bold text-slate-700 block mb-1">Peminatan (KBK):</label>
                  <select
                    value={kbk}
                    onChange={(e) => setKbk(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D8699]/30"
                  >
                    <option value="GENERAL">GENERAL</option>
                    <option value="PEMROGRAMAN">PEMROGRAMAN</option>
                    <option value="MULTIMEDIA">MULTIMEDIA</option>
                    <option value="IOT">IOT</option>
                  </select>
                </div>
              </div>

              {/* MODAL ACTIONS */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingClassId(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!selectedCourseId || filteredModalCourses.length === 0}
                  className={`px-5 py-2 ${
                    editingClassId
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-[#1D8699] hover:bg-[#166978]'
                  } text-white rounded-lg font-bold shadow-xs cursor-pointer transition flex items-center space-x-1.5 ${
                    (!selectedCourseId || filteredModalCourses.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {editingClassId && <Pencil className="w-3.5 h-3.5" />}
                  <span>{editingClassId ? 'Simpan Perubahan' : 'Simpan Kelas Rombel'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
