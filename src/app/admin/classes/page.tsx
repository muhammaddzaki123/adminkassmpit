'use client';

import { ManageClassMembersModal } from '@/components/admin/ManageClassMembersModal';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { fetchWithAuth } from '@/lib/api-client';
import { Plus, School, Trash2, Users, Edit } from 'lucide-react';

interface ClassItem {
  id: string;
  name: string;
  grade: number;
  sppAmount: number;
  maxCapacity: number | null;
  currentStudents: number;
}

export default function AdminClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [selectedClassForManage, setSelectedClassForManage] = useState<ClassItem | null>(null);

  const [form, setForm] = useState({
    grade: '',
    name: '',
    sppAmount: '',
    maxCapacity: '40',
    description: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }

    fetchClasses();
  }, [router]);

  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithAuth('/api/admin/classes');
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal memuat data kelas');
      }
      setClasses(result.data || []);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Gagal memuat data kelas',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return classes;
    return classes.filter((item) => {
      const label = `kelas ${item.grade} ${item.name}`.toLowerCase();
      return label.includes(query);
    });
  }, [classes, search]);

  const resetForm = () => {
    setForm({
      grade: '',
      name: '',
      sppAmount: '',
      maxCapacity: '40',
      description: '',
    });
    setEditingId(null);
  };

  const handleCreateOrUpdateClass = async () => {
    if (!form.grade || !form.name) {
      setMessage({ type: 'error', text: 'Tingkat kelas dan nama kelas wajib diisi' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetchWithAuth(editingId ? `/api/admin/classes/${editingId}` : '/api/admin/classes', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: Number(form.grade),
          name: form.name.trim(),
          sppAmount: form.sppAmount ? Number(form.sppAmount) : 0,
          maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : 40,
          description: form.description || null,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal menyimpan kelas');
      }

      setMessage({ type: 'success', text: editingId ? 'Kelas berhasil diperbarui' : 'Kelas berhasil ditambahkan' });
      resetForm();
      await fetchClasses();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Gagal menyimpan kelas',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClass = (item: ClassItem) => {
    setEditingId(item.id);
    setForm({
      grade: String(item.grade),
      name: item.name,
      sppAmount: String(item.sppAmount ?? 0),
      maxCapacity: String(item.maxCapacity ?? 40),
      description: '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClass = async (item: ClassItem) => {
    const confirmed = confirm(`Hapus kelas ${item.grade}-${item.name}?`);
    if (!confirmed) return;

    setMessage(null);
    try {
      const response = await fetchWithAuth(`/api/admin/classes/${item.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal menghapus kelas');
      }

      setMessage({ type: 'success', text: `Kelas ${item.grade}-${item.name} berhasil dihapus` });
      await fetchClasses();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Gagal menghapus kelas',
      });
    }
  };
  const handleOpenManageModal = (item: ClassItem) => {
    setSelectedClassForManage(item);
    setManageModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="lg:ml-64">
        <AdminHeader />
        <main className="pt-16 lg:pt-20 p-3 sm:p-5 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-3 sm:space-y-5">
            {/* Page Header */}
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900">Kelola Kelas</h1>
              <p className="mt-0.5 text-xs sm:text-sm text-neutral-600">Tambah dan hapus kelas untuk manajemen data siswa</p>
            </div>

            {/* Message */}
            {message && (
              <Card padding="sm" className={message.type === 'success' ? 'border-primary-300 bg-primary-50' : 'border-red-300 bg-red-50'}>
                <p className={`text-sm ${message.type === 'success' ? 'text-primary-800' : 'text-red-800'}`}>{message.text}</p>
              </Card>
            )}

            {/* Stats — 3 kolom di semua ukuran */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Card padding="sm" className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <School className="w-4 h-4 text-blue-600" />
                  <p className="text-xl sm:text-2xl font-bold text-neutral-900">{classes.length}</p>
                </div>
                <p className="text-[10px] sm:text-xs text-neutral-600 leading-tight">Total Kelas</p>
              </Card>
              <Card padding="sm" className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Users className="w-4 h-4 text-green-600" />
                  <p className="text-xl sm:text-2xl font-bold text-neutral-900">
                    {classes.reduce((sum, item) => sum + item.currentStudents, 0)}
                  </p>
                </div>
                <p className="text-[10px] sm:text-xs text-neutral-600 leading-tight">Total Siswa</p>
              </Card>
              <Card padding="sm" className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Plus className="w-4 h-4 text-yellow-600" />
                  <p className="text-xl sm:text-2xl font-bold text-neutral-900">{filteredClasses.length}</p>
                </div>
                <p className="text-[10px] sm:text-xs text-neutral-600 leading-tight">Hasil Cari</p>
              </Card>
            </div>

            {/* Form Tambah/Edit Kelas */}
            <Card>
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-neutral-900">
                  {editingId ? 'Edit Kelas' : 'Tambah Kelas Baru'}
                </h2>
                {editingId && (
                  <Button variant="secondary" size="sm" onClick={resetForm} className="w-full sm:w-auto">
                    Batal Edit
                  </Button>
                )}
              </div>
              {/* Form: 2 kolom di mobile, 5 kolom di desktop */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
                <Input
                  label="Tingkat"
                  type="number"
                  min={1}
                  max={12}
                  placeholder="7"
                  value={form.grade}
                  onChange={(e) => setForm((prev) => ({ ...prev, grade: e.target.value }))}
                />
                <Input
                  label="Nama Kelas"
                  placeholder="A / B / IPA-1"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  label="SPP (Opsional)"
                  type="number"
                  min={0}
                  placeholder="500000"
                  value={form.sppAmount}
                  onChange={(e) => setForm((prev) => ({ ...prev, sppAmount: e.target.value }))}
                />
                <Input
                  label="Kapasitas"
                  type="number"
                  min={1}
                  placeholder="40"
                  value={form.maxCapacity}
                  onChange={(e) => setForm((prev) => ({ ...prev, maxCapacity: e.target.value }))}
                />
                <div className="flex items-end col-span-2 lg:col-span-1">
                  <Button onClick={handleCreateOrUpdateClass} isLoading={isSaving} fullWidth icon={<Plus className="w-4 h-4" />}>
                    {editingId ? 'Simpan' : 'Tambah'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Daftar Kelas */}
            <Card>
              <div className="flex items-center justify-between mb-3 gap-3">
                <h2 className="text-base sm:text-lg font-semibold text-neutral-900 whitespace-nowrap">Daftar Kelas</h2>
                <div className="flex-1 max-w-xs sm:max-w-[18rem]">
                  <Input
                    placeholder="Cari kelas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {isLoading ? (
                <p className="text-sm text-neutral-600 py-4 text-center">Memuat data kelas...</p>
              ) : filteredClasses.length === 0 ? (
                <p className="text-sm text-neutral-600 py-4 text-center">Belum ada kelas atau tidak ada hasil pencarian.</p>
              ) : (
                <div className="space-y-2">
                  {filteredClasses.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-neutral-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 text-sm">Kelas {item.grade} - {item.name}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          SPP: Rp {Math.round(item.sppAmount || 0).toLocaleString('id-ID')} • Kap: {item.maxCapacity ?? '-'} • Siswa: {item.currentStudents}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={item.currentStudents > 0 ? 'warning' : 'success'}>
                          {item.currentStudents > 0 ? 'Aktif' : 'Kosong'}
                        </Badge>
                          <button
                            title="Lihat dan kelola member"
                            onClick={() => handleOpenManageModal(item)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          >
                            <Users className="w-4 h-4" />
                          </button>
                        <button
                          title="Edit"
                          onClick={() => handleEditClass(item)}
                          className="p-1.5 rounded-lg hover:bg-primary-50 text-primary transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          title="Hapus"
                          onClick={() => handleDeleteClass(item)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
        {selectedClassForManage && (
          <ManageClassMembersModal
            isOpen={manageModalOpen}
            classId={selectedClassForManage.id}
            className={`${selectedClassForManage.grade} - ${selectedClassForManage.name}`}
            maxCapacity={selectedClassForManage.maxCapacity}
            onClose={() => {
              setManageModalOpen(false);
              setSelectedClassForManage(null);
            }}
            onMembersUpdated={fetchClasses}
          />
        )}
    </div>
  );
}
