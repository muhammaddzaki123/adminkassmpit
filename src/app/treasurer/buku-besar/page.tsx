'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api-client';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select, TextArea } from '@/components/ui/Input';
import {
  AlertCircle,
  Download,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  Settings,
  X,
} from 'lucide-react';

type LedgerDirection = 'INCOME' | 'EXPENSE';

interface LedgerEntry {
  id: string;
  entryNumber: string;
  date: string;
  direction: LedgerDirection;
  source: string;
  category: string;
  description: string | null;
  amount: number;
  referenceNumber?: string | null;
  notes?: string | null;
  status: string;
  origin: 'SPP_PAYMENT' | 'EXPENSE' | 'MANUAL';
  student?: {
    nama: string;
    kelas: string;
    nisn: string;
  };
  paymentMethod?: string;
}

interface LedgerSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeBySource: Record<string, number>;
  expenseByCategory: Record<string, number>;
  incomeCount: number;
  expenseCount: number;
}

interface LedgerResponse {
  entries: LedgerEntry[];
  summary: LedgerSummary;
}

interface LedgerFormState {
  direction: LedgerDirection;
  source: string;
  category: string;
  description: string;
  amount: string;
  date: string;
  referenceNumber: string;
  notes: string;
}

interface ExpenseCategoryOption {
  id: string;
  name: string;
  isActive: boolean;
}

interface IncomeCategoryOption {
  id: string;
  name: string;
  isActive: boolean;
}

