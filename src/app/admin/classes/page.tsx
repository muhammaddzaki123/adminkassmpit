'use client';

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

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="lg:ml-64">
        <AdminHeader />
        <main className="pt-16 lg:pt-20 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">Kelola Kelas</h1>
                <p className="mt-1 text-sm text-neutral-600 sm:text-base">Tambah dan hapus kelas untuk manajemen data siswa</p>
              </div>
            </div>

            {message && (
              <Card padding="md" className={message.type === 'success' ? 'border-primary-300 bg-primary-50' : 'border-red-300 bg-red-50'}>
                <p className={message.type === 'success' ? 'text-primary-800' : 'text-red-800'}>{message.text}</p>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card padding="md" className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <School className="w-5 h-5 text-blue-600" />
                  <p className="text-2xl font-bold text-neutral-900">{classes.length}</p>
                </div>
                <p className="text-sm text-neutral-600">Total Kelas Aktif</p>
              </Card>
              <Card padding="md" className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <p className="text-2xl font-bold text-neutral-900">
                    {classes.reduce((sum, item) => sum + item.currentStudents, 0)}
                  </p>
                </div>
                <p className="text-sm text-neutral-600">Total Siswa Dalam Kelas</p>
              </Card>
              <Card padding="md" className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Plus className="w-5 h-5 text-yellow-600" />
                  <p className="text-2xl font-bold text-neutral-900">{filteredClasses.length}</p>
                </div>
                <p className="text-sm text-neutral-600">Hasil Pencarian</p>
              </Card>
            </div>

            <Card>
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-semibold text-neutral-900">
                  {editingId ? 'Edit Kelas' : 'Tambah Kelas Baru'}
                </h2>
                {editingId && (
                  <Button variant="secondary" size="sm" onClick={resetForm} className="w-full md:w-auto">
                    Batal Edit
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
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
                <div className="flex items-end">
                  <Button onClick={handleCreateOrUpdateClass} isLoading={isSaving} fullWidth icon={<Plus className="w-4 h-4" />}>
                    {editingId ? 'Simpan' : 'Tambah'}
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-4 gap-4">
                <h2 className="text-xl font-semibold text-neutral-900">Daftar Kelas</h2>
                <div className="w-72">
                  <Input
                    placeholder="Cari kelas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {isLoading ? (
                <p className="text-sm text-neutral-600">Memuat data kelas...</p>
              ) : filteredClasses.length === 0 ? (
                <p className="text-sm text-neutral-600">Belum ada kelas atau tidak ada hasil pencarian.</p>
              ) : (
                <div className="space-y-3">
                  {filteredClasses.map((item) => (
                    <div key={item.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 bg-neutral-50 rounded-lg">
                      <div>
                        <p className="font-medium text-neutral-900">Kelas {item.grade} - {item.name}</p>
                        <p className="text-sm text-neutral-600 mt-1">
                          SPP: Rp {Math.round(item.sppAmount || 0).toLocaleString('id-ID')} • Kapasitas: {item.maxCapacity ?? '-'} • Siswa aktif: {item.currentStudents}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.currentStudents > 0 ? 'warning' : 'success'}>
                          {item.currentStudents > 0 ? 'Masih Dipakai' : 'Bisa Dihapus'}
                        </Badge>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Edit className="w-4 h-4" />}
                          onClick={() => handleEditClass(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<Trash2 className="w-4 h-4" />}
                          onClick={() => handleDeleteClass(item)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
