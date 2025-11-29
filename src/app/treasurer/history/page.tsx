'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, Filter, AlertCircle } from 'lucide-react';

interface Transaction {
  id: string;
  createdAt: string;
  type: 'income' | 'expense';
  paymentType?: string;
  category?: string;
  amount: number;
  status: string;
  paymentMethod?: string;
  description: string;
  student?: {
    nama: string;
    kelas?: string;
  };
}

export default function HistoryPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

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

    fetchTransactions();
  }, [router]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Fetch both expenses and payments
      const [expensesRes, paymentsRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/spp-payments?status=PAID')
      ]);

      const expensesData = await expensesRes.json();
      const paymentsData = await paymentsRes.json();

      const allTransactions: Transaction[] = [];

      // Process expenses
      if (expensesData.success && expensesData.data) {
        const expenses = expensesData.data.map((expense: any) => ({
          id: expense.id,
          createdAt: expense.date || expense.createdAt,
          type: 'expense' as const,
          category: expense.category,
          amount: expense.amount,
          status: expense.status,
          description: expense.description,
        }));
        allTransactions.push(...expenses);
      }

      // Process payments (income)
      if (paymentsData.success && paymentsData.data) {
        const payments = paymentsData.data.map((payment: any) => ({
          id: payment.id,
          createdAt: payment.paidAt || payment.createdAt,
          type: 'income' as const,
          paymentType: payment.paymentType,
          amount: payment.amount,
          status: payment.status,
          paymentMethod: payment.paymentMethod || 'CASH',
          description: payment.description || `${payment.paymentType} - ${payment.month}/${payment.year}`,
          student: payment.student,
        }));
        allTransactions.push(...payments);
      }

      // Sort by date (newest first)
      allTransactions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredTransactions = transactions.filter(t => {
    const studentName = t.student?.nama || '';
    const matchesSearch = searchQuery === '' || 
      studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || 
      (typeFilter === 'income' && t.type === 'income') ||
      (typeFilter === 'expense' && t.type === 'expense');
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-neutral-600">Memuat data...</p>
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
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Riwayat Transaksi</h1>
              <p className="text-neutral-600 mt-1">Histori semua transaksi keuangan</p>
            </div>

            <Card>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Cari transaksi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search className="w-4 h-4" />}
                  />
                </div>
                <div className="w-40">
                  <Select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'Semua' },
                      { value: 'income', label: 'Pemasukan' },
                      { value: 'expense', label: 'Pengeluaran' },
                    ]}
                  />
                </div>
                <Button variant="outline" icon={<Filter className="w-4 h-4" />}>
                  Filter
                </Button>
              </div>
            </Card>

            <Card>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">Tidak ada transaksi ditemukan</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left p-4 text-sm font-semibold text-neutral-700">Tanggal</th>
                        <th className="text-left p-4 text-sm font-semibold text-neutral-700">Siswa</th>
                        <th className="text-left p-4 text-sm font-semibold text-neutral-700">Jenis</th>
                        <th className="text-left p-4 text-sm font-semibold text-neutral-700">Metode</th>
                        <th className="text-right p-4 text-sm font-semibold text-neutral-700">Jumlah</th>
                        <th className="text-center p-4 text-sm font-semibold text-neutral-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                          <td className="p-4 text-sm text-neutral-900">
                            {new Date(transaction.createdAt).toLocaleDateString('id-ID')}
                          </td>
                          <td className="p-4 text-sm text-neutral-900">
                            {transaction.student ? (
                              <>
                                <p className="font-medium">{transaction.student.nama}</p>
                                {transaction.student.kelas && (
                                  <p className="text-xs text-neutral-500">{transaction.student.kelas}</p>
                                )}
                              </>
                            ) : (
                              <p className="text-neutral-500 italic">-</p>
                            )}
                          </td>
                          <td className="p-4 text-sm">
                            <Badge variant={transaction.type === 'income' ? 'success' : 'error'}>
                              {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-neutral-600">
                            {transaction.paymentMethod || transaction.category || '-'}
                          </td>
                          <td className="p-4 text-sm text-right font-medium">
                            <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                              {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <Badge variant={
                              transaction.status === 'PAID' || transaction.status === 'APPROVED' ? 'success' : 
                              transaction.status === 'PENDING' ? 'warning' : 'error'
                            }>
                              {transaction.status === 'PAID' || transaction.status === 'APPROVED' ? 'Selesai' : 
                               transaction.status === 'PENDING' ? 'Pending' : 'Gagal'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
