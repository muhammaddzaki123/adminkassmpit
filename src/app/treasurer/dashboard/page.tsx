'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { StatCard, Card } from '@/components/ui/Card';
import { Users, CreditCard, TrendingDown, AlertCircle, TrendingUp, CheckCircle } from 'lucide-react';

interface Transaction {
  id: string;
  createdAt: string;
  paymentType: string;
  amount: number;
  status: string;
  student: {
    nama: string;
    kelas?: string;
  };
}

interface Stats {
  totalIncome: number;
  totalExpense: number;
  unpaidStudents: number;
  pendingVerification: number;
  monthlyIncome: number;
  monthlyExpense: number;
  balance: number;
}

export default function TreasurerDashboard() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalIncome: 0,
    totalExpense: 0,
    unpaidStudents: 0,
    pendingVerification: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    balance: 0,
  });
  const [recentPayments, setRecentPayments] = useState<Transaction[]>([]);
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

    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch SPP payments (income)
      const paymentsRes = await fetch('/api/spp-payments?status=PAID&limit=100');
      const paymentsData = await paymentsRes.json();
      
      // Fetch expenses
      const expensesRes = await fetch('/api/expenses?status=APPROVED');
      const expensesData = await expensesRes.json();
      
      // Fetch all students
      const studentsRes = await fetch('/api/students');
      const studentsData = await studentsRes.json();
      
      let totalIncome = 0;
      let totalExpense = 0;
      let unpaidStudents = 0;
      let pendingVerification = 0;
      let monthlyIncome = 0;
      let monthlyExpense = 0;
      let recentTransactions: Transaction[] = [];
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      // Calculate total income from paid SPP
      if (paymentsData.success) {
        const payments = paymentsData.data || [];
        totalIncome = payments.reduce((sum: number, p: Transaction) => sum + p.amount, 0);
        
        // Calculate monthly income
        monthlyIncome = payments
          .filter((p: Transaction) => {
            const date = new Date(p.createdAt);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
          })
          .reduce((sum: number, p: Transaction) => sum + p.amount, 0);
        
        // Get recent 5 payments for display
        recentTransactions = payments
          .sort((a: Transaction, b: Transaction) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5);
      }
      
      // Calculate total expenses
      if (expensesData.success) {
        const expenses = expensesData.data || [];
        totalExpense = expenses.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);
        
        // Calculate monthly expenses
        monthlyExpense = expenses
          .filter((e: { date?: string }) => {
            if (!e.date) return false;
            const date = new Date(e.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
          })
          .reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);
      }
      
      // Count active students
      if (studentsData.success) {
        const students = studentsData.data || [];
        unpaidStudents = students.filter((s: { status: string }) => 
          s.status === 'ACTIVE'
        ).length;
      }
      
      // Fetch pending payments for verification
      const pendingRes = await fetch('/api/spp-payments?status=PENDING');
      const pendingData = await pendingRes.json();
      if (pendingData.success) {
        pendingVerification = (pendingData.data || []).length;
      }
      
      setStats({
        totalIncome,
        totalExpense,
        unpaidStudents,
        pendingVerification,
        monthlyIncome,
        monthlyExpense,
        balance: totalIncome - totalExpense,
      });
      
      setRecentPayments(recentTransactions);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Dashboard Bendahara</h1>
              <p className="text-neutral-600">Ringkasan keuangan sekolah secara real-time</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
              <StatCard
                title="Total Pemasukan"
                value={formatCurrency(stats.totalIncome)}
                icon={<TrendingUp className="w-6 h-6" />}
                trend="Dari pembayaran SPP"
                trendUp={true}
                color="primary"
              />
              <StatCard
                title="Total Pengeluaran"
                value={formatCurrency(stats.totalExpense)}
                icon={<TrendingDown className="w-6 h-6" />}
                trend="Operasional sekolah"
                trendUp={false}
                color="accent"
              />
              <StatCard
                title="Siswa Aktif"
                value={`${stats.unpaidStudents}`}
                icon={<Users className="w-6 h-6" />}
                trend="Total siswa terdaftar"
                color="danger"
              />
              <StatCard
                title="Perlu Verifikasi"
                value={`${stats.pendingVerification}`}
                icon={<AlertCircle className="w-6 h-6" />}
                trend="Pembayaran pending"
                color="info"
              />
            </div>

            {/* Ringkasan Bulan Ini */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-linear-to-br from-green-500 to-green-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-1">Pemasukan Bulan Ini</p>
                    <p className="text-3xl font-bold">{formatCurrency(stats.monthlyIncome)}</p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                </div>
              </Card>
              
              <Card className="bg-linear-to-br from-red-500 to-red-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-1">Pengeluaran Bulan Ini</p>
                    <p className="text-3xl font-bold">{formatCurrency(stats.monthlyExpense)}</p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <TrendingDown className="w-8 h-8" />
                  </div>
                </div>
              </Card>
              
              <Card className={`bg-linear-to-br ${stats.balance >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} text-white`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-1">Saldo Total</p>
                    <p className="text-3xl font-bold">{formatCurrency(stats.balance)}</p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                </div>
              </Card>
            </div>

            <Card>
              <h3 className="text-lg font-semibold mb-4 text-neutral-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Transaksi Pembayaran Terbaru
              </h3>
              {recentPayments.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Belum ada transaksi pembayaran</p>
                  <p className="text-sm mt-1">Transaksi yang telah diverifikasi akan muncul di sini</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-linear-to-r from-green-50 to-transparent rounded-xl hover:from-green-100 transition-all border border-green-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-linear-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">
                            {payment.student.nama}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-neutral-600">
                              {payment.student.kelas || 'Kelas tidak tersedia'}
                            </span>
                            <span className="text-xs text-neutral-400">•</span>
                            <span className="text-xs text-neutral-600">
                              {payment.paymentType}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">
                            {new Date(payment.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-green-600 font-bold text-lg">
                          {formatCurrency(payment.amount)}
                        </span>
                        <p className="text-xs text-green-600 font-medium mt-1">+ Pemasukan</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
