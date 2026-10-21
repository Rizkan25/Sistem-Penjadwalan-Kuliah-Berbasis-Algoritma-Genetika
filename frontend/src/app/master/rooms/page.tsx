'use client';

import React, { useState, useEffect } from 'react';
import { DoorClosed, Plus, Trash2, RefreshCw } from 'lucide-react';
import { Room } from '@/lib/types';
import { api } from '@/lib/api';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCapacity, setNewCapacity] = useState<number>(45);
  const [newType, setNewType] = useState<'THEORY' | 'LABORATORY'>('THEORY');

  const loadRooms = async () => {
    setLoading(true);
    try {
      const data = await api.getRooms();
      setRooms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createRoom({
        code: newCode,
        name: newName,
        capacity: newCapacity,
        room_type: newType,
        is_active: true,
      });
      setShowAddModal(false);
      setNewCode('');
      setNewName('');
      setNewCapacity(45);
      loadRooms();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Hapus ruangan ini?')) return;
    try {
      await api.deleteRoom(id);
      loadRooms();
    } catch (err: any) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <DoorClosed className="w-5 h-5 text-[#1D8699]" />
            <span>Data Master Ruang Kuliah & Laboratorium</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data kapasitas kursi dan tipe ruangan untuk memenuhi batasan keras kapasitas dan kesesuaian ruang teori/lab.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#1D8699] hover:bg-[#166978] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Ruangan</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-[#1D8699] mx-auto mb-2" />
          <p className="text-xs font-semibold">Memuat data ruangan...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-bold text-slate-800 text-xs">
            Daftar Ruangan Kampus UBBG ({rooms.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase border-b border-slate-200">
                  <th className="py-2.5 px-4">Kode Ruang</th>
                  <th className="py-2.5 px-4">Nama Ruangan</th>
                  <th className="py-2.5 px-4">Tipe Ruang</th>
                  <th className="py-2.5 px-4 text-center">Daya Tampung</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms.map((r) => {
                  const isLab = r.room_type === 'LABORATORY';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono-metrics font-bold text-[#1D8699]">
                        {r.code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {r.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isLab 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {r.room_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono-metrics font-bold text-slate-700">
                        {r.capacity} Kursi
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          Aktif
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteRoom(r.id)}
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

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Tambah Ruangan Baru</h3>
            <form onSubmit={handleCreateRoom} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kode Ruang:</label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="Contoh: C.III.10 atau D.III.01"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Ruangan:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: LAB KOMPUTER 02"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tipe Ruangan:</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                >
                  <option value="THEORY">Kelas Teori Reguler (THEORY)</option>
                  <option value="LABORATORY">Laboratorium Praktikum (LABORATORY)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kapasitas Kursi:</label>
                <input
                  type="number"
                  min={10}
                  max={120}
                  required
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(parseInt(e.target.value) || 40)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8699]/20"
                />
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
                  Simpan Ruangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
