'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { StudentHeader } from '@/components/layout/StudentHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Input';
import { CheckCircle, Clock, XCircle, Download, Eye } from 'lucide-react';

interface Transaction {
  id: string;
  paymentType: string;
  amount: number;
  adminFee: number;
  totalAmount: number;
  status: 'PAID' | 'PENDING' | 'FAILED' | 'EXPIRED';
  paymentMethod: string;
  description: string;
  vaNumber?: string;
  paidAt?: string;
  expiredAt?: string;
  createdAt: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== 'STUDENT') {
      router.push('/auth/login');
      return;
    }

    fetchTransactions();
  }, [router]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/student/transactions?studentId=student-123');
      const result = await response.json();
      
      if (result.success) {
        setTransactions(result.data);
      }
    } catch (error) {
      console.error('Fetch transactions error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'FAILED':
      case 'EXPIRED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success">Berhasil</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Menunggu</Badge>;
      case 'FAILED':
        return <Badge variant="error">Gagal</Badge>;
      case 'EXPIRED':
        return <Badge variant="error">Kadaluarsa</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredTransactions = transactions.filter((trx) => {
    const matchStatus = filterStatus === 'all' || trx.status === filterStatus;
    const matchType = filterType === 'all' || trx.paymentType === filterType;
    return matchStatus && matchType;
  });

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="hidden lg:block">
        <StudentSidebar />
      </div>

      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 z-50 lg:hidden">
            <StudentSidebar />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <StudentHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto mt-16">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Riwayat Transaksi</h1>
                <p className="text-neutral-600 mt-1">Semua transaksi pembayaran Anda</p>
              </div>
              <Button variant="outline" icon={<Download className="w-4 h-4" />}>
                Export
              </Button>
            </div>

            {/* Filters */}
            <Card>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Status</label>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    options={[
                      { value: 'all', label: 'Semua Status' },
                      { value: 'PAID', label: 'Berhasil' },
                      { value: 'PENDING', label: 'Menunggu' },
                      { value: 'FAILED', label: 'Gagal' },
                    ]}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Jenis</label>
                  <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    options={[
                      { value: 'all', label: 'Semua Jenis' },
                      { value: 'SPP', label: 'SPP' },
                      { value: 'DAFTAR_ULANG', label: 'Daftar Ulang' },
                    ]}
                  />
                </div>
              </div>
            </Card>

            {/* Transactions List */}
            {isLoading ? (
              <Card className="text-center py-12">
                <p className="text-neutral-600">Memuat data...</p>
              </Card>
            ) : filteredTransactions.length === 0 ? (
              <Card className="text-center py-12">
                <p className="text-neutral-600">Belum ada transaksi</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <Card key={transaction.id} padding="md">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 bg-neutral-100 rounded-lg">
                          {getStatusIcon(transaction.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-neutral-900">{transaction.description}</h3>
                            {getStatusBadge(transaction.status)}
                          </div>
                          <div className="space-y-1 text-sm text-neutral-600">
                            <p>ID: {transaction.id}</p>
                            <p>Metode: {transaction.paymentMethod.replace('_', ' ')}</p>
                            {transaction.vaNumber && (
                              <p>VA Number: {transaction.vaNumber}</p>
                            )}
                            <p>
                              Dibuat: {formatDate(transaction.createdAt)}
                            </p>
                            {transaction.paidAt && (
                              <p className="text-green-600 font-medium">
                                Dibayar: {formatDate(transaction.paidAt)}
                              </p>
                            )}
                            {transaction.expiredAt && transaction.status === 'PENDING' && (
                              <p className="text-yellow-600">
                                Berlaku hingga: {formatDate(transaction.expiredAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-neutral-900 mb-2">
                          {formatCurrency(transaction.totalAmount)}
                        </p>
                        <div className="text-xs text-neutral-600 mb-3">
                          <p>Tagihan: {formatCurrency(transaction.amount)}</p>
                          <p>Admin: {formatCurrency(transaction.adminFee)}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<Eye className="w-4 h-4" />}
                        >
                          Detail
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Summary */}
            <Card className="bg-neutral-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-neutral-600 mb-1">Total Transaksi</p>
                  <p className="text-2xl font-bold text-neutral-900">{transactions.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-neutral-600 mb-1">Berhasil</p>
                  <p className="text-2xl font-bold text-green-600">
                    {transactions.filter(t => t.status === 'PAID').length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-neutral-600 mb-1">Total Dibayar</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(
                      transactions
                        .filter(t => t.status === 'PAID')
                        .reduce((sum, t) => sum + t.totalAmount, 0)
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
