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

export default function StudentDashboard() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats] = useState<DashboardStats>({
    sppBelumBayar: 3,
    sppTerbayar: 9,
    totalTagihan: 1500000,
    tunggakan: 1500000,
  });
  const [studentInfo, setStudentInfo] = useState({
    nama: '',
    nisn: '',
    kelas: '',
    virtualAccount: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== 'PARENT') {
      router.push('/auth/login');
      return;
    }

    // Mock student data
    setStudentInfo({
      nama: user.nama,
      nisn: '001234567',
      kelas: '8A',
      virtualAccount: '8888812345678901',
    });
  }, [router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const recentTransactions = [
    { id: 1, type: 'SPP Januari 2025', amount: 500000, status: 'PAID', date: '15 Jan 2025' },
    { id: 2, type: 'SPP Februari 2025', amount: 500000, status: 'PENDING', date: '28 Jan 2025' },
    { id: 3, type: 'Daftar Ulang', amount: 2000000, status: 'PAID', date: '20 Des 2024' },
  ];

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
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition"
                  >
                    <div>
                      <p className="font-medium text-neutral-900">{transaction.type}</p>
                      <p className="text-sm text-neutral-600">{transaction.date}</p>
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
                        {transaction.status === 'PAID' ? 'Lunas' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
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
