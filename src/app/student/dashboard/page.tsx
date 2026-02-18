'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api-client';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { StudentHeader } from '@/components/layout/StudentHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CreditCard, Clock, CheckCircle, AlertCircle, AlertTriangle, FileText } from 'lucide-react';

interface DashboardStats {
  totalBillings: number;
  unpaidBillings: number;
  overdueBillings: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
}

interface StudentData {
  id: string;
  fullName: string;
  nis: string;
  nisn: string;
  email: string | null;
  phone: string | null;
  className: string;
}

interface Billing {
  id: string;
  billNumber: string;
  type: string;
  description: string | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  month: number | null;
  year: number | null;
  dueDate: string | null;
  createdAt: string;
  payments: {
    id: string;
    paymentNumber: string;
    amount: number;
    paidAt: string;
  }[];
}

export default function StudentDashboard() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalBillings: 0,
    unpaidBillings: 0,
    overdueBillings: 0,
    totalAmount: 0,
    paidAmount: 0,
    remainingAmount: 0,
  });
  const [studentInfo, setStudentInfo] = useState<StudentData | null>(null);
  const [recentBillings, setRecentBillings] = useState<Billing[]>([]);

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

    fetchStudentData();
  }, [router]);

  const fetchStudentData = async () => {
    try {
      // Fetch billings (includes student info)
      const billingsResponse = await fetchWithAuth('/api/billing/student');
      
      if (!billingsResponse.ok) {
        throw new Error(`HTTP error! status: ${billingsResponse.status}`);
      }
      
      const contentType = billingsResponse.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Expected JSON response but got: ' + contentType);
      }
      
      const billingsResult = await billingsResponse.json();
      
      if (billingsResult.success) {
        const { student, billings, summary } = billingsResult.data;
        
        setStudentInfo({
          id: student.id,
          fullName: student.fullName,
          nis: student.nis,
          nisn: student.nisn || '-',
          email: student.email,
          phone: student.phone,
          className: student.className || '-',
        });

        setRecentBillings(billings.slice(0, 5));

        setStats({
          totalBillings: summary.totalBillings,
          unpaidBillings: summary.unpaidBillings,
          overdueBillings: summary.overdueBillings,
          totalAmount: summary.totalAmount,
          paidAmount: summary.paidAmount,
          remainingAmount: summary.remainingAmount,
        });
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      alert('Gagal memuat data. Silakan refresh halaman.');
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

  const getMonthName = (month: number | null): string => {
    if (!month) return '-';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return months[month - 1];
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PARTIAL':
        return 'warning';
      case 'OVERDUE':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Lunas';
      case 'PARTIAL':
        return 'Cicilan';
      case 'OVERDUE':
        return 'Jatuh Tempo';
      case 'BILLED':
        return 'Belum Bayar';
      default:
        return status;
    }
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
                Selamat Datang, {studentInfo.fullName}!
              </h1>
              <p className="text-neutral-600 mt-1">
                NIS: {studentInfo.nis} | Kelas: {studentInfo.className}
              </p>
            </div>

            {/* Alert for overdue billings */}
            {stats.overdueBillings > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800">Perhatian! Ada Tagihan Jatuh Tempo</p>
                    <p className="text-sm text-red-700 mt-1">
                      Anda memiliki {stats.overdueBillings} tagihan yang sudah jatuh tempo. Segera lakukan pembayaran untuk menghindari denda.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{stats.totalBillings}</p>
                    <p className="text-sm text-neutral-600">Total Tagihan</p>
                  </div>
                </div>
              </Card>

              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{stats.unpaidBillings}</p>
                    <p className="text-sm text-neutral-600">Belum Bayar</p>
                  </div>
                </div>
              </Card>

              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{stats.overdueBillings}</p>
                    <p className="text-sm text-neutral-600">Jatuh Tempo</p>
                  </div>
                </div>
              </Card>

              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-neutral-900">{formatCurrency(stats.paidAmount)}</p>
                    <p className="text-sm text-neutral-600">Terbayar</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Outstanding Balance Card */}
            {stats.remainingAmount > 0 && (
              <Card className="bg-linear-to-br from-yellow-500 to-yellow-600 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-2">Total Tunggakan</p>
                    <p className="text-3xl font-bold mb-4">{formatCurrency(stats.remainingAmount)}</p>
                    <p className="text-xs opacity-75">
                      Dari total tagihan {formatCurrency(stats.totalAmount)}
                    </p>
                  </div>
                  <AlertTriangle className="w-12 h-12 opacity-50" />
                </div>
              </Card>
            )}

            {/* Recent Billings */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-neutral-900">Tagihan Terbaru</h2>
                <button 
                  onClick={() => router.push('/student/spp')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Lihat Semua
                </button>
              </div>
              <div className="space-y-3">
                {recentBillings.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Belum ada tagihan</p>
                  </div>
                ) : (
                  recentBillings.map((billing) => (
                    <div
                      key={billing.id}
                      className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
                      onClick={() => router.push(`/student/spp?billingId=${billing.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-neutral-900">{billing.type}</p>
                          <Badge variant={getBadgeVariant(billing.status)}>
                            {getStatusText(billing.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-600">
                          {billing.month && billing.year ? `${getMonthName(billing.month)} ${billing.year}` : billing.billNumber}
                        </p>
                        {billing.dueDate && billing.status !== 'PAID' && (
                          <p className="text-xs text-neutral-500 mt-1">
                            Jatuh tempo: {new Date(billing.dueDate).toLocaleDateString('id-ID')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-neutral-900">{formatCurrency(billing.remainingAmount)}</p>
                        {billing.paidAmount > 0 && billing.status !== 'PAID' && (
                          <p className="text-xs text-green-600 mt-1">
                            Terbayar: {formatCurrency(billing.paidAmount)}
                          </p>
                        )}
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
                    <h3 className="font-semibold text-neutral-900">Lihat & Bayar Tagihan</h3>
                    <p className="text-sm text-neutral-600">Lihat semua tagihan dan lakukan pembayaran</p>
                  </div>
                </div>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition" onClick={() => router.push('/student/history')}>
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-green-100 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">Riwayat Pembayaran</h3>
                    <p className="text-sm text-neutral-600">Lihat riwayat pembayaran</p>
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

