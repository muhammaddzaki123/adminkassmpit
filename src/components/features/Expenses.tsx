'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Calendar, TrendingDown, CheckCircle, AlertCircle, X, DollarSign, TrendingUp, Filter, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  status: string;
  receipt?: string;
}

interface Stats {
  totalThisMonth: number;
  totalExpense: number;
  totalIncome: number;
  balance: number;
  largestCategory: {
    name: string;
    amount: number;
  };
  pendingCount: number;
}

interface FormData {
  date: string;
  category: string;
  description: string;
  amount: string;
}

export function Expenses() {
  const [showModal, setShowModal] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('this-month');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stats, setStats] = useState<Stats>({
    totalThisMonth: 0,
    totalExpense: 0,
    totalIncome: 0,
    balance: 0,
    largestCategory: { name: 'Belum Ada', amount: 0 },
    pendingCount: 0
  });

  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: ''
  });

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedPeriod !== 'all') params.append('period', selectedPeriod);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);

      // Fetch expenses
      const expensesRes = await fetch(`/api/expenses?${params.toString()}`);
      
      // Fetch income (SPP payments)
      const incomeRes = await fetch('/api/spp-payments?status=PAID');
      
      if (expensesRes.ok && incomeRes.ok) {
        const expensesData = await expensesRes.json();
        const incomeData = await incomeRes.json();
        
        if (expensesData.success && incomeData.success) {
          setExpenses(expensesData.data);
          calculateStats(expensesData.data, incomeData.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod, selectedCategory]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const calculateStats = (expensesData: Expense[], incomeData: { amount: number }[]) => {
    // Total pengeluaran bulan ini
    const now = new Date();
    const thisMonth = expensesData.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate.getMonth() === now.getMonth() && 
             expenseDate.getFullYear() === now.getFullYear() &&
             e.status === 'APPROVED';
    });
    const totalThisMonth = thisMonth.reduce((sum, e) => sum + e.amount, 0);

    // Total pengeluaran keseluruhan
    const totalExpense = expensesData
      .filter(e => e.status === 'APPROVED')
      .reduce((sum, e) => sum + e.amount, 0);

    // Total pemasukan dari SPP
    const totalIncome = incomeData.reduce((sum, payment) => sum + payment.amount, 0);

    // Saldo = Pemasukan - Pengeluaran
    const balance = totalIncome - totalExpense;

    // Kategori terbesar
    const categoryTotals: Record<string, number> = {};
    expensesData
      .filter(e => e.status === 'APPROVED')
      .forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
      });
    
    const largestCategoryEntry = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)[0];
    
    const largestCategory = largestCategoryEntry 
      ? { name: largestCategoryEntry[0], amount: largestCategoryEntry[1] }
      : { name: 'Belum Ada', amount: 0 };

    // Pending count
    const pendingCount = expensesData.filter(e => e.status === 'PENDING').length;

    setStats({
      totalThisMonth,
      totalExpense,
      totalIncome,
      balance,
      largestCategory,
      pendingCount
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.description || !formData.amount) {
      setMessage({ type: 'error', text: 'Semua field wajib diisi' });
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      setMessage({ type: 'error', text: 'Nominal harus lebih dari 0' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        date: new Date(formData.date).toISOString(),
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        status: 'APPROVED'
      };

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Pengeluaran berhasil disimpan!' });
        setTimeout(() => {
          setShowModal(false);
          setMessage(null);
          fetchExpenses();
          resetForm();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal menyimpan pengeluaran' });
      }
    } catch (error) {
      console.error('Error submitting expense:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat menyimpan pengeluaran' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      amount: ''
    });
  };

  const handleExportCSV = () => {
    const getCategoryLabel = (category: string) => {
      const labels: Record<string, string> = {
        'GAJI': 'Gaji Guru & Karyawan',
        'ATK': 'Alat Tulis Kantor',
        'UTILITAS': 'Listrik, Air, Internet',
        'PEMELIHARAAN': 'Pemeliharaan Gedung',
        'OPERASIONAL': 'Operasional Lainnya',
        'LAINNYA': 'Lain-lain'
      };
      return labels[category] || category;
    };

    const csvContent = [
      ['Laporan Pengeluaran Sekolah'],
      ['Tanggal Export:', new Date().toLocaleDateString('id-ID')],
      [''],
      ['Tanggal', 'Kategori', 'Keterangan', 'Nominal', 'Status'],
      ...expenses.map(exp => [
        new Date(exp.date).toLocaleDateString('id-ID'),
        getCategoryLabel(exp.category),
        exp.description,
        exp.amount,
        exp.status === 'APPROVED' ? 'Disetujui' : 'Pending'
      ]),
      [''],
      ['Total Pengeluaran', '', '', expenses.reduce((sum, exp) => sum + exp.amount, 0)]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pengeluaran_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'GAJI': 'Gaji Guru & Karyawan',
      'ATK': 'Alat Tulis Kantor',
      'UTILITAS': 'Listrik, Air, Internet',
      'PEMELIHARAAN': 'Pemeliharaan Gedung',
      'OPERASIONAL': 'Operasional Lainnya',
      'LAINNYA': 'Lain-lain'
    };
    return labels[category] || category;
  };

  const columns = [
    {
      key: 'date',
      label: 'Tanggal',
      width: '12%',
      render: (item: Expense) => (
        <div className="text-sm">
          <p className="font-medium text-neutral-900">
            {new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
          </p>
          <p className="text-xs text-neutral-500">
            {new Date(item.date).getFullYear()}
          </p>
        </div>
      )
    },
    { 
      key: 'category', 
      label: 'Kategori', 
      width: '15%',
      render: (item: Expense) => (
        <div className="text-sm">
          <Badge variant="default">{item.category}</Badge>
          <p className="text-xs text-neutral-500 mt-1">{getCategoryLabel(item.category)}</p>
        </div>
      )
    },
    { 
      key: 'description', 
      label: 'Keterangan', 
      width: '30%',
      render: (item: Expense) => (
        <p className="text-sm text-neutral-700 line-clamp-2">{item.description}</p>
      )
    },
    {
      key: 'amount',
      label: 'Nominal',
      width: '18%',
      render: (item: Expense) => (
        <p className="font-semibold text-red-600">
          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.amount)}
        </p>
      )
    },
    {
      key: 'status',
      label: 'Status',
      width: '12%',
      render: (item: Expense) => (
        <Badge variant={item.status === 'APPROVED' ? 'success' : 'warning'}>
          {item.status === 'APPROVED' ? 'Disetujui' : 'Pending'}
        </Badge>
      )
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-neutral-900 mb-2 text-3xl font-bold">Pengeluaran Sekolah</h1>
          <p className="text-neutral-600">Kelola dan catat semua pengeluaran operasional sekolah</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            icon={<Download className="w-5 h-5" />} 
            onClick={handleExportCSV}
            disabled={expenses.length === 0}
          >
            Export CSV
          </Button>
          <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={() => setShowModal(true)}>
            Tambah Pengeluaran
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
        <Card className="bg-linear-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Pengeluaran Bulan Ini</p>
              <p className="text-3xl font-bold">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.totalThisMonth)}
              </p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-8 h-8" />
            </div>
          </div>
        </Card>
        
        <Card className="bg-linear-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Kategori Terbesar</p>
              <p className="text-2xl font-bold">{stats.largestCategory.name}</p>
              <p className="text-xs opacity-80 mt-1">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.largestCategory.amount)}
              </p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </Card>
        
        <Card className="bg-linear-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Pending Approval</p>
              <p className="text-3xl font-bold">{stats.pendingCount}</p>
              <p className="text-xs opacity-80 mt-1">Item perlu verifikasi</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
          </div>
        </Card>
        
        <Card className={`bg-linear-to-br ${stats.balance >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Saldo Kas</p>
              <p className="text-3xl font-bold">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.balance)}
              </p>
              <p className="text-xs opacity-80 mt-1">
                Pemasukan: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, notation: 'compact' }).format(stats.totalIncome)}
              </p>
              <p className="text-xs opacity-80">
                Pengeluaran: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, notation: 'compact' }).format(stats.totalExpense)}
              </p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-8 h-8" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-neutral-600" />
            <span className="text-sm font-semibold text-neutral-700">Filter:</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              options={[
                { value: 'this-month', label: 'Bulan Ini' },
                { value: 'last-month', label: 'Bulan Lalu' },
                { value: 'this-year', label: 'Tahun Ini' },
                { value: 'all', label: 'Semua Periode' },
              ]}
              className="w-48"
            />
          </div>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={[
              { value: 'all', label: 'Semua Kategori' },
              { value: 'GAJI', label: 'Gaji Guru & Karyawan' },
              { value: 'ATK', label: 'Alat Tulis Kantor' },
              { value: 'UTILITAS', label: 'Listrik, Air, Internet' },
              { value: 'PEMELIHARAAN', label: 'Pemeliharaan Gedung' },
              { value: 'OPERASIONAL', label: 'Operasional Lainnya' },
              { value: 'LAINNYA', label: 'Lain-lain' },
            ]}
            className="w-56"
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        {expenses.length === 0 && !isLoading ? (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingDown className="w-10 h-10 text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Belum Ada Data Pengeluaran</h3>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">
              {selectedCategory !== 'all' || selectedPeriod !== 'this-month' 
                ? 'Tidak ada pengeluaran sesuai filter yang dipilih. Coba ubah filter atau periode waktu.'
                : 'Mulai catat pengeluaran sekolah dengan klik tombol "Tambah Pengeluaran" di atas.'
              }
            </p>
            {selectedCategory === 'all' && selectedPeriod === 'this-month' && (
              <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={() => setShowModal(true)}>
                Tambah Pengeluaran Pertama
              </Button>
            )}
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={expenses}
              isLoading={isLoading}
            />
            {expenses.length > 0 && (
              <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-neutral-600">
                    Menampilkan <span className="font-semibold text-neutral-900">{expenses.length}</span> pengeluaran
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-neutral-600 mb-1">Total Pengeluaran (Filter Aktif)</p>
                    <p className="text-2xl font-bold text-red-600">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
                        expenses.reduce((sum, exp) => sum + exp.amount, 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Input Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-neutral-900 text-xl font-bold">Tambah Pengeluaran</h3>
                  <p className="text-sm text-neutral-600">Catat pengeluaran operasional sekolah</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowModal(false); setMessage(null); resetForm(); }} 
                className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 p-2 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {message && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Tanggal"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
                <Select
                  label="Kategori"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  options={[
                    { value: '', label: 'Pilih Kategori' },
                    { value: 'GAJI', label: 'Gaji Guru & Karyawan' },
                    { value: 'ATK', label: 'Alat Tulis Kantor' },
                    { value: 'UTILITAS', label: 'Listrik, Air, Internet' },
                    { value: 'PEMELIHARAAN', label: 'Pemeliharaan Gedung' },
                    { value: 'OPERASIONAL', label: 'Operasional Lainnya' },
                    { value: 'LAINNYA', label: 'Lain-lain' },
                  ]}
                  required
                />
              </div>

              <TextArea
                label="Keterangan"
                placeholder="Deskripsi pengeluaran..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
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
                    placeholder="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="pl-12"
                    required
                    min="1"
                  />
                </div>
                {formData.amount && parseFloat(formData.amount) > 0 && (
                  <p className="text-xs text-neutral-600 mt-1">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseFloat(formData.amount))}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">Informasi Penting</p>
                    <p className="text-sm text-blue-700">
                      Pengeluaran akan otomatis disetujui dan langsung mengurangi saldo anggaran yang tersedia.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-200">
                <Button 
                  type="button" 
                  variant="outline" 
                  fullWidth 
                  onClick={() => { setShowModal(false); setMessage(null); resetForm(); }}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  fullWidth
                  disabled={isSubmitting}
                  icon={isSubmitting ? undefined : <CheckCircle className="w-5 h-5" />}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
