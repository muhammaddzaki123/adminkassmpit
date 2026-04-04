'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { fetchWithAuth } from '@/lib/api-client';
import { CalendarRange, Plus, Trash2, Edit, CheckCircle } from 'lucide-react';

interface AcademicYearItem {
  id: string;
  year: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  description?: string | null;
  studentCount: number;
  billingCount: number;
}

export default function AdminAcademicYearsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AcademicYearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    year: '',
    startDate: '',
    endDate: '',
    isActive: false,
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

    fetchAcademicYears();
  }, [router]);

  const fetchAcademicYears = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/admin/academic-years');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memuat tahun ajaran');
      }
      setItems(json.data || []);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Gagal memuat tahun ajaran',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      year: '',
      startDate: '',
      endDate: '',
      isActive: false,
      description: '',
    });
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.year || !form.startDate || !form.endDate) {
      setMessage({ type: 'error', text: 'Tahun, tanggal mulai, dan tanggal selesai wajib diisi' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        year: form.year.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        isActive: form.isActive,
        description: form.description || null,
      };

      const res = await fetchWithAuth(
        editingId ? `/api/admin/academic-years/${editingId}` : '/api/admin/academic-years',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menyimpan tahun ajaran');
      }

      setMessage({
        type: 'success',
        text: editingId ? 'Tahun ajaran berhasil diperbarui' : 'Tahun ajaran berhasil ditambahkan',
      });

      resetForm();
      await fetchAcademicYears();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Gagal menyimpan tahun ajaran',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: AcademicYearItem) => {
    setEditingId(item.id);
    setForm({
      year: item.year,
      startDate: item.startDate.slice(0, 10),
      endDate: item.endDate.slice(0, 10),
      isActive: item.isActive,
      description: item.description || '',
    });
  };

  const handleSetActive = async (item: AcademicYearItem) => {
    if (item.isActive) return;
    try {
      const res = await fetchWithAuth(`/api/admin/academic-years/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengaktifkan tahun ajaran');
      }
      setMessage({ type: 'success', text: `Tahun ajaran ${item.year} aktif` });
      await fetchAcademicYears();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Gagal mengaktifkan tahun ajaran',
      });
    }
  };

  const handleDelete = async (item: AcademicYearItem) => {
    const confirmed = confirm(`Hapus tahun ajaran ${item.year}?`);
    if (!confirmed) return;

    try {
      const res = await fetchWithAuth(`/api/admin/academic-years/${item.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menghapus tahun ajaran');
      }
      setMessage({ type: 'success', text: `Tahun ajaran ${item.year} berhasil dihapus` });
      await fetchAcademicYears();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Gagal menghapus tahun ajaran',
      });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="ml-64">
        <AdminHeader />
        <main className="pt-16 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Kelola Tahun Ajaran</h1>
              <p className="text-neutral-600 mt-1">Atur periode tahun ajaran dan tandai periode aktif</p>
            </div>

            {message && (
              <Card padding="md" className={message.type === 'success' ? 'border-primary-300 bg-primary-50' : 'border-red-300 bg-red-50'}>
                <p className={message.type === 'success' ? 'text-primary-800' : 'text-red-800'}>{message.text}</p>
              </Card>
            )}

            <Card>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                {editingId ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <Input
                  label="Label Tahun"
                  placeholder="2026/2027"
                  value={form.year}
                  onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
                />
                <Input
                  label="Tanggal Mulai"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                />
                <Input
                  label="Tanggal Selesai"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                />
                <Input
                  label="Deskripsi"
                  placeholder="Opsional"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
                <div className="flex items-end gap-2">
                  <Button onClick={handleSave} isLoading={saving} icon={<Plus className="w-4 h-4" />}>
                    {editingId ? 'Simpan' : 'Tambah'}
                  </Button>
                  {editingId && (
                    <Button variant="secondary" onClick={resetForm}>
                      Batal
                    </Button>
                  )}
                </div>
              </div>
              <label className="inline-flex items-center gap-2 mt-4 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                Jadikan tahun ajaran aktif
              </label>
            </Card>

            <Card>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Daftar Tahun Ajaran</h2>
              {loading ? (
                <p className="text-sm text-neutral-600">Memuat tahun ajaran...</p>
              ) : items.length === 0 ? (
                <p className="text-sm text-neutral-600">Belum ada data tahun ajaran.</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-4 bg-neutral-50 rounded-lg">
                      <div>
                        <p className="font-medium text-neutral-900 flex items-center gap-2">
                          <CalendarRange className="w-4 h-4" />
                          {item.year}
                        </p>
                        <p className="text-sm text-neutral-600 mt-1">
                          {new Date(item.startDate).toLocaleDateString('id-ID')} - {new Date(item.endDate).toLocaleDateString('id-ID')} • Siswa: {item.studentCount} • Tagihan: {item.billingCount}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.isActive ? 'success' : 'default'}>
                          {item.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                        {!item.isActive && (
                          <Button size="sm" variant="secondary" icon={<CheckCircle className="w-4 h-4" />} onClick={() => handleSetActive(item)}>
                            Aktifkan
                          </Button>
                        )}
                        <Button size="sm" variant="secondary" icon={<Edit className="w-4 h-4" />} onClick={() => handleEdit(item)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={() => handleDelete(item)}>
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