const incomeSourceOptions = [
  { value: 'BOS', label: 'BOS' },
  { value: 'SPP', label: 'SPP' },
  { value: 'DONASI', label: 'Donasi' },
  { value: 'HIBAH', label: 'Hibah' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

const expenseSourceOptions = [
  { value: 'KAS_SEKOLAH', label: 'Kas Sekolah' },
  { value: 'BOS', label: 'BOS' },
  { value: 'DANA_KEGIATAN', label: 'Dana Kegiatan' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

const defaultIncomeCategoryOptions = [
  { value: 'PENERIMAAN_BOS', label: 'Penerimaan BOS' },
  { value: 'SPP', label: 'SPP' },
  { value: 'DAFTAR_ULANG', label: 'Daftar Ulang' },
  { value: 'DONASI', label: 'Donasi' },
  { value: 'HIBAH', label: 'Hibah' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function escapeCsv(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function getMonthLabel(month: number) {
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  return months[month - 1] || 'Januari';
}

function getIncomeCategoryLabel(category: string) {
  const found = defaultIncomeCategoryOptions.find((item) => item.value === category);
  return found?.label || category;
}

function getDefaultFormState(): LedgerFormState {
  const today = new Date();
  return {
    direction: 'INCOME',
    source: 'BOS',
    category: 'PENERIMAAN_BOS',
    description: '',
    amount: '',
    date: today.toISOString().slice(0, 10),
    referenceNumber: '',
    notes: '',
  };
}

export default function BukuBesarPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [period, setPeriod] = useState('monthly');
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [incomeCategoryFilter, setIncomeCategoryFilter] = useState('all');
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryMessage, setCategoryMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<LedgerFormState>(getDefaultFormState);
  const [expenseCategoryOptions, setExpenseCategoryOptions] = useState<ExpenseCategoryOption[]>([]);
  const [newExpenseCategoryName, setNewExpenseCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [showExpenseCategoryManager, setShowExpenseCategoryManager] = useState(false);
  const [incomeCategoryOptions, setIncomeCategoryOptions] = useState<IncomeCategoryOption[]>([]);
  const [showIncomeCategoryModal, setShowIncomeCategoryModal] = useState(false);
  const [incomeCategoryMessage, setIncomeCategoryMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newIncomeCategoryName, setNewIncomeCategoryName] = useState('');
  const [editingIncomeCategoryId, setEditingIncomeCategoryId] = useState<string | null>(null);
  const [editingIncomeCategoryName, setEditingIncomeCategoryName] = useState('');

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
  }, [router]);

  const fetchLedger = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        period,
        month,
        year,
      });

      const response = await fetchWithAuth(`/api/ledger?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Gagal memuat buku besar: ${response.status}`);
      }

      const result = await response.json() as { success: boolean; data?: LedgerResponse; error?: string };
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Gagal memuat buku besar');
      }

      setEntries(result.data.entries || []);
    } catch (fetchError) {
      console.error('Error fetching ledger:', fetchError);
      setError('Gagal memuat buku besar. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [period, month, year]);

  const fetchExpenseCategories = async () => {
    try {
      const response = await fetchWithAuth('/api/expense-categories');
      if (!response.ok) return;

      const result = await response.json() as { success: boolean; data?: ExpenseCategoryOption[] };
      if (result.success && result.data) {
        setExpenseCategoryOptions(result.data);
      }
    } catch (fetchError) {
      console.error('Error fetching expense categories:', fetchError);
    }
  };

  useEffect(() => {
    void fetchLedger();
  }, [fetchLedger]);

  useEffect(() => {
    void fetchExpenseCategories();
  }, []);

  const fetchIncomeCategories = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/income-categories');
      if (!response.ok) return;

      const result = await response.json() as { success: boolean; data?: IncomeCategoryOption[] };
      if (result.success && result.data) {
        setIncomeCategoryOptions(result.data);
      }
    } catch (fetchError) {
      console.error('Error fetching income categories:', fetchError);
    }
  }, []);

  useEffect(() => {
    void fetchIncomeCategories();
  }, [fetchIncomeCategories]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesDirection =
        directionFilter === 'all' ||
        (directionFilter === 'income' && entry.direction === 'INCOME') ||
        (directionFilter === 'expense' && entry.direction === 'EXPENSE');

      const haystack = [
        entry.entryNumber,
        entry.source,
        entry.category,
        entry.description,
        entry.referenceNumber || '',
        entry.notes || '',
        entry.student?.nama || '',
        entry.student?.kelas || '',
        entry.student?.nisn || '',
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = searchQuery.trim() === '' || haystack.includes(searchQuery.toLowerCase());

      const matchesIncomeCategory =
        incomeCategoryFilter === 'all' ||
        (entry.direction === 'INCOME' && entry.category === incomeCategoryFilter);
      return matchesDirection && matchesIncomeCategory && matchesSearch;
    });
  }, [entries, directionFilter, incomeCategoryFilter, searchQuery]);

  const incomeCategoryFilterOptions = useMemo(() => {
    const values = new Set<string>([
      ...defaultIncomeCategoryOptions.map((item) => item.value),
      ...incomeCategoryOptions.map((item) => item.name),
    ]);
    entries
      .filter((entry) => entry.direction === 'INCOME')
      .forEach((entry) => values.add(entry.category));

    return [
      { value: 'all', label: 'Semua Kategori Pemasukan' },
      ...Array.from(values).map((value) => ({ value, label: getIncomeCategoryLabel(value) })),
    ];
  }, [entries, incomeCategoryOptions]);

  const handleDirectionFilterChange = (value: string) => {
    setDirectionFilter(value);
    if (value !== 'all' && value !== 'income') {
      setIncomeCategoryFilter('all');
    }
  };

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    const incomeBySource: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};

    filteredEntries.forEach((entry) => {
      if (entry.direction === 'INCOME') {
        income += entry.amount;
        incomeBySource[entry.source] = (incomeBySource[entry.source] || 0) + entry.amount;
      } else {
        expense += entry.amount;
        expenseByCategory[entry.category] = (expenseByCategory[entry.category] || 0) + entry.amount;
      }
    });

    return {
      income,
      expense,
      balance: income - expense,
      incomeBySource,
      expenseByCategory,
      incomeCount: filteredEntries.filter((entry) => entry.direction === 'INCOME').length,
      expenseCount: filteredEntries.filter((entry) => entry.direction === 'EXPENSE').length,
    };
  }, [filteredEntries]);

  const visibleEntries = useMemo(() => {
    let runningBalance = 0;
    return filteredEntries.map((entry) => {
      runningBalance += entry.direction === 'INCOME' ? entry.amount : -entry.amount;
      return {
        ...entry,
        runningBalance,
      };
    });
  }, [filteredEntries]);

  const handleRefresh = async () => {
    await fetchLedger();
  };

  const handleFormChange = (field: keyof LedgerFormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleDirectionChange = (value: LedgerDirection) => {
    const nextSource = value === 'INCOME' ? incomeSourceOptions[0].value : expenseSourceOptions[0].value;
    const nextCategory = value === 'INCOME'
      ? (incomeCategoryOptions[0]?.name || defaultIncomeCategoryOptions[0].value)
      : (expenseCategoryOptions[0]?.name || 'LAINNYA');

    setForm((current) => ({
      ...current,
      direction: value,
      source: nextSource,
      category: nextCategory,
    }));

    if (value !== 'EXPENSE') {
      setShowExpenseCategoryManager(false);
    }
  };

  const handleCreateEntry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);

      const response = await fetchWithAuth('/api/ledger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const result = await response.json() as { success: boolean; error?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal menyimpan transaksi');
      }

      setForm(getDefaultFormState());
      await fetchLedger();
      await fetchExpenseCategories();
    } catch (submitError) {
      console.error('Error creating ledger entry:', submitError);
      setError('Gagal menyimpan transaksi buku besar. Periksa kembali datanya.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const rows = [
      [
        'Tanggal',
        'Nomor',
        'Arah',
        'Sumber',
        'Kategori',
        'Deskripsi',
        'Referensi',
        'Masuk',
        'Keluar',
        'Saldo Berjalan',
        'Catatan',
      ],
    ];

    let runningBalance = 0;

    visibleEntries.forEach((entry) => {
      runningBalance += entry.direction === 'INCOME' ? entry.amount : -entry.amount;
      rows.push([
        escapeCsv(formatDate(entry.date)),
        escapeCsv(entry.entryNumber),
        escapeCsv(entry.direction === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'),
        escapeCsv(entry.source),
        escapeCsv(entry.category),
        escapeCsv(entry.description || '-'),
        escapeCsv(entry.referenceNumber || '-'),
        escapeCsv(entry.direction === 'INCOME' ? entry.amount : ''),
        escapeCsv(entry.direction === 'EXPENSE' ? entry.amount : ''),
        escapeCsv(runningBalance),
        escapeCsv(entry.notes || '-'),
      ]);
    });

    rows.push([
      escapeCsv('TOTAL'),
      escapeCsv('-'),
      escapeCsv('-'),
      escapeCsv('-'),
      escapeCsv('-'),
      escapeCsv('-'),
      escapeCsv('-'),
      escapeCsv(summary.income),
      escapeCsv(summary.expense),
      escapeCsv(summary.balance),
      escapeCsv('-'),
    ]);

    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `buku_besar_${year}_${month}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const sourceOptions = form.direction === 'INCOME' ? incomeSourceOptions : expenseSourceOptions;
  const incomeFormCategoryOptions = useMemo(() => {
    const values = new Set<string>([
      ...defaultIncomeCategoryOptions.map((item) => item.value),
      ...incomeCategoryOptions.map((item) => item.name),
    ]);

    return Array.from(values).map((value) => ({ value, label: getIncomeCategoryLabel(value) }));
  }, [incomeCategoryOptions]);

  const categoryOptions = form.direction === 'INCOME'
    ? incomeFormCategoryOptions
    : expenseCategoryOptions.map((item) => ({ value: item.name, label: item.name }));

  const handleAddIncomeCategory = async () => {
    const name = newIncomeCategoryName.trim();
    if (!name) {
      setIncomeCategoryMessage({ type: 'error', text: 'Nama kategori tidak boleh kosong' });
      return;
    }

    try {
      const response = await fetchWithAuth('/api/income-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const result = await response.json() as { success: boolean; error?: string };
      if (!response.ok || !result.success) {
        setIncomeCategoryMessage({ type: 'error', text: result.error || 'Gagal menambah kategori pemasukan' });
        return;
      }

      setIncomeCategoryMessage({ type: 'success', text: 'Kategori pemasukan berhasil ditambahkan' });
      setNewIncomeCategoryName('');
      setForm((prev) => ({ ...prev, category: name }));
      await fetchIncomeCategories();
    } catch (createError) {
      console.error('Error creating income category:', createError);
      setIncomeCategoryMessage({ type: 'error', text: 'Terjadi kesalahan saat menambah kategori pemasukan' });
    }
  };

  const handleSaveIncomeCategory = async () => {
    const id = editingIncomeCategoryId;
    const name = editingIncomeCategoryName.trim();
    if (!id || !name) {
      setIncomeCategoryMessage({ type: 'error', text: 'Nama kategori tidak boleh kosong' });
      return;
    }

    const previousName = incomeCategoryOptions.find((item) => item.id === id)?.name;

    try {
      const response = await fetchWithAuth('/api/income-categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name }),
      });
      const result = await response.json() as { success: boolean; error?: string };
      if (!response.ok || !result.success) {
        setIncomeCategoryMessage({ type: 'error', text: result.error || 'Gagal mengubah kategori pemasukan' });
        return;
      }

      setEditingIncomeCategoryId(null);
      setEditingIncomeCategoryName('');
      setIncomeCategoryMessage({ type: 'success', text: 'Kategori pemasukan berhasil diubah' });
      setForm((prev) => ({
        ...prev,
        category: prev.category === previousName ? name : prev.category,
      }));
      await fetchIncomeCategories();
      await fetchLedger();
    } catch (updateError) {
      console.error('Error updating income category:', updateError);
      setIncomeCategoryMessage({ type: 'error', text: 'Terjadi kesalahan saat mengubah kategori pemasukan' });
    }
  };

  const handleDeleteIncomeCategory = async (id: string) => {
    try {
      const response = await fetchWithAuth(`/api/income-categories?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const result = await response.json() as { success: boolean; error?: string };
      if (!response.ok || !result.success) {
        setIncomeCategoryMessage({ type: 'error', text: result.error || 'Gagal menghapus kategori pemasukan' });
        return;
      }

      setIncomeCategoryMessage({ type: 'success', text: 'Kategori pemasukan berhasil dihapus' });
      await fetchIncomeCategories();
    } catch (deleteError) {
      console.error('Error deleting income category:', deleteError);
      setIncomeCategoryMessage({ type: 'error', text: 'Terjadi kesalahan saat menghapus kategori pemasukan' });
    }
  };

  const handleAddExpenseCategory = async () => {
    const name = newExpenseCategoryName.trim();
    if (!name) {
      setShowExpenseCategoryManager(true);
      setCategoryMessage('Nama kategori tidak boleh kosong');
      return;
    }

    try {
      const response = await fetchWithAuth('/api/expense-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const result = await response.json() as { success: boolean; error?: string };
      if (!response.ok || !result.success) {
        setShowExpenseCategoryManager(true);
        setCategoryMessage(result.error || 'Gagal menambah kategori');
        return;
      }

      setCategoryMessage('Kategori berhasil ditambahkan');
      setNewExpenseCategoryName('');
      setForm((prev) => ({ ...prev, category: name }));
      await fetchExpenseCategories();
    } catch (createError) {
      console.error('Error creating expense category:', createError);
      setShowExpenseCategoryManager(true);
      setCategoryMessage('Terjadi kesalahan saat menambah kategori');
    }
  };

  const handleSaveExpenseCategory = async () => {
    const id = editingCategoryId;
    const name = editingCategoryName.trim();
    if (!id || !name) {
      setShowExpenseCategoryManager(true);
      setCategoryMessage('Nama kategori tidak boleh kosong');
      return;
    }

    const previousName = expenseCategoryOptions.find((item) => item.id === id)?.name;

    try {
      const response = await fetchWithAuth('/api/expense-categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name }),
      });
      const result = await response.json() as { success: boolean; error?: string };
      if (!response.ok || !result.success) {
        setShowExpenseCategoryManager(true);
        setCategoryMessage(result.error || 'Gagal mengubah kategori');
        return;
      }

      setEditingCategoryId(null);
      setEditingCategoryName('');
      setCategoryMessage('Kategori berhasil diubah');
      setForm((prev) => ({
        ...prev,
        category: prev.category === previousName ? name : prev.category,
      }));
      await fetchExpenseCategories();
      await fetchLedger();
    } catch (updateError) {
      console.error('Error updating expense category:', updateError);
      setShowExpenseCategoryManager(true);
      setCategoryMessage('Terjadi kesalahan saat mengubah kategori');
    }
  };

  const handleDeleteExpenseCategory = async (id: string) => {
    try {
      const response = await fetchWithAuth(`/api/expense-categories?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const result = await response.json() as { success: boolean; error?: string };
      if (!response.ok || !result.success) {
        setCategoryMessage(result.error || 'Gagal menghapus kategori');
        return;
      }

      setCategoryMessage('Kategori berhasil dihapus');
      await fetchExpenseCategories();
    } catch (deleteError) {
      console.error('Error deleting expense category:', deleteError);
      setCategoryMessage('Terjadi kesalahan saat menghapus kategori');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
          <p className="mt-4 text-neutral-600">Memuat buku besar...</p>
        </div>
      </div>
    );
  }

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
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 mb-3">
                  <Landmark className="w-4 h-4" />
                  Buku Kas Bendahara
                </div>
                <h1 className="text-3xl font-bold text-neutral-900">Buku Besar</h1>
                <p className="text-neutral-600 mt-1">
                  Kelola pemasukan SPP, BOS, donasi, dan pengeluaran sekolah dalam satu tampilan.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  icon={<RefreshCw className="w-4 h-4" />}
                  onClick={handleRefresh}
                >
                  Muat Ulang
                </Button>
                <Button
                  icon={<Download className="w-4 h-4" />}
                  onClick={handleExportCSV}
                >
                  Export CSV
                </Button>
              </div>
            </div>

            {error && (
              <Card className="border-2 border-red-500 bg-red-50">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-linear-to-br from-emerald-500 to-emerald-600 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm opacity-90">Total Pemasukan</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(summary.income)}</p>
                    <p className="text-xs opacity-80 mt-2">{summary.incomeCount} transaksi</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <ArrowUpRight className="w-6 h-6" />
                  </div>
                </div>
              </Card>

              <Card className="bg-linear-to-br from-rose-500 to-rose-600 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm opacity-90">Total Pengeluaran</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(summary.expense)}</p>
                    <p className="text-xs opacity-80 mt-2">{summary.expenseCount} transaksi</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <ArrowDownRight className="w-6 h-6" />
                  </div>
                </div>
              </Card>

              <Card className="bg-linear-to-br from-sky-500 to-sky-600 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm opacity-90">Saldo Bersih</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(summary.balance)}</p>
                    <p className="text-xs opacity-80 mt-2">Pemasukan dikurangi pengeluaran</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Wallet className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            </div>

            <Card>
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900">Input Transaksi Kas</h2>
                    <p className="text-sm text-neutral-600 mt-1">
                      Catat pemasukan BOS, donasi, atau pengeluaran sekolah secara manual.
                    </p>
                  </div>
                  <Badge variant={form.direction === 'INCOME' ? 'success' : 'error'}>
                    {form.direction === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                  </Badge>
                </div>

                <form className="space-y-4" onSubmit={handleCreateEntry}>
                  <Select
                    label="Arah Transaksi *"
                    value={form.direction}
                    onChange={(event) => handleDirectionChange(event.target.value as LedgerDirection)}
                    options={[
                      { value: 'INCOME', label: 'Pemasukan' },
                      { value: 'EXPENSE', label: 'Pengeluaran' },
                    ]}
                  />

                  {form.direction === 'INCOME' ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                          label="Sumber *"
                          value={form.source}
                          onChange={(event) => handleFormChange('source', event.target.value)}
                          options={sourceOptions}
                        />

                        <div className="space-y-2">
                          <Select
                            label="Kategori *"
                            value={form.category}
                            onChange={(event) => handleFormChange('category', event.target.value)}
                            options={categoryOptions}
                          />
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              icon={<Settings className="w-4 h-4" />}
                              onClick={() => {
                                setShowIncomeCategoryModal(true);
                                setIncomeCategoryMessage(null);
                              }}
                            >
                              Kelola Kategori Pemasukan
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Nominal *"
                          type="number"
                          min="1"
                          step="1"
                          placeholder="Masukkan nominal"
                          value={form.amount}
                          onChange={(event) => handleFormChange('amount', event.target.value)}
                        />

                        <Input
                          label="Tanggal *"
                          type="date"
                          value={form.date}
                          onChange={(event) => handleFormChange('date', event.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Referensi"
                          placeholder="Nomor bukti / transfer / kwitansi"
                          value={form.referenceNumber}
                          onChange={(event) => handleFormChange('referenceNumber', event.target.value)}
                        />

                        <Input
                          label="Keterangan"
                          placeholder="Contoh: Penerimaan BOS tahap 1"
                          value={form.description}
                          onChange={(event) => handleFormChange('description', event.target.value)}
                        />
                      </div>

                      <TextArea
                        label="Catatan"
                        rows={4}
                        placeholder="Catatan tambahan untuk audit atau penjelasan transaksi"
                        value={form.notes}
                        onChange={(event) => handleFormChange('notes', event.target.value)}
                      />
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Tanggal *"
                          type="date"
                          value={form.date}
                          onChange={(event) => handleFormChange('date', event.target.value)}
                          required
                        />

                        <div>
                          <Input
                            label="Kategori *"
                            list="ledger-expense-categories"
                            value={form.category}
                            onChange={(event) => handleFormChange('category', event.target.value)}
                            placeholder="Pilih atau ketik kategori"
                            required
                          />
                          <datalist id="ledger-expense-categories">
                            {expenseCategoryOptions.map((item) => (
                              <option key={item.id} value={item.name} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                      <TextArea
                        label="Keterangan"
                        rows={3}
                        placeholder="Deskripsi pengeluaran (opsional)"
                        value={form.description}
                        onChange={(event) => handleFormChange('description', event.target.value)}
                      />

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Nominal <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">
                            Rp
                          </span>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="0"
                            value={form.amount}
                            onChange={(event) => handleFormChange('amount', event.target.value)}
                            className="pl-12"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowExpenseCategoryManager((prev) => !prev)}
                        >
                          {showExpenseCategoryManager ? 'Tutup Kelola Kategori' : 'Kelola Kategori Pengeluaran'}
                        </Button>
                      </div>

                      {showExpenseCategoryManager && (
                      <div className="rounded-lg border border-neutral-200 p-3 space-y-3">
                        <p className="text-sm font-medium text-neutral-700">Kelola Kategori Pengeluaran</p>
                        {categoryMessage && <p className="text-xs text-neutral-600">{categoryMessage}</p>}

                        <div className="flex gap-2">
                          <Input
                            value={newExpenseCategoryName}
                            onChange={(event) => setNewExpenseCategoryName(event.target.value)}
                            placeholder="Tambah kategori baru"
                          />
                          <Button type="button" variant="outline" onClick={handleAddExpenseCategory}>
                            Tambah
                          </Button>
                        </div>

                        <div className="max-h-36 overflow-auto space-y-2">
                          {expenseCategoryOptions.map((item) => (
                            <div key={item.id} className="flex items-center gap-2">
                              {editingCategoryId === item.id ? (
                                <>
                                  <Input
                                    value={editingCategoryName}
                                    onChange={(event) => setEditingCategoryName(event.target.value)}
                                  />
                                  <Button type="button" variant="outline" onClick={handleSaveExpenseCategory}>Simpan</Button>
                                  <Button type="button" variant="ghost" onClick={() => setEditingCategoryId(null)}>Batal</Button>
                                </>
                              ) : (
                                <>
                                  <div className="flex-1 text-sm text-neutral-700">{item.name}</div>
                                  <Button type="button" variant="ghost" onClick={() => {
                                    setEditingCategoryId(item.id);
                                    setEditingCategoryName(item.name);
                                  }}>
                                    Edit
                                  </Button>
                                  <Button type="button" variant="ghost" onClick={() => handleDeleteExpenseCategory(item.id)}>
                                    Hapus
                                  </Button>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      )}
                    </>
                  )}

                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    icon={<Plus className="w-4 h-4" />}
                    fullWidth
                  >
                    Simpan Transaksi
                  </Button>
                </form>
            </Card>

            <Card>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Filter Buku Besar</h2>
                  <p className="text-sm text-neutral-600 mt-1">Pilih periode dan arah transaksi yang ingin dilihat.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Filter className="w-4 h-4" />
                  {visibleEntries.length} transaksi ditemukan
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Select
                  label="Periode"
                  value={period}
                  onChange={(event) => setPeriod(event.target.value)}
                  options={[
                    { value: 'monthly', label: 'Bulanan' },
                    { value: 'yearly', label: 'Tahunan' },
                    { value: 'all', label: 'Semua' },
                  ]}
                />

                {period === 'monthly' ? (
                  <Select
                    label="Bulan"
                    value={month}
                    onChange={(event) => setMonth(event.target.value)}
                    options={[
                      { value: '1', label: 'Januari' },
                      { value: '2', label: 'Februari' },
                      { value: '3', label: 'Maret' },
                      { value: '4', label: 'April' },
                      { value: '5', label: 'Mei' },
                      { value: '6', label: 'Juni' },
                      { value: '7', label: 'Juli' },
                      { value: '8', label: 'Agustus' },
                      { value: '9', label: 'September' },
                      { value: '10', label: 'Oktober' },
                      { value: '11', label: 'November' },
                      { value: '12', label: 'Desember' },
                    ]}
                  />
                ) : (
                  <div />
                )}

                <Select
                  label="Tahun"
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  options={[
                    { value: '2024', label: '2024' },
                    { value: '2025', label: '2025' },
                    { value: '2026', label: '2026' },
                    { value: '2027', label: '2027' },
                  ]}
                />

                <Select
                  label="Jenis"
                  value={directionFilter}
                  onChange={(event) => handleDirectionFilterChange(event.target.value)}
                  options={[
                    { value: 'all', label: 'Semua' },
                    { value: 'income', label: 'Pemasukan' },
                    { value: 'expense', label: 'Pengeluaran' },
                  ]}
                />

                <Select
                  label="Kategori Pemasukan"
                  value={incomeCategoryFilter}
                  onChange={(event) => {
                    const value = event.target.value;
                    setIncomeCategoryFilter(value);
                    if (value !== 'all' && directionFilter !== 'income') {
                      setDirectionFilter('income');
                    }
                  }}
                  options={incomeCategoryFilterOptions}
                />
              </div>

              <div className="mt-4">
                <Input
                  placeholder="Cari nomor transaksi, sumber, kategori, deskripsi, atau nama siswa..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
            </Card>

            <Card>
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Daftar Buku Besar</h2>
                  <p className="text-sm text-neutral-600 mt-1">
                    Pemasukan, pengeluaran, dan kas manual tampil berurutan sesuai tanggal.
                  </p>
                </div>
                <Badge variant="info">{getMonthLabel(Number(month))} {year}</Badge>
              </div>

              {visibleEntries.length === 0 ? (
                <div className="text-center py-16">
                  <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">Tidak ada transaksi untuk periode ini.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left p-4 text-sm font-semibold text-neutral-700">Tanggal</th>
                        <th className="text-left p-4 text-sm font-semibold text-neutral-700">Nomor</th>
                        <th className="text-left p-4 text-sm font-semibold text-neutral-700">Sumber</th>
                        <th className="text-left p-4 text-sm font-semibold text-neutral-700">Keterangan</th>
                        <th className="text-right p-4 text-sm font-semibold text-neutral-700">Masuk</th>
                        <th className="text-right p-4 text-sm font-semibold text-neutral-700">Keluar</th>
                        <th className="text-right p-4 text-sm font-semibold text-neutral-700">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleEntries.map((entry) => (
                        <tr key={entry.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                          <td className="p-4 text-sm text-neutral-900">
                            {formatDate(entry.date)}
                          </td>
                          <td className="p-4 text-sm text-neutral-900">
                            <p className="font-medium">{entry.entryNumber}</p>
                            <p className="text-xs text-neutral-500">{entry.origin === 'SPP_PAYMENT' ? 'SPP' : entry.origin === 'EXPENSE' ? 'Pengeluaran' : 'Manual'}</p>
                          </td>
                          <td className="p-4 text-sm text-neutral-900">
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                <Badge variant={entry.direction === 'INCOME' ? 'success' : 'error'}>
                                  {entry.direction === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                                </Badge>
                                <Badge variant="default">{entry.source}</Badge>
                              </div>
                              {entry.student && (
                                <div className="text-xs text-neutral-500">
                                  <p className="font-medium text-neutral-700">{entry.student.nama}</p>
                                  <p>{entry.student.kelas} · {entry.student.nisn}</p>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-neutral-900">
                            <p className="font-medium">{entry.category}</p>
                            <p className="text-xs text-neutral-500">{entry.description || '-'}</p>
                            {entry.referenceNumber && (
                              <p className="text-xs text-neutral-500 mt-1">Ref: {entry.referenceNumber}</p>
                            )}
                          </td>
                          <td className="p-4 text-sm text-right text-emerald-600 font-semibold">
                            {entry.direction === 'INCOME' ? formatCurrency(entry.amount) : '-'}
                          </td>
                          <td className="p-4 text-sm text-right text-rose-600 font-semibold">
                            {entry.direction === 'EXPENSE' ? formatCurrency(entry.amount) : '-'}
                          </td>
                          <td className="p-4 text-sm text-right font-bold text-neutral-900">
                            {formatCurrency(entry.runningBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">Pemasukan Terbesar</h3>
                    <p className="text-sm text-neutral-600">Ringkasan berdasarkan sumber dana.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.keys(summary.incomeBySource).length === 0 ? (
                    <p className="text-sm text-neutral-500">Belum ada pemasukan pada periode ini.</p>
                  ) : (
                    Object.entries(summary.incomeBySource)
                      .sort((left, right) => right[1] - left[1])
                      .map(([source, amount]) => (
                        <div key={source} className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3">
                          <div>
                            <p className="font-medium text-neutral-900">{source}</p>
                            <p className="text-xs text-neutral-500">Sumber pemasukan</p>
                          </div>
                          <p className="font-semibold text-emerald-600">{formatCurrency(amount)}</p>
                        </div>
                      ))
                  )}
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">Pengeluaran Terbesar</h3>
                    <p className="text-sm text-neutral-600">Ringkasan berdasarkan kategori pengeluaran.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.keys(summary.expenseByCategory).length === 0 ? (
                    <p className="text-sm text-neutral-500">Belum ada pengeluaran pada periode ini.</p>
                  ) : (
                    Object.entries(summary.expenseByCategory)
                      .sort((left, right) => right[1] - left[1])
                      .map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3">
                          <div>
                            <p className="font-medium text-neutral-900">{category}</p>
                            <p className="text-xs text-neutral-500">Kategori pengeluaran</p>
                          </div>
                          <p className="font-semibold text-rose-600">{formatCurrency(amount)}</p>
                        </div>
                      ))
                  )}
                </div>
              </Card>
            </div>

            {showIncomeCategoryModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900">Kelola Kategori Pemasukan</h3>
                      <p className="text-sm text-neutral-600">Tambah, ubah, atau hapus kategori pemasukan.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowIncomeCategoryModal(false);
                        setIncomeCategoryMessage(null);
                        setEditingIncomeCategoryId(null);
                        setEditingIncomeCategoryName('');
                      }}
                      className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 p-2 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {incomeCategoryMessage && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${incomeCategoryMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {incomeCategoryMessage.text}
                    </div>
                  )}

                  <div className="flex gap-2 mb-4">
                    <Input
                      value={newIncomeCategoryName}
                      onChange={(event) => setNewIncomeCategoryName(event.target.value)}
                      placeholder="Tambah kategori pemasukan baru"
                    />
                    <Button type="button" variant="outline" onClick={handleAddIncomeCategory}>
                      Tambah
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-auto">
                    {incomeCategoryOptions.length === 0 ? (
                      <p className="text-sm text-neutral-500">Belum ada kategori pemasukan khusus.</p>
                    ) : (
                      incomeCategoryOptions.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 rounded-lg border border-neutral-200 p-2">
                          {editingIncomeCategoryId === item.id ? (
                            <>
                              <Input
                                value={editingIncomeCategoryName}
                                onChange={(event) => setEditingIncomeCategoryName(event.target.value)}
                              />
                              <Button type="button" variant="outline" onClick={handleSaveIncomeCategory}>Simpan</Button>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                  setEditingIncomeCategoryId(null);
                                  setEditingIncomeCategoryName('');
                                }}
                              >
                                Batal
                              </Button>
                            </>
                          ) : (
                            <>
                              <div className="flex-1 text-sm text-neutral-700">{item.name}</div>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                  setEditingIncomeCategoryId(item.id);
                                  setEditingIncomeCategoryName(item.name);
                                }}
                              >
                                Edit
                              </Button>
                              <Button type="button" variant="ghost" onClick={() => handleDeleteIncomeCategory(item.id)}>
                                Hapus
                              </Button>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}