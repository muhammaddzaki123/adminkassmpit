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
}

export default function TreasurerDashboard() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalIncome: 0,
    totalExpense: 0,
    unpaidStudents: 0,
    pendingVerification: 0,
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
      
      // Fetch transactions
      const transactionsRes = await fetch('/api/expenses');
      const transactionsData = await transactionsRes.json();
      
      if (transactionsData.success) {
        const transactions = transactionsData.data || [];
        
        // Calculate stats from real data
        const paidTransactions = transactions.filter((t: Transaction) => t.status === 'PAID');
        const pendingTransactions = transactions.filter((t: Transaction) => t.status === 'PENDING');
        
        const totalIncome = paidTransactions.reduce((sum: number, t: Transaction) => sum + t.amount, 0);
        
        setStats({
          totalIncome,
          totalExpense: 0, // Will be calculated from expense transactions
          unpaidStudents: 0, // Will be fetched from students API
          pendingVerification: pendingTransactions.length,
        });
        
        // Get recent 5 paid transactions
        setRecentPayments(paidTransactions.slice(0, 5));
      }
      
      // Fetch students with unpaid SPP
      const studentsRes = await fetch('/api/students');
      const studentsData = await studentsRes.json();
      
      if (studentsData.success) {
        const students = studentsData.data || [];
        // Count students with UNPAID status or pending payments
        const unpaidCount = students.filter((s: { status: string }) => 
          s.status === 'ACTIVE' // Active students who should pay
        ).length;
        
        setStats(prev => ({
          ...prev,
          unpaidStudents: unpaidCount
        }));
      }
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
                trend="Dari pembayaran lunas"
                trendUp={true}
                color="primary"
              />
              <StatCard
                title="Total Pengeluaran"
                value={formatCurrency(stats.totalExpense)}
                icon={<TrendingDown className="w-6 h-6" />}
                trend="Pengeluaran operasional"
                trendUp={false}
                color="accent"
              />
              <StatCard
                title="Siswa Aktif"
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

            <Card>
              <h3 className="text-lg font-semibold mb-4 text-neutral-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Pembayaran Terbaru
              </h3>
              {recentPayments.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <p>Belum ada pembayaran</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">
                            {payment.student.nama} {payment.student.kelas && `- ${payment.student.kelas}`}
                          </p>
                          <p className="text-xs text-neutral-600">
                            {payment.paymentType} • {new Date(payment.createdAt).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                      <span className="text-green-600 font-semibold">+ {formatCurrency(payment.amount)}</span>
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
