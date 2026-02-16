'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { FileText, Search, Filter, Eye } from 'lucide-react';

interface Billing {
  id: string;
  billNumber: string;
  student: {
    nama: string;
    nisn: string;
    class?: string;
  };
  type: string;
  month: number | null;
  year: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
  dueDate: string;
}

export default function BillingListPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    month: '',
    year: new Date().getFullYear().toString(),
    search: '',
  });

  const fetchBillings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/billing/list?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch billings: ${response.status}`);
      }
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Expected JSON from billings API');
      }
      const result = await response.json();

      if (result.success) {
        setBillings(result.data.billings);
      }
    } catch (error) {
      console.error('Error fetching billings:', error);
      alert('Gagal memuat data tagihan.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

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

    fetchBillings();
  }, [router, fetchBillings]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PARTIAL':
        return 'warning';
      case 'OVERDUE':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'UNBILLED': 'Belum Ditagih',
      'BILLED': 'Ditagih',
      'PARTIAL': 'Cicilan',
      'PAID': 'Lunas',
      'OVERDUE': 'Tunggakan',
      'CANCELLED': 'Dibatalkan',
      'WAIVED': 'Dibebaskan',
    };
    return labels[status] || status;
  };

  const getMonthName = (month: number | null) => {
    if (!month) return '-';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    return months[month - 1];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const columns = [
    {
      key: 'billNumber',
      label: 'No. Tagihan',
      width: '15%',
      render: (item: Billing) => (
        <div className="font-medium text-neutral-900">{item.billNumber}</div>
      ),
    },
    {
      key: 'student',
      label: 'Siswa',
      width: '20%',
      render: (item: Billing) => (
        <div>
          <div className="font-medium text-neutral-900">{item.student.nama}</div>
          <div className="text-sm text-neutral-600">{item.student.nisn}</div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Jenis',
      width: '10%',
      render: (item: Billing) => (
        <Badge variant="default">{item.type}</Badge>
      ),
    },
    {
      key: 'period',
      label: 'Periode',
      width: '12%',
      render: (item: Billing) => (
        <div className="text-sm">
          {item.month ? `${getMonthName(item.month)} ${item.year}` : item.year}
        </div>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Nominal',
      width: '15%',
      render: (item: Billing) => (
        <div>
          <div className="font-medium text-neutral-900">{formatCurrency(item.totalAmount)}</div>
          {item.paidAmount > 0 && (
            <div className="text-sm text-green-600">Terbayar: {formatCurrency(item.paidAmount)}</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '12%',
      render: (item: Billing) => (
        <Badge variant={getStatusBadgeVariant(item.status)}>
          {getStatusLabel(item.status)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      width: '10%',
      render: (item: Billing) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push(`/treasurer/billing/${item.id}`)}
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

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
                <h1 className="text-3xl font-bold text-neutral-900">Daftar Tagihan</h1>
                <p className="text-neutral-600 mt-1">Kelola semua tagihan siswa</p>
              </div>
              <Button
                variant="primary"
                onClick={() => router.push('/treasurer/billing')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate Tagihan
              </Button>
            </div>

            {/* Filters */}
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <Filter className="w-4 h-4 inline mr-1" />
                    Status
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <option value="">Semua</option>
                    <option value="BILLED">Ditagih</option>
                    <option value="PARTIAL">Cicilan</option>
                    <option value="PAID">Lunas</option>
                    <option value="OVERDUE">Tunggakan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Jenis
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  >
                    <option value="">Semua</option>
                    <option value="SPP">SPP</option>
                    <option value="DAFTAR_ULANG">Daftar Ulang</option>
                    <option value="KEGIATAN">Kegiatan</option>
                    <option value="UANG_GEDUNG">Uang Gedung</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Bulan
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={filters.month}
                    onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                  >
                    <option value="">Semua</option>
                    {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((month, idx) => (
                      <option key={idx + 1} value={idx + 1}>{month}</option>
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
                    value={filters.year}
                    onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <Search className="w-4 h-4 inline mr-1" />
                    Cari
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Nama/NISN"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="primary" onClick={fetchBillings}>
                  Terapkan Filter
                </Button>
              </div>
            </Card>

            {/* Table */}
            <Card>
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                  <p className="mt-4 text-neutral-600">Memuat data...</p>
                </div>
              ) : billings.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-600">Tidak ada tagihan ditemukan</p>
                </div>
              ) : (
                <Table
                  columns={columns}
                  data={billings}
                />
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
