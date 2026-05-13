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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <div className="lg:ml-64">
        <AdminHeader />
        <main className="pt-16 lg:pt-20 p-3 sm:p-5 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-3 sm:space-y-5">
            {/* Page Header */}
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900">Kelola Tahun Ajaran</h1>
              <p className="mt-0.5 text-xs sm:text-sm text-neutral-600">Atur periode tahun ajaran dan tandai periode aktif</p>
            </div>

            {/* Message */}
            {message && (
              <Card padding="sm" className={message.type === 'success' ? 'border-primary-300 bg-primary-50' : 'border-red-300 bg-red-50'}>
                <p className={`text-sm ${message.type === 'success' ? 'text-primary-800' : 'text-red-800'}`}>{message.text}</p>
              </Card>
            )}

            {/* Form */}
            <Card>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-base sm:text-lg font-semibold text-neutral-900">
                  {editingId ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
                </h2>
                {editingId && (
                  <Button variant="secondary" size="sm" onClick={resetForm}>
                    Batal
                  </Button>
                )}
              </div>

              {/* Form: 2 kolom di mobile, lebih banyak di desktop */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
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
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
                <label className="inline-flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-neutral-300 text-primary focus:ring-primary"
                  />
                  Jadikan tahun ajaran aktif
                </label>
                <Button onClick={handleSave} isLoading={saving} icon={<Plus className="w-4 h-4" />} className="w-full sm:w-auto">
                  {editingId ? 'Simpan Perubahan' : 'Tambah'}
                </Button>
              </div>
            </Card>

            {/* Daftar Tahun Ajaran */}
            <Card>
              <h2 className="text-base sm:text-lg font-semibold text-neutral-900 mb-3">Daftar Tahun Ajaran</h2>
              {loading ? (
                <p className="text-sm text-neutral-600 py-4 text-center">Memuat tahun ajaran...</p>
              ) : items.length === 0 ? (
                <p className="text-sm text-neutral-600 py-4 text-center">Belum ada data tahun ajaran.</p>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-neutral-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 text-sm flex items-center gap-1.5">
                          <CalendarRange className="w-3.5 h-3.5 shrink-0 text-neutral-500" />
                          {item.year}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {new Date(item.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' – '}
                          {new Date(item.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' · '}{item.studentCount} siswa · {item.billingCount} tagihan
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant={item.isActive ? 'success' : 'default'}>
                          {item.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                        {!item.isActive && (
                          <button
                            title="Aktifkan"
                            onClick={() => handleSetActive(item)}
                            className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          title="Edit"
                          onClick={() => handleEdit(item)}
                          className="p-1.5 rounded-lg hover:bg-primary-50 text-primary transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          title="Hapus"
                          onClick={() => handleDelete(item)}
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
    </div>
  );
}
