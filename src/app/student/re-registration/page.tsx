'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api-client';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { StudentHeader } from '@/components/layout/StudentHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AlertCircle, ArrowRight, CalendarDays, CheckCircle, CreditCard, Loader2 } from 'lucide-react';

interface Billing {
  id: string;
  billNumber: string;
  type: 'SPP' | 'DAFTAR_ULANG' | string;
  description: string | null;
  month: number | null;
  year: number | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'PAID' | 'PARTIAL' | 'BILLED' | 'OVERDUE' | 'CANCELLED' | 'WAIVED' | string;
  dueDate: string | null;
  billDate: string | null;
}

interface StudentBillingResponse {
  student: {
    id: string;
    fullName: string;
    nisn: string;
    email: string | null;
    phone: string | null;
    currentClass: string;
    academicYear: string;
  };
  billings: Billing[];
  summary: {
    totalBillings: number;
    unpaidBillings: number;
    overdueBillings: number;
    paidBillings: number;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
  };
}

export default function ReRegistrationPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StudentBillingResponse | null>(null);

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

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchWithAuth('/api/billing/student');
        if (!response.ok) {
          const result = await response.json().catch(() => null);
          throw new Error(result?.error || 'Gagal memuat data daftar ulang');
        }

        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Gagal memuat data daftar ulang');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Gagal memuat data daftar ulang';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthName = (month: number | null) => {
    if (!month) return '-';
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return months[month - 1] || '-';
  };

  const getBillingStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Lunas';
      case 'PARTIAL':
        return 'Cicilan';
      case 'OVERDUE':
        return 'Lewat Jatuh Tempo';
      case 'BILLED':
        return 'Belum Dibayar';
      default:
        return status;
    }
  };

  const currentDate = new Date();
  const isJulyWindow = currentDate.getMonth() === 6 && currentDate.getDate() >= 1 && currentDate.getDate() <= 21;
  const currentYear = currentDate.getFullYear();

  const targetBillings = useMemo(() => {
    if (!data) return [] as Billing[];

    const rereg = data.billings.filter((billing) => billing.type === 'DAFTAR_ULANG');
    const julySpp = data.billings.filter(
      (billing) => billing.type === 'SPP' && billing.month === 7 && billing.year === currentYear
    );

    const map = new Map<string, Billing>();
    [...rereg, ...julySpp].forEach((billing) => map.set(billing.id, billing));
    return Array.from(map.values());
  }, [data, currentYear]);

  const unpaidTargetBillings = targetBillings.filter((billing) => ['BILLED', 'OVERDUE', 'PARTIAL'].includes(billing.status));
  const totalToPay = unpaidTargetBillings.reduce((sum, billing) => sum + billing.remainingAmount, 0);
  const totalPaid = targetBillings.reduce((sum, billing) => sum + billing.paidAmount, 0);
  const totalTagihan = targetBillings.reduce((sum, billing) => sum + billing.totalAmount, 0);
  const allPaid = targetBillings.length > 0 && unpaidTargetBillings.length === 0;

  const handleContinuePayment = () => {
    if (unpaidTargetBillings.length === 0) {
      router.push('/student/history');
      return;
    }

    const billingIds = unpaidTargetBillings.map((billing) => billing.id).join(',');
    router.push(`/student/spp?billingIds=${encodeURIComponent(billingIds)}`);
  };

  const openDaysLabel = '1–21 Juli';

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
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Daftar Ulang Kenaikan Kelas</h1>
              <p className="text-neutral-600 mt-1">
                Daftar ulang tahunan siswa lama dilakukan setiap {openDaysLabel} dan digabung dengan pembayaran SPP bulan Juli.
              </p>
            </div>

            {!isJulyWindow && (
              <Card className="border-amber-200 bg-amber-50">
                <div className="flex items-start gap-3">
                  <CalendarDays className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-amber-900">Jadwal Daftar Ulang</h3>
                    <p className="text-amber-700 text-sm mt-1">
                      Pembayaran daftar ulang dibuka setiap tanggal {openDaysLabel}. Di luar periode itu, halaman ini tetap menampilkan tagihan yang sudah tersedia.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {loading ? (
              <Card className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                <p className="text-neutral-600 mt-4">Memuat data daftar ulang...</p>
              </Card>
            ) : error && !data ? (
              <Card className="border-red-200 bg-red-50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-900">Gagal memuat data</h3>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </Card>
            ) : data ? (
              <>
                <Card>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-neutral-900">Data Siswa</h2>
                      <p className="text-sm text-neutral-600">Siswa aktif yang melakukan daftar ulang tahunan</p>
                    </div>
                    <Badge variant={allPaid ? 'success' : unpaidTargetBillings.length > 0 ? 'warning' : 'default'}>
                      {allPaid ? 'Sudah Bayar' : unpaidTargetBillings.length > 0 ? 'Menunggu Pembayaran' : 'Belum Tersedia'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">Nama</p>
                      <p className="font-semibold text-neutral-900 mt-1">{data.student.fullName}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">NISN</p>
                      <p className="font-semibold text-neutral-900 mt-1">{data.student.nisn}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">Kelas Saat Ini</p>
                      <p className="font-semibold text-neutral-900 mt-1">{data.student.currentClass}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">Tahun Ajaran</p>
                      <p className="font-semibold text-neutral-900 mt-1">{data.student.academicYear}</p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-neutral-900">Tagihan Daftar Ulang + SPP Juli</h2>
                      <p className="text-sm text-neutral-600 mt-1">
                        Semua tagihan yang relevan untuk kenaikan kelas akan tampil di sini.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">Total Tagihan</p>
                      <p className="text-2xl font-bold text-neutral-900">{formatCurrency(totalTagihan)}</p>
                    </div>
                  </div>

                  {targetBillings.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600">
                      Belum ada billing daftar ulang atau SPP Juli untuk akun ini. Jika seharusnya sudah aktif, hubungi bendahara.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {targetBillings.map((billing) => (
                        <div key={billing.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-neutral-900">
                                  {billing.type === 'DAFTAR_ULANG' ? 'Daftar Ulang' : 'SPP'}
                                </h3>
                                <Badge variant={billing.status === 'PAID' ? 'success' : billing.status === 'PARTIAL' ? 'warning' : billing.status === 'OVERDUE' ? 'error' : 'default'}>
                                  {getBillingStatusLabel(billing.status)}
                                </Badge>
                              </div>
                              <p className="text-sm text-neutral-600 mt-1">
                                {billing.type === 'SPP'
                                  ? `Periode ${getMonthName(billing.month)} ${billing.year}`
                                  : 'Biaya daftar ulang kenaikan kelas'}
                              </p>
                              <p className="text-xs text-neutral-500 mt-1">Nomor tagihan: {billing.billNumber}</p>
                            </div>
                            <div className="text-left md:text-right">
                              <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">Sisa Bayar</p>
                              <p className="text-xl font-bold text-neutral-900">{formatCurrency(billing.remainingAmount)}</p>
                              <p className="text-xs text-neutral-500 mt-1">Dari {formatCurrency(billing.totalAmount)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 rounded-lg bg-neutral-50 p-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">Sudah Dibayar</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">Harus Dibayar</p>
                      <p className="text-lg font-bold text-amber-600">{formatCurrency(totalToPay)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">Status</p>
                      <p className="text-lg font-bold text-neutral-900">
                        {allPaid ? 'Lunas' : unpaidTargetBillings.length > 0 ? 'Menunggu pembayaran' : 'Belum tersedia'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button
                      fullWidth
                      icon={<CreditCard className="w-5 h-5" />}
                      onClick={handleContinuePayment}
                      disabled={targetBillings.length === 0}
                    >
                      {unpaidTargetBillings.length > 0 ? 'Lanjut ke Pembayaran' : 'Lihat Riwayat Pembayaran'}
                    </Button>
                    <Button
                      fullWidth
                      variant="outline"
                      icon={<ArrowRight className="w-5 h-5" />}
                      onClick={() => router.push('/student/history')}
                    >
                      Riwayat Transaksi
                    </Button>
                  </div>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-green-900">Alur Daftar Ulang Siswa Lama</h3>
                      <p className="text-green-700 text-sm mt-1">
                        Setiap tahun pada tanggal {openDaysLabel}, siswa melakukan daftar ulang kenaikan kelas dan membayar tagihan daftar ulang plus SPP bulan Juli.
                      </p>
                    </div>
                  </div>
                </Card>

                {allPaid && (
                  <Card className="bg-blue-50 border-blue-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <h3 className="font-semibold text-blue-900">Daftar ulang sudah beres</h3>
                        <p className="text-blue-700 text-sm mt-1">
                          Tagihan daftar ulang dan SPP Juli Anda sudah lunas. Jika status belum berubah, silakan sinkronkan riwayat pembayaran.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
