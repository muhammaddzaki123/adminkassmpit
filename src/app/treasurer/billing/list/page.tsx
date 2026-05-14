'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api-client';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { FileText, Search, Filter, Eye, Settings2, X, RotateCcw } from 'lucide-react';

type BulkActionType = 'DISCOUNT' | 'INSTALLMENT';

interface ClassOption {
  id: string;
  label: string;
  grade: string;
}

interface Billing {
  id: string;
  billNumber: string;
  student: {
    id: string;
    nama: string;
    nisn: string;
    class?: string;
  };
  type: string;
  month: number | null;
  year: number;
  subtotal: number;
  totalAmount: number;
  discount: number;
  discountSource: 'NONE' | 'MANUAL' | 'RECURRING';
  discountReason: string | null;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  allowInstallments: boolean;
  installmentCount: number | null;
  installmentAmount: number | null;
  dueDate: string;
}

interface UndoInfo {
  logId: string;
  actionType: BulkActionType;
  batchId: string;
  processedCount: number;
  skippedCount: number;
  createdAt: string;
  undone: boolean;
}

export default function BillingListPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<BulkActionType>('DISCOUNT');
  const [selectedBillingIds, setSelectedBillingIds] = useState<string[]>([]);
  const [bulkResultMessage, setBulkResultMessage] = useState<string | null>(null);
  const [undoInfo, setUndoInfo] = useState<UndoInfo | null>(null);
  const [undoLoading, setUndoLoading] = useState(false);

  // Bulk modal — local search & class filter
  const [bulkSearch, setBulkSearch] = useState('');
  const [bulkClassFilter, setBulkClassFilter] = useState('');
  const [classes, setClasses] = useState<ClassOption[]>([]);

  const [bulkDiscountForm, setBulkDiscountForm] = useState({
    discountAmount: '',
    discountReason: '',
    recurringMonths: '0',
    enableRecurring: false,
  });
  const [discountOverrides, setDiscountOverrides] = useState<Record<string, string>>({});

  const [bulkInstallmentForm, setBulkInstallmentForm] = useState({
    installmentCount: '3',
    respectAllowInstallments: true,
  });

  const [filters, setFilters] = useState({
    status: '',
    type: '',
    month: '',
    year: new Date().getFullYear().toString(),
    search: '',
  });

  const applyTypePreset = (type: string) => {
    setFilters((prev) => ({ ...prev, type }));
  };

  const fetchBillings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);
      if (filters.search) params.append('search', filters.search);

      const response = await fetchWithAuth(`/api/billing/list?${params.toString()}`);
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

  const loadUndoInfo = useCallback(async (action: BulkActionType) => {
    try {
      const response = await fetchWithAuth(`/api/billing/bulk/undo?action=${action}`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        setUndoInfo(null);
        return;
      }
      setUndoInfo(result.data || null);
    } catch {
      setUndoInfo(null);
    }
  }, []);

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

  useEffect(() => {
    if (!bulkModalOpen) return;
    loadUndoInfo(bulkActionType);

    // Fetch class list once when modal first opens
    if (classes.length > 0) return;
    fetchWithAuth('/api/classes/active')
      .then((r) => r.json())
      .then((result) => {
        if (result.success) setClasses(result.data);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkModalOpen, bulkActionType, loadUndoInfo]);

  const eligibleDiscountBillings = useMemo(
    () => billings.filter((billing) => !['PAID', 'WAIVED', 'CANCELLED'].includes(billing.status)),
    [billings]
  );

  const eligibleInstallmentBillings = useMemo(
    () => billings.filter((billing) => {
      if (['PAID', 'WAIVED', 'CANCELLED'].includes(billing.status)) return false;
      if (billing.remainingAmount <= 0) return false;
      if (bulkInstallmentForm.respectAllowInstallments && !billing.allowInstallments) return false;
      return true;
    }),
    [billings, bulkInstallmentForm.respectAllowInstallments]
  );

  const basePreviewBillings = bulkActionType === 'DISCOUNT' ? eligibleDiscountBillings : eligibleInstallmentBillings;

  const previewBillings = useMemo(() => {
    let list = basePreviewBillings;
    if (bulkSearch.trim()) {
      const q = bulkSearch.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.student.nama.toLowerCase().includes(q) ||
          b.student.nisn.toLowerCase().includes(q)
      );
    }
    if (bulkClassFilter) {
      list = list.filter((b) => b.student.class === bulkClassFilter);
    }
    return list;
  }, [basePreviewBillings, bulkSearch, bulkClassFilter]);

  const allSelected = previewBillings.length > 0 && selectedBillingIds.length === previewBillings.length;

  const sppBillings = useMemo(
    () => billings.filter((billing) => billing.type === 'SPP'),
    [billings]
  );

  const reRegistrationBillings = useMemo(
    () => billings.filter((billing) => billing.type === 'DAFTAR_ULANG'),
    [billings]
  );

  const sppSummary = useMemo(() => {
    const totalAmount = sppBillings.reduce((sum, billing) => sum + billing.totalAmount, 0);
    const paidAmount = sppBillings.reduce((sum, billing) => sum + billing.paidAmount, 0);
    const remainingAmount = sppBillings.reduce((sum, billing) => sum + billing.remainingAmount, 0);

    return {
      total: sppBillings.length,
      paid: sppBillings.filter((billing) => billing.status === 'PAID').length,
      unpaid: sppBillings.filter((billing) => ['BILLED', 'OVERDUE', 'PARTIAL'].includes(billing.status)).length,
      totalAmount,
      paidAmount,
      remainingAmount,
    };
  }, [sppBillings]);

  const reRegistrationSummary = useMemo(() => {
    const totalAmount = reRegistrationBillings.reduce((sum, billing) => sum + billing.totalAmount, 0);
    const paidAmount = reRegistrationBillings.reduce((sum, billing) => sum + billing.paidAmount, 0);
    const remainingAmount = reRegistrationBillings.reduce((sum, billing) => sum + billing.remainingAmount, 0);

    return {
      total: reRegistrationBillings.length,
      paid: reRegistrationBillings.filter((billing) => billing.status === 'PAID').length,
      unpaid: reRegistrationBillings.filter((billing) => ['BILLED', 'OVERDUE', 'PARTIAL'].includes(billing.status)).length,
      totalAmount,
      paidAmount,
      remainingAmount,
    };
  }, [reRegistrationBillings]);

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
      UNBILLED: 'Belum Ditagih',
      BILLED: 'Ditagih',
      PARTIAL: 'Cicilan',
      PAID: 'Lunas',
      OVERDUE: 'Tunggakan',
      CANCELLED: 'Dibatalkan',
      WAIVED: 'Dibebaskan',
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

  const openBulkModal = () => {
    setBulkResultMessage(null);
    setBulkActionType('DISCOUNT');
    setSelectedBillingIds(eligibleDiscountBillings.map((billing) => billing.id));
    setDiscountOverrides({});
    setBulkSearch('');
    setBulkClassFilter('');
    setBulkModalOpen(true);
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedBillingIds([]);
      return;
    }
    setSelectedBillingIds(previewBillings.map((billing) => billing.id));
  };

  const toggleBillingSelection = (billingId: string) => {
    setSelectedBillingIds((prev) => (
      prev.includes(billingId)
        ? prev.filter((id) => id !== billingId)
        : [...prev, billingId]
    ));
  };

  const submitBulkAction = async () => {
    if (selectedBillingIds.length === 0) {
      alert('Pilih minimal satu tagihan pada preview.');
      return;
    }

    setBulkLoading(true);
    setBulkResultMessage(null);
    try {
      if (bulkActionType === 'DISCOUNT') {
        const discountAmount = Number(bulkDiscountForm.discountAmount || 0);
        const discountReason = bulkDiscountForm.discountReason.trim();
        const recurringMonths = Number(bulkDiscountForm.recurringMonths || 0);

        if (!discountAmount || discountAmount <= 0) {
          throw new Error('Nominal diskon harus lebih dari 0.');
        }
        if (!discountReason) {
          throw new Error('Alasan diskon wajib diisi.');
        }

        const payloadOverrides = Object.entries(discountOverrides).reduce<Record<string, number>>((acc, [billingId, value]) => {
          const parsed = Number(value);
          if (Number.isFinite(parsed) && parsed > 0) {
            acc[billingId] = parsed;
          }
          return acc;
        }, {});

        const response = await fetchWithAuth('/api/billing/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'DISCOUNT',
            billingIds: selectedBillingIds,
            discountAmount,
            discountReason,
            discountOverrides: payloadOverrides,
            recurringMonths: bulkDiscountForm.enableRecurring ? recurringMonths : 0,
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Gagal memproses diskon massal');
        }

        setBulkResultMessage(result.message || 'Diskon massal berhasil diproses.');
      } else {
        const installmentCount = Number(bulkInstallmentForm.installmentCount || 0);
        if (!Number.isInteger(installmentCount) || installmentCount < 1) {
          throw new Error('Jumlah cicilan harus bilangan bulat minimal 1.');
        }

        const response = await fetchWithAuth('/api/billing/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'INSTALLMENT',
            billingIds: selectedBillingIds,
            installmentCount,
            respectAllowInstallments: bulkInstallmentForm.respectAllowInstallments,
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Gagal memproses cicilan massal');
        }

        setBulkResultMessage(result.message || 'Cicilan massal berhasil diproses.');
      }

      await fetchBillings();
      await loadUndoInfo(bulkActionType);
    } catch (error) {
      console.error('Bulk action error:', error);
      alert(error instanceof Error ? error.message : 'Gagal memproses aksi massal.');
    } finally {
      setBulkLoading(false);
    }
  };

  const undoLastBulkAction = async () => {
    setUndoLoading(true);
    try {
      const response = await fetchWithAuth('/api/billing/bulk/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType: bulkActionType }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal undo aksi massal.');
      }

      setBulkResultMessage(result.message || 'Undo berhasil.');
      await fetchBillings();
      await loadUndoInfo(bulkActionType);
    } catch (error) {
      console.error('Undo bulk error:', error);
      alert(error instanceof Error ? error.message : 'Gagal undo aksi massal.');
    } finally {
      setUndoLoading(false);
    }
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
          {item.discount > 0 && (
            <div className="text-xs text-indigo-600">Diskon: {formatCurrency(item.discount)}</div>
          )}
          {item.paidAmount > 0 && (
            <div className="text-sm text-green-600">Terbayar: {formatCurrency(item.paidAmount)}</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '10%',
      render: (item: Billing) => (
        <Badge variant={getStatusBadgeVariant(item.status)}>
          {getStatusLabel(item.status)}
        </Badge>
      ),
    },
    {
      key: 'discountSource',
      label: 'Sumber Diskon',
      width: '13%',
      render: (item: Billing) => {
        if (item.discountSource === 'RECURRING') {
          return <Badge variant="info">Berkelanjutan</Badge>;
        }

        if (item.discountSource === 'MANUAL') {
          return <Badge variant="warning">Manual</Badge>;
        }

        return <span className="text-neutral-400 text-sm">-</span>;
      },
    },
    {
      key: 'actions',
      label: 'Aksi',
      width: '8%',
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

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <TreasurerHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto mt-16">
          <div className="max-w-6xl xl:max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Daftar Tagihan</h1>
                <p className="text-neutral-600 mt-1">Kelola semua tagihan siswa, termasuk SPP dan daftar ulang tahunan</p>
              </div>
              <div className="flex flex-col items-stretch gap-2 lg:min-w-[260px]">
                <Button
                  variant="outline"
                  onClick={() => router.push('/treasurer/re-registration')}
                >
                  Daftar Ulang
                </Button>
                <Button
                  variant="primary"
                  onClick={() => router.push('/treasurer/billing')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Tagihan
                </Button>
                <Button variant="outline" onClick={openBulkModal}>
                  <Settings2 className="w-4 h-4 mr-2" />
                  Kelola Diskon & Cicilan Massal
                </Button>
              </div>
            </div>
            <Card className="overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-blue-700">SPP</p>
                  <p className="mt-2 text-2xl font-bold text-blue-900">{sppSummary.total}</p>
                  <p className="text-sm text-blue-700 mt-1">Total billing aktif</p>
                </div>
                <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-green-700">SPP Lunas</p>
                  <p className="mt-2 text-2xl font-bold text-green-900">{sppSummary.paid}</p>
                  <p className="text-sm text-green-700 mt-1">Sudah selesai</p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-amber-700">Daftar Ulang</p>
                  <p className="mt-2 text-2xl font-bold text-amber-900">{reRegistrationSummary.total}</p>
                  <p className="text-sm text-amber-700 mt-1">Total billing aktif</p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">Daftar Ulang Lunas</p>
                  <p className="mt-2 text-2xl font-bold text-neutral-900">{reRegistrationSummary.paid}</p>
                  <p className="text-sm text-neutral-600 mt-1">Status pembayaran selesai</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Button
                  size="sm"
                  variant={filters.type === '' ? 'primary' : 'outline'}
                  onClick={() => applyTypePreset('')}
                >
                  Semua Jenis
                </Button>
                <Button
                  size="sm"
                  variant={filters.type === 'SPP' ? 'primary' : 'outline'}
                  onClick={() => applyTypePreset('SPP')}
                >
                  SPP
                </Button>
                <Button
                  size="sm"
                  variant={filters.type === 'DAFTAR_ULANG' ? 'primary' : 'outline'}
                  onClick={() => applyTypePreset('DAFTAR_ULANG')}
                >
                  Daftar Ulang
                </Button>
                <Button
                  size="sm"
                  variant={filters.type === 'KEGIATAN' ? 'primary' : 'outline'}
                  onClick={() => applyTypePreset('KEGIATAN')}
                >
                  Kegiatan
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
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

            <Card className="overflow-hidden">
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
                <div className="overflow-x-auto">
                  <Table
                    columns={columns}
                    data={billings}
                  />
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>

      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-7xl max-h-[92vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-start justify-between px-5 py-4 border-b border-neutral-200">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">Kelola Diskon & Cicilan Massal</h2>
                <p className="text-sm text-neutral-600 mt-1">Preview daftar tagihan sebelum submit, lalu pilih manual dengan checkbox.</p>
              </div>
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="text-neutral-500 hover:text-neutral-700"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 border-b border-neutral-200 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={bulkActionType === 'DISCOUNT' ? 'primary' : 'outline'}
                onClick={() => {
                  setBulkActionType('DISCOUNT');
                  setSelectedBillingIds(eligibleDiscountBillings.map((billing) => billing.id));
                }}
              >
                Diskon Massal
              </Button>
              <Button
                size="sm"
                variant={bulkActionType === 'INSTALLMENT' ? 'primary' : 'outline'}
                onClick={() => {
                  setBulkActionType('INSTALLMENT');
                  setSelectedBillingIds(eligibleInstallmentBillings.map((billing) => billing.id));
                }}
              >
                Cicilan Massal
              </Button>
              <div className="ml-auto">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={undoLastBulkAction}
                  disabled={undoLoading || !undoInfo || undoInfo.undone || undoInfo.processedCount === 0}
                  icon={<RotateCcw className="w-4 h-4" />}
                >
                  Undo Terakhir ({bulkActionType === 'DISCOUNT' ? 'Diskon' : 'Cicilan'})
                </Button>
              </div>
            </div>

            <div className="p-5 overflow-auto space-y-4">
              {undoInfo && (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
                  Aksi terakhir: {undoInfo.processedCount} diproses, {undoInfo.skippedCount} dilewati ({new Date(undoInfo.createdAt).toLocaleString('id-ID')})
                  {undoInfo.undone ? ' - sudah di-undo' : ''}
                </div>
              )}

              {bulkResultMessage && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 px-3 py-2 text-sm">
                  {bulkResultMessage}
                </div>
              )}

              {bulkActionType === 'DISCOUNT' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Nominal Diskon Default (Rp)</label>
                    <CurrencyInput
                      value={bulkDiscountForm.discountAmount}
                      onValueChange={(discountAmount) => setBulkDiscountForm({ ...bulkDiscountForm, discountAmount })}
                      className="rounded-lg border border-neutral-300 px-3 py-2"
                      min={1}
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Alasan Diskon</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                      value={bulkDiscountForm.discountReason}
                      onChange={(e) => setBulkDiscountForm({ ...bulkDiscountForm, discountReason: e.target.value })}
                      placeholder="Contoh: Program keringanan"
                    />
                  </div>
                  <div className="lg:col-span-3 rounded-lg border border-neutral-200 p-3">
                    <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                      <input
                        type="checkbox"
                        checked={bulkDiscountForm.enableRecurring}
                        onChange={(e) => setBulkDiscountForm({ ...bulkDiscountForm, enableRecurring: e.target.checked })}
                      />
                      Terapkan diskon berkelanjutan ke tagihan yang belum terbit
                    </label>
                    {bulkDiscountForm.enableRecurring && (
                      <div className="mt-2 max-w-xs">
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Berlaku untuk berapa bulan ke depan</label>
                        <input
                          type="number"
                          min={1}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                          value={bulkDiscountForm.recurringMonths}
                          onChange={(e) => setBulkDiscountForm({ ...bulkDiscountForm, recurringMonths: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Jumlah Cicilan</label>
                    <input
                      type="number"
                      min={1}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                      value={bulkInstallmentForm.installmentCount}
                      onChange={(e) => setBulkInstallmentForm({ ...bulkInstallmentForm, installmentCount: e.target.value })}
                    />
                  </div>
                  <div className="lg:col-span-2 flex items-end">
                    <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                      <input
                        type="checkbox"
                        checked={bulkInstallmentForm.respectAllowInstallments}
                        onChange={(e) => setBulkInstallmentForm({ ...bulkInstallmentForm, respectAllowInstallments: e.target.checked })}
                      />
                      Hanya untuk siswa yang diizinkan cicilan
                    </label>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-neutral-200 overflow-hidden">
                {/* Search & class filter bar */}
                <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-white border-b border-neutral-200">
                  <div className="relative flex-1 min-w-40">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Cari nama / NISN..."
                      value={bulkSearch}
                      onChange={(e) => setBulkSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={bulkClassFilter}
                    onChange={(e) => setBulkClassFilter(e.target.value)}
                    className="py-1.5 px-3 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Semua Kelas</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.label}>{c.label}</option>
                    ))}
                  </select>
                  {(bulkSearch || bulkClassFilter) && (
                    <button
                      type="button"
                      onClick={() => { setBulkSearch(''); setBulkClassFilter(''); }}
                      className="text-xs text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Reset
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between px-3 py-2 bg-neutral-50 border-b border-neutral-200">
                  <div className="text-sm text-neutral-700">
                    Preview target: {previewBillings.length} | Dipilih: {selectedBillingIds.length}
                  </div>
                  <button type="button" onClick={toggleSelectAll} className="text-sm text-primary-700 hover:text-primary-800 font-medium">
                    {allSelected ? 'Uncheck Semua' : 'Check Semua'}
                  </button>
                </div>

                <div className="overflow-auto max-h-[42vh]">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-100 border-b border-neutral-200 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left w-12">Pilih</th>
                        <th className="px-3 py-2 text-left">No Tagihan</th>
                        <th className="px-3 py-2 text-left">Siswa</th>
                        <th className="px-3 py-2 text-left">Periode</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-right">Nominal</th>
                        {bulkActionType === 'DISCOUNT' && (
                          <th className="px-3 py-2 text-left min-w-[180px]">Override Diskon Siswa</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {previewBillings.map((billing) => {
                        const isChecked = selectedBillingIds.includes(billing.id);
                        return (
                          <tr key={billing.id} className="hover:bg-neutral-50">
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleBillingSelection(billing.id)}
                              />
                            </td>
                            <td className="px-3 py-2 font-medium text-neutral-900">{billing.billNumber}</td>
                            <td className="px-3 py-2">
                              <div className="font-medium text-neutral-900">{billing.student.nama}</div>
                              <div className="text-xs text-neutral-600">{billing.student.nisn}</div>
                            </td>
                            <td className="px-3 py-2">{billing.month ? `${getMonthName(billing.month)} ${billing.year}` : billing.year}</td>
                            <td className="px-3 py-2">
                              <Badge variant={getStatusBadgeVariant(billing.status)}>{getStatusLabel(billing.status)}</Badge>
                            </td>
                            <td className="px-3 py-2 text-right">{formatCurrency(billing.totalAmount)}</td>
                            {bulkActionType === 'DISCOUNT' && (
                              <td className="px-3 py-2">
                                <CurrencyInput
                                  value={discountOverrides[billing.id] || ''}
                                  onValueChange={(discountAmount) => setDiscountOverrides((prev) => ({ ...prev, [billing.id]: discountAmount }))}
                                  disabled={!isChecked}
                                  placeholder="Kosong = default"
                                  className="rounded-md border border-neutral-300 px-2 py-1"
                                />
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-xs text-neutral-600">
                Untuk edit diskon satu siswa agar lebih besar, centang hanya baris siswa tersebut lalu isi Override Diskon Siswa.
              </p>
            </div>

            <div className="px-5 py-4 border-t border-neutral-200 flex flex-wrap justify-end gap-2">
              <Button variant="ghost" onClick={() => setBulkModalOpen(false)}>
                Tutup
              </Button>
              <Button variant="primary" isLoading={bulkLoading} onClick={submitBulkAction}>
                Submit Aksi Massal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
