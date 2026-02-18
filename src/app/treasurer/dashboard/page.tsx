'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { StatCard, Card } from '@/components/ui/Card';
import { CreditCard, TrendingDown, AlertCircle, TrendingUp, CheckCircle, FileText } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api-client';

interface Payment {
  id: string;
  paymentNumber: string;
  amount: number;
  paidAt: string | null;
  status: string;
  billing: {
    student: {
      fullName: string;
      className: string;
    };
    type: string;
  };
}

interface Stats {
  totalIncome: number;
  totalExpense: number;
  overdueBillings: number;
  pendingVerification: number;
  monthlyIncome: number;
  monthlyExpense: number;
  balance: number;
  unpaidAmount: number;
}

export default function TreasurerDashboard() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalIncome: 0,
    totalExpense: 0,
    overdueBillings: 0,
    pendingVerification: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    balance: 0,
    unpaidAmount: 0,
  });
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
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
      
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      // Fetch all billings summary
      const billingsRes = await fetchWithAuth('/api/billing/list');
      if (!billingsRes.ok) {
        throw new Error(`Failed to fetch billings: ${billingsRes.status}`);
      }
      if (!billingsRes.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Expected JSON from billings API');
      }
      const billingsData = await billingsRes.json();
      
      let totalIncome = 0;
      let unpaidAmount = 0;
      let overdueBillings = 0;
      let monthlyIncome = 0;
      
      if (billingsData.success) {
        const summary = billingsData.data.summary;
        totalIncome = summary.totalPaid || 0;
        unpaidAmount = summary.totalOutstanding || 0;
        overdueBillings = summary.statusCounts?.OVERDUE || 0;
        
        // Calculate monthly income (from this month's billings)
        const monthlyBillingsRes = await fetchWithAuth(`/api/billing/list?month=${currentMonth}&year=${currentYear}`);
        if (monthlyBillingsRes.ok && monthlyBillingsRes.headers.get('content-type')?.includes('application/json')) {
          const monthlyBillingsData = await monthlyBillingsRes.json();
          if (monthlyBillingsData.success) {
            monthlyIncome = monthlyBillingsData.data.summary.totalPaid || 0;
          }
        }
      }
      
      // Fetch recent completed payments
      const paymentsRes = await fetchWithAuth('/api/payment/list?status=COMPLETED&limit=5');
      let recentPaymentsList: Payment[] = [];
      if (paymentsRes.ok && paymentsRes.headers.get('content-type')?.includes('application/json')) {
        const paymentsData = await paymentsRes.json();
        if (paymentsData.success) {
          recentPaymentsList = paymentsData.data.payments || [];
        }
      }
      
      // Fetch pending payments for verification
      const pendingRes = await fetchWithAuth('/api/payment/list?status=PENDING');
      let pendingCount = 0;
      if (pendingRes.ok && pendingRes.headers.get('content-type')?.includes('application/json')) {
        const pendingData = await pendingRes.json();
        if (pendingData.success) {
          pendingCount = pendingData.data.total || 0;
        }
      }
      
      // Fetch expenses
      let totalExpense = 0;
      let monthlyExpense = 0;
      const expensesRes = await fetchWithAuth('/api/expenses?status=APPROVED');
      if (expensesRes.ok && expensesRes.headers.get('content-type')?.includes('application/json')) {
        const expensesData = await expensesRes.json();
        if (expensesData.success) {
          const expenses = expensesData.data || [];
          totalExpense = expenses.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);
          
          // Calculate monthly expenses
          monthlyExpense = expenses
            .filter((e: { date?: string }) => {
              if (!e.date) return false;
              const date = new Date(e.date);
              return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
            })
            .reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);
        }
      }
      
      setStats({
        totalIncome,
        totalExpense,
        overdueBillings,
        pendingVerification: pendingCount,
        monthlyIncome,
        monthlyExpense,
        balance: totalIncome - totalExpense,
        unpaidAmount,
      });
      
      setRecentPayments(recentPaymentsList);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      alert('Gagal memuat data dashboard. Silakan refresh halaman.');
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
                trend="Total yang sudah dibayar"
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
                title="Tunggakan"
                value={formatCurrency(stats.unpaidAmount)}
                icon={<AlertCircle className="w-6 h-6" />}
                trend="Tagihan belum dibayar"
                color="danger"
              />
              <StatCard
                title="Perlu Verifikasi"
                value={`${stats.pendingVerification}`}
                icon={<FileText className="w-6 h-6" />}
                trend="Pembayaran pending"
                color="info"
              />
            </div>

            {/* Alert for overdue billings */}
            {stats.overdueBillings > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800">Perhatian! Ada Tagihan Jatuh Tempo</p>
                    <p className="text-sm text-red-700 mt-1">
                      Terdapat {stats.overdueBillings} tagihan yang sudah jatuh tempo. Segera lakukan penagihan ke siswa terkait.
                    </p>
                    <button 
                      onClick={() => router.push('/treasurer/spp?status=OVERDUE')}
                      className="text-sm text-red-800 font-medium underline mt-2 hover:text-red-900"
                    >
                      Lihat Daftar Tunggakan →
                    </button>
                  </div>
                </div>
              </div>
            )}

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
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Pembayaran Terbaru
                </h3>
                <button 
                  onClick={() => router.push('/treasurer/payment')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Lihat Semua
                </button>
              </div>
              {recentPayments.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Belum ada transaksi pembayaran</p>
                  <p className="text-sm mt-1">Pembayaran yang telah diverifikasi akan muncul di sini</p>
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
                            {payment.billing.student.fullName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-neutral-600">
                              {payment.billing.student.className}
                            </span>
                            <span className="text-xs text-neutral-400">•</span>
                            <span className="text-xs text-neutral-600">
                              {payment.billing.type}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">
                            {payment.paidAt && new Date(payment.paidAt).toLocaleDateString('id-ID', {
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
