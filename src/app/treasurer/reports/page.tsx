'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { FileText, Download, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface ReportData {
  income: {
    total: number;
    byType: Record<string, number>;
  };
  expense: {
    total: number;
    byCategory: Record<string, number>;
  };
  balance: number;
}

interface PaymentItem {
  paymentType?: string;
  amount: number;
  paidAt?: string;
}

interface ExpenseItem {
  category?: string;
  amount: number;
  date?: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [reportType, setReportType] = useState('monthly');
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [reportData, setReportData] = useState<ReportData>({
    income: { total: 0, byType: {} },
    expense: { total: 0, byCategory: {} },
    balance: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const filterDataByPeriod = useCallback((data: PaymentItem[] | ExpenseItem[], dateField: 'paidAt' | 'date'): (PaymentItem | ExpenseItem)[] => {
    if (!data || data.length === 0) return [];

    const selectedYear = parseInt(year);
    const selectedMonth = parseInt(month);

    return data.filter((item) => {
      const dateValue = (dateField === 'paidAt' && 'paidAt' in item) ? item.paidAt : (dateField === 'date' && 'date' in item) ? item.date : undefined;
      if (!dateValue) return false;
      
      const itemDate = new Date(dateValue);
      
      if (reportType === 'monthly') {
        return itemDate.getMonth() + 1 === selectedMonth && 
               itemDate.getFullYear() === selectedYear;
      } else if (reportType === 'yearly') {
        return itemDate.getFullYear() === selectedYear;
      }
      return true;
    });
  }, [reportType, month, year]);

  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch income data (SPP Payments)
      const incomeResponse = await fetch('/api/spp-payments?status=PAID');
      if (!incomeResponse.ok) {
        throw new Error(`Failed to fetch income data: ${incomeResponse.status}`);
      }
      if (!incomeResponse.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Expected JSON from income API');
      }
      const incomeData = await incomeResponse.json();
      
      // Fetch expense data
      const expenseResponse = await fetch('/api/expenses?status=APPROVED');
      if (!expenseResponse.ok) {
        throw new Error(`Failed to fetch expense data: ${expenseResponse.status}`);
      }
      if (!expenseResponse.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Expected JSON from expense API');
      }
      const expenseData = await expenseResponse.json();

      if (incomeData.success && expenseData.success) {
        const filteredIncome = filterDataByPeriod(incomeData.data as PaymentItem[], 'paidAt') as PaymentItem[];
        const filteredExpense = filterDataByPeriod(expenseData.data as ExpenseItem[], 'date') as ExpenseItem[];

        // Calculate income by type
        const incomeByType: Record<string, number> = {};
        let totalIncome = 0;
        filteredIncome.forEach((payment) => {
          const type = payment.paymentType || 'LAINNYA';
          incomeByType[type] = (incomeByType[type] || 0) + payment.amount;
          totalIncome += payment.amount;
        });

        // Calculate expense by category
        const expenseByCategory: Record<string, number> = {};
        let totalExpense = 0;
        filteredExpense.forEach((expense) => {
          const category = expense.category || 'LAINNYA';
          expenseByCategory[category] = (expenseByCategory[category] || 0) + expense.amount;
          totalExpense += expense.amount;
        });

        setReportData({
          income: { total: totalIncome, byType: incomeByType },
          expense: { total: totalExpense, byCategory: expenseByCategory },
          balance: totalIncome - totalExpense
        });
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      setError('Gagal memuat data laporan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [filterDataByPeriod]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleExportPDF = () => {
    // Generate CSV for now (can be upgraded to PDF later)
    const getMonthName = (monthNum: number) => {
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return months[monthNum - 1];
    };

    const csv = [
      ['Laporan Keuangan'],
      ['Periode:', reportType === 'monthly' ? `${getMonthName(parseInt(month))} ${year}` : `Tahun ${year}`],
      [''],
      ['PEMASUKAN'],
      ['Kategori', 'Jumlah'],
      ...Object.entries(reportData.income.byType).map(([type, amount]) => [type, amount]),
      ['Total Pemasukan', reportData.income.total],
      [''],
      ['PENGELUARAN'],
      ['Kategori', 'Jumlah'],
      ...Object.entries(reportData.expense.byCategory).map(([category, amount]) => [category, amount]),
      ['Total Pengeluaran', reportData.expense.total],
      [''],
      ['SALDO', reportData.balance]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan_keuangan_${year}_${month}.csv`;
    a.click();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'SPP': 'Pembayaran SPP',
      'DAFTAR_ULANG': 'Daftar Ulang',
      'LAINNYA': 'Lainnya'
    };
    return labels[type] || type;
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
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Laporan Keuangan</h1>
                <p className="text-neutral-600 mt-1">Lihat dan unduh laporan keuangan</p>
              </div>
              <Button 
                icon={<Download className="w-4 h-4" />}
                onClick={handleExportPDF}
              >
                Export CSV
              </Button>
            </div>

            {error && (
              <Card className="border-2 border-red-500 bg-red-50">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </Card>
            )}

            <Card>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Jenis Laporan</label>
                  <Select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    options={[
                      { value: 'monthly', label: 'Bulanan' },
                      { value: 'yearly', label: 'Tahunan' },
                    ]}
                  />
                </div>
                {reportType === 'monthly' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Bulan</label>
                    <Select
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
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
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Tahun</label>
                  <Select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    options={[
                      { value: '2023', label: '2023' },
                      { value: '2024', label: '2024' },
                      { value: '2025', label: '2025' },
                      { value: '2026', label: '2026' },
                    ]}
                  />
                </div>
              </div>
            </Card>

            {isLoading ? (
              <Card>
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="mt-4 text-neutral-600">Memuat data laporan...</p>
                </div>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-linear-to-br from-green-500 to-green-600 text-white">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/20 rounded-lg">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm opacity-90">Total Pemasukan</p>
                        <p className="text-2xl font-bold">{formatCurrency(reportData.income.total)}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="bg-linear-to-br from-red-500 to-red-600 text-white">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/20 rounded-lg">
                        <TrendingDown className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm opacity-90">Total Pengeluaran</p>
                        <p className="text-2xl font-bold">{formatCurrency(reportData.expense.total)}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className={`bg-linear-to-br ${reportData.balance >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} text-white`}>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/20 rounded-lg">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm opacity-90">Saldo</p>
                        <p className="text-2xl font-bold">{formatCurrency(reportData.balance)}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card>
                  <h2 className="text-xl font-semibold text-neutral-900 mb-4">Rincian Pemasukan</h2>
                  {Object.keys(reportData.income.byType).length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                      <p>Tidak ada data pemasukan untuk periode ini</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(reportData.income.byType)
                        .sort(([, a], [, b]) => b - a)
                        .map(([type, amount]) => (
                          <div key={type} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                            <div>
                              <p className="font-medium text-neutral-900">{type}</p>
                              <p className="text-sm text-neutral-600">{getPaymentTypeLabel(type)}</p>
                            </div>
                            <p className="font-semibold text-green-600">{formatCurrency(amount)}</p>
                          </div>
                        ))}
                    </div>
                  )}
                </Card>

                <Card>
                  <h2 className="text-xl font-semibold text-neutral-900 mb-4">Rincian Pengeluaran</h2>
                  {Object.keys(reportData.expense.byCategory).length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                      <p>Tidak ada data pengeluaran untuk periode ini</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(reportData.expense.byCategory)
                        .sort(([, a], [, b]) => b - a)
                        .map(([category, amount]) => (
                          <div key={category} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                            <div>
                              <p className="font-medium text-neutral-900">{category}</p>
                              <p className="text-sm text-neutral-600">{getCategoryLabel(category)}</p>
                            </div>
                            <p className="font-semibold text-red-600">{formatCurrency(amount)}</p>
                          </div>
                        ))}
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
