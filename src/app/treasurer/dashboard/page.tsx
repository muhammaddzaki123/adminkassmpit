'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { StatCard, Card } from '@/components/ui/Card';
import { Users, CreditCard, TrendingDown, AlertCircle, TrendingUp, CheckCircle } from 'lucide-react';

export default function TreasurerDashboard() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats] = useState({
    totalIncome: 150000000,
    totalExpense: 45000000,
    unpaidStudents: 45,
    pendingVerification: 12,
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
  }, [router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
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
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Page Title */}
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Dashboard Bendahara</h1>
              <p className="text-neutral-600">Ringkasan keuangan sekolah secara real-time</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
              <StatCard
                title="Total Pemasukan"
                value={formatCurrency(stats.totalIncome)}
                icon={<TrendingUp className="w-6 h-6" />}
                trend="12% dari bulan lalu"
                trendUp={true}
                color="primary"
              />
              <StatCard
                title="Total Pengeluaran"
                value={formatCurrency(stats.totalExpense)}
                icon={<TrendingDown className="w-6 h-6" />}
                trend="5% dari bulan lalu"
                trendUp={false}
                color="accent"
              />
              <StatCard
                title="Siswa Belum Bayar"
                value={`${stats.unpaidStudents} Siswa`}
                icon={<Users className="w-6 h-6" />}
                color="danger"
              />
              <StatCard
                title="Perlu Verifikasi"
                value={`${stats.pendingVerification} Item`}
                icon={<AlertCircle className="w-6 h-6" />}
                color="info"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold mb-4 text-neutral-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Pembayaran Terbaru
                </h3>
                <div className="space-y-4">
                  {[
                    { name: 'Ahmad Zaki', kelas: '7A', amount: 500000, type: 'SPP November 2024' },
                    { name: 'Siti Aisyah', kelas: '8B', amount: 500000, type: 'SPP November 2024' },
                    { name: 'Muhammad Rizki', kelas: '9C', amount: 500000, type: 'SPP November 2024' },
                  ].map((payment, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{payment.name} - {payment.kelas}</p>
                          <p className="text-xs text-neutral-600">{payment.type}</p>
                        </div>
                      </div>
                      <span className="text-green-600 font-semibold">+ {formatCurrency(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold mb-4 text-neutral-900 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  Pengeluaran Terbaru
                </h3>
                <div className="space-y-4">
                  {[
                    { desc: 'Pembelian ATK', amount: 1250000, date: '24 Nov 2024', category: 'Operasional' },
                    { desc: 'Listrik & Air', amount: 850000, date: '23 Nov 2024', category: 'Utilitas' },
                    { desc: 'Honor Guru', amount: 5000000, date: '22 Nov 2024', category: 'Gaji' },
                  ].map((expense, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                          <TrendingDown className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{expense.desc}</p>
                          <p className="text-xs text-neutral-600">{expense.date} • {expense.category}</p>
                        </div>
                      </div>
                      <span className="text-red-600 font-semibold">- {formatCurrency(expense.amount)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
