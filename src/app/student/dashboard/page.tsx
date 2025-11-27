'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { StudentHeader } from '@/components/layout/StudentHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CreditCard, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface DashboardStats {
  sppBelumBayar: number;
  sppTerbayar: number;
  totalTagihan: number;
  tunggakan: number;
}

interface StudentData {
  id: string;
  nama: string;
  nisn: string;
  kelas: string;
  virtualAccount: string | null;
  email: string | null;
  noTelp: string | null;
}

interface Transaction {
  id: string;
  paymentType: string;
  amount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
  description: string | null;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    sppBelumBayar: 0,
    sppTerbayar: 0,
    totalTagihan: 0,
    tunggakan: 0,
  });
  const [studentInfo, setStudentInfo] = useState<StudentData | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

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

    // Fetch real student data
    fetchStudentData(user.studentId);
  }, [router]);

  const fetchStudentData = async (studentId: string) => {
    try {
      // Fetch student info
      const studentResponse = await fetch(`/api/students?id=${studentId}`);
      const studentResult = await studentResponse.json();
      
      if (studentResult.success && studentResult.data.length > 0) {
        setStudentInfo(studentResult.data[0]);
      }

      // Fetch transactions
      const transactionsResponse = await fetch(`/api/student/transactions?studentId=${studentId}&limit=5`);
      const transactionsResult = await transactionsResponse.json();
      
      if (transactionsResult.success) {
        setRecentTransactions(transactionsResult.data);
        
        // Calculate stats from real data
        const paidSPP = transactionsResult.data.filter(
          (t: Transaction) => t.paymentType === 'SPP' && t.status === 'PAID'
        ).length;
        
        const unpaidSPP = transactionsResult.data.filter(
          (t: Transaction) => t.paymentType === 'SPP' && t.status !== 'PAID'
        ).length;
        
        const totalUnpaid = transactionsResult.data
          .filter((t: Transaction) => t.status !== 'PAID')
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

        setStats({
          sppBelumBayar: unpaidSPP,
          sppTerbayar: paidSPP,
          totalTagihan: totalUnpaid,
          tunggakan: totalUnpaid
        });
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
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

  if (!studentInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-neutral-900 font-semibold">Data siswa tidak ditemukan</p>
          <p className="text-neutral-600 mt-2">Silakan hubungi administrator</p>
        </div>
      </div>
    );
  }

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
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Section */}
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">
                Selamat Datang, {studentInfo.nama}!
              </h1>
              <p className="text-neutral-600 mt-1">
                NISN: {studentInfo.nisn} | Kelas: {studentInfo.kelas}
              </p>
            </div>

            {/* Virtual Account Card */}
            <Card className="bg-linear-to-br from-primary-500 to-primary-600 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-2">Virtual Account Number</p>
                  <p className="text-2xl font-bold tracking-wider mb-4">{studentInfo.virtualAccount}</p>
                  <p className="text-xs opacity-75">Gunakan nomor ini untuk pembayaran via Virtual Account</p>
                </div>
                <CreditCard className="w-12 h-12 opacity-50" />
              </div>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{stats.sppBelumBayar}</p>
                    <p className="text-sm text-neutral-600">SPP Belum Bayar</p>
                  </div>
                </div>
              </Card>

              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{stats.sppTerbayar}</p>
                    <p className="text-sm text-neutral-600">SPP Terbayar</p>
                  </div>
                </div>
              </Card>

              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-neutral-900">{formatCurrency(stats.tunggakan)}</p>
                    <p className="text-sm text-neutral-600">Total Tunggakan</p>
                  </div>
                </div>
              </Card>

              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-neutral-900">{formatCurrency(stats.totalTagihan)}</p>
                    <p className="text-sm text-neutral-600">Total Tagihan</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-neutral-900">Transaksi Terakhir</h2>
                <button 
                  onClick={() => router.push('/student/history')}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Lihat Semua
                </button>
              </div>
              <div className="space-y-3">
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <p>Belum ada transaksi</p>
                  </div>
                ) : (
                  recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition"
                    >
                      <div>
                        <p className="font-medium text-neutral-900">{transaction.paymentType}</p>
                        <p className="text-sm text-neutral-600">
                          {new Date(transaction.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-neutral-900">{formatCurrency(transaction.amount)}</p>
                        <Badge
                          variant={
                            transaction.status === 'PAID'
                              ? 'success'
                              : transaction.status === 'PENDING'
                              ? 'warning'
                              : 'error'
                          }
                        >
                          {transaction.status === 'PAID' ? 'Lunas' : transaction.status === 'PENDING' ? 'Pending' : 'Gagal'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:shadow-lg transition" onClick={() => router.push('/student/spp')}>
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-primary-100 rounded-lg">
                    <CreditCard className="w-8 h-8 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">Bayar SPP</h3>
                    <p className="text-sm text-neutral-600">Bayar tagihan SPP bulanan</p>
                  </div>
                </div>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition" onClick={() => router.push('/student/re-registration')}>
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-green-100 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">Daftar Ulang</h3>
                    <p className="text-sm text-neutral-600">Pembayaran daftar ulang</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
