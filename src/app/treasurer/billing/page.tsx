'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileText, PlusCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface Class {
  id: string;
  name: string;
  grade: number;
  sppAmount: number;
}

interface AcademicYear {
  id: string;
  year: string;
  isActive: boolean;
}

export default function BillingManagementPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    academicYearId: '',
    classIds: [] as string[],
    type: 'SPP',
    description: '',
  });

  // Stats
  const [stats, setStats] = useState({
    totalBilled: 0,
    totalPaid: 0,
    totalPartial: 0,
    totalOverdue: 0,
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== 'TREASURER') {
      router.push('/auth/login');
      return;
    }

    fetchClasses();
    fetchAcademicYears();
    fetchStats();
  }, [router]);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/admin/classes');
      if (!response.ok) {
        throw new Error(`Failed to fetch classes: ${response.status}`);
      }
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Expected JSON from classes API');
      }
      const result = await response.json();
      if (result.success) {
        setClasses(result.data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await fetch('/api/admin/academic-years');
      if (!response.ok) {
        throw new Error(`Failed to fetch academic years: ${response.status}`);
      }
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Expected JSON from academic years API');
      }
      const result = await response.json();
      if (result.success) {
        setAcademicYears(result.data);
        const active = result.data.find((ay: AcademicYear) => ay.isActive);
        if (active) {
          setFormData(prev => ({ ...prev, academicYearId: active.id }));
        }
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/billing/stats');
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Expected JSON from stats API');
      }
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleGenerateBilling = async () => {
    if (!formData.academicYearId) {
      setMessage({ type: 'error', text: 'Pilih tahun ajaran terlebih dahulu' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/billing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Expected JSON response');
      }

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: 'success',
          text: `Berhasil generate ${result.data.generated} tagihan! Skipped: ${result.data.skipped}, Failed: ${result.data.failed}`,
        });
        fetchStats();
      } else {
        setMessage({ type: 'error', text: result.error || 'Gagal generate tagihan' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat generate tagihan' });
    } finally {
      setLoading(false);
    }
  };

  const toggleClassSelection = (classId: string) => {
    setFormData(prev => ({
      ...prev,
      classIds: prev.classIds.includes(classId)
        ? prev.classIds.filter(id => id !== classId)
        : [...prev.classIds, classId],
    }));
  };

  const selectAllClasses = () => {
    setFormData(prev => ({
      ...prev,
      classIds: classes.map(c => c.id),
    }));
  };

  const deselectAllClasses = () => {
    setFormData(prev => ({ ...prev, classIds: [] }));
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="hidden lg:block">
        <TreasurerSidebar />
      </div>

      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 z-50 lg:hidden">
            <TreasurerSidebar />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col">
        <TreasurerHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto mt-16">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Kelola Tagihan</h1>
                <p className="text-neutral-600 mt-1">Generate dan kelola tagihan SPP siswa</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => router.push('/treasurer/billing/list')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Lihat Semua Tagihan
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card padding="md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600">Total Tagihan</p>
                    <h3 className="text-2xl font-bold text-primary-600">{stats.totalBilled}</h3>
                  </div>
                  <FileText className="w-8 h-8 text-primary-600 opacity-50" />
                </div>
              </Card>
              <Card padding="md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600">Lunas</p>
                    <h3 className="text-2xl font-bold text-green-600">{stats.totalPaid}</h3>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
                </div>
              </Card>
              <Card padding="md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600">Cicilan</p>
                    <h3 className="text-2xl font-bold text-yellow-600">{stats.totalPartial}</h3>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600 opacity-50" />
                </div>
              </Card>
              <Card padding="md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600">Tunggakan</p>
                    <h3 className="text-2xl font-bold text-red-600">{stats.totalOverdue}</h3>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600 opacity-50" />
                </div>
              </Card>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {message.text}
                </p>
              </div>
            )}

            {/* Generate Form */}
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <PlusCircle className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-bold text-neutral-900">Generate Tagihan SPP Bulanan</h2>
              </div>
              <div className="space-y-6">
                {/* Periode */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Bulan
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                    >
                      {[
                        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                      ].map((month, index) => (
                        <option key={index + 1} value={index + 1}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Tahun
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Academic Year */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Tahun Ajaran
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={formData.academicYearId}
                    onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
                  >
                    <option value="">Pilih Tahun Ajaran</option>
                    {academicYears.map(ay => (
                      <option key={ay.id} value={ay.id}>
                        {ay.year} {ay.isActive && '(Aktif)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Class Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Pilih Kelas
                    </label>
                    <div className="space-x-2">
                      <button
                        type="button"
                        className="text-sm text-primary-600 hover:underline"
                        onClick={selectAllClasses}
                      >
                        Pilih Semua
                      </button>
                      <button
                        type="button"
                        className="text-sm text-neutral-600 hover:underline"
                        onClick={deselectAllClasses}
                      >
                        Batal Pilih
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {classes.map(cls => (
                      <div
                        key={cls.id}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          formData.classIds.includes(cls.id)
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                        onClick={() => toggleClassSelection(cls.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-neutral-900">{cls.name}</p>
                            <p className="text-sm text-neutral-600">Rp {cls.sppAmount.toLocaleString('id-ID')}</p>
                          </div>
                          {formData.classIds.includes(cls.id) && (
                            <CheckCircle className="w-5 h-5 text-primary-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {formData.classIds.length === 0 && (
                    <p className="text-sm text-neutral-500 mt-2">
                      Kosongkan untuk generate semua kelas
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Keterangan (Opsional)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Misal: SPP Bulan Januari 2024"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    onClick={handleGenerateBilling}
                    disabled={loading || !formData.academicYearId}
                  >
                    {loading ? 'Generating...' : 'Generate Tagihan'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
