'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatCard, Card } from '@/components/ui/Card';
import { fetchWithAuth } from '@/lib/api-client';
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BarChart3,
  BellRing,
  ChevronRight,
  CircleCheckBig,
  ClipboardList,
  Landmark,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';

type MonthlyBillingRow = {
  month: number;
  status: string;
  _count?: number | { _all?: number };
  _sum?: {
    totalAmount?: number | null;
    paidAmount?: number | null;
  };
};

type BillingStats = {
  totalBilled: number;
  totalPaid: number;
  totalPartial: number;
  totalOverdue: number;
  totalAmount: number;
  totalPaidAmount: number;
  monthlyBillings: MonthlyBillingRow[];
};

type ArrearsItem = {
  billingId: string;
  studentId: string;
  studentName: string;
  nisn: string;
  phone: string | null;
  billingType: string;
  academicYear: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  daysOverdue: number;
  status: string;
};

type ArrearsReport = {
  summary: {
    totalStudents: number;
    totalOverdueBillings: number;
    totalArrears: number;
  };
  arrears: ArrearsItem[];
};

type UserProfile = {
  nama: string;
  role: string;
};

type MonthOverview = {
  label: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  invoiceCount: number;
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, index) => CURRENT_YEAR - 2 + index);

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateValue: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateValue));
}

function safeNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getInvoiceCount(countValue: unknown) {
  if (typeof countValue === 'number') {
    return countValue;
  }

  if (countValue && typeof countValue === 'object') {
    const countObject = countValue as { _all?: number };
    return safeNumber(countObject._all);
  }

  return 0;
}

function buildMonthlyOverview(rows: MonthlyBillingRow[]) {
  const summaries: MonthOverview[] = MONTH_LABELS.map((label) => ({
    label,
    totalAmount: 0,
    paidAmount: 0,
    outstandingAmount: 0,
    invoiceCount: 0,
  }));

  for (const row of rows) {
    const monthIndex = safeNumber(row.month) - 1;
    if (monthIndex < 0 || monthIndex >= summaries.length) {
      continue;
    }

    const totalAmount = safeNumber(row._sum?.totalAmount);
    const paidAmount = safeNumber(row._sum?.paidAmount);

    summaries[monthIndex].totalAmount += totalAmount;
    summaries[monthIndex].paidAmount += paidAmount;
    summaries[monthIndex].outstandingAmount += Math.max(totalAmount - paidAmount, 0);
    summaries[monthIndex].invoiceCount += getInvoiceCount(row._count);
  }

  return summaries;
}

export default function HeadmasterDashboard() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [billingStats, setBillingStats] = useState<BillingStats | null>(null);
  const [arrearsReport, setArrearsReport] = useState<ArrearsReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== 'HEADMASTER') {
      router.push('/auth/login');
      return;
    }

    setUser(user);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData(selectedYear);
  }, [user, selectedYear]);

  const fetchDashboardData = async (year: number) => {
    setLoading(true);
    const issues: string[] = [];

    try {
      const [billingResponse, arrearsResponse] = await Promise.allSettled([
        fetchWithAuth(`/api/billing/stats?year=${year}`),
        fetchWithAuth('/api/reports/arrears'),
      ]);

      if (billingResponse.status === 'fulfilled') {
        const response = billingResponse.value;
        if (!response.ok) {
          issues.push('statistik keuangan');
        } else if (!response.headers.get('content-type')?.includes('application/json')) {
          issues.push('statistik keuangan');
        } else {
          const data = await response.json();
          if (data?.success) {
            setBillingStats(data.data);
          } else {
            issues.push('statistik keuangan');
          }
        }
      } else {
        issues.push('statistik keuangan');
      }

      if (arrearsResponse.status === 'fulfilled') {
        const response = arrearsResponse.value;
        if (!response.ok) {
          issues.push('laporan tunggakan');
        } else if (!response.headers.get('content-type')?.includes('application/json')) {
          issues.push('laporan tunggakan');
        } else {
          const data = await response.json();
          if (data) {
            setArrearsReport(data);
          } else {
            issues.push('laporan tunggakan');
          }
        }
      } else {
        issues.push('laporan tunggakan');
      }

      if (issues.length === 2) {
        setError('Data dashboard belum dapat dimuat. Silakan coba muat ulang halaman.');
      } else if (issues.length === 1) {
        setError(`Sebagian data belum dimuat: ${issues[0]}. Dashboard tetap menampilkan data yang tersedia.`);
      } else {
        setError(null);
      }
    } catch (fetchError) {
      console.error('Error fetching headmaster dashboard data:', fetchError);
      setError('Terjadi kendala saat memuat dashboard keuangan. Silakan refresh halaman.');
    } finally {
      setLoading(false);
    }
  };

  const monthlyOverview = useMemo(() => buildMonthlyOverview(billingStats?.monthlyBillings || []), [billingStats]);
  const selectedMonthOverview = monthlyOverview[selectedMonth - 1];
  const selectedMonthLabel = MONTH_LABELS[selectedMonth - 1];

  const totalAmount = billingStats?.totalAmount || 0;
  const totalPaidAmount = billingStats?.totalPaidAmount || 0;
  const collectionRate = totalAmount > 0 ? (totalPaidAmount / totalAmount) * 100 : 0;
  const overdueCount = billingStats?.totalOverdue || 0;
  const overdueStudents = arrearsReport?.summary.totalStudents || 0;
  const arrearsTotal = arrearsReport?.summary.totalArrears || 0;
  const topArrears = arrearsReport?.arrears?.slice(0, 5) || [];
  const selectedMonthTotal = selectedMonthOverview?.totalAmount || 0;
  const selectedMonthPaid = selectedMonthOverview?.paidAmount || 0;
  const selectedMonthOutstanding = selectedMonthOverview?.outstandingAmount || 0;
  const selectedMonthRate = selectedMonthTotal > 0 ? (selectedMonthPaid / selectedMonthTotal) * 100 : 0;
  const chartPeak = Math.max(...monthlyOverview.map((month) => month.totalAmount), 1);

  const statusHighlights = [
    collectionRate >= 90
      ? 'Penerimaan sekolah berada pada kondisi sangat sehat.'
      : 'Masih ada ruang untuk mempercepat realisasi pembayaran.',
    overdueCount > 0
      ? `${overdueCount} tagihan sudah jatuh tempo dan perlu tindak lanjut.`
      : 'Tidak ada tagihan jatuh tempo yang tercatat saat ini.',
    overdueStudents > 0
      ? `${overdueStudents} siswa masih memiliki tunggakan aktif.`
      : 'Tidak ada tunggakan aktif pada laporan yang tersedia.',
  ];

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resetPeriod = () => {
    setSelectedMonth(new Date().getMonth() + 1);
    setSelectedYear(CURRENT_YEAR);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
          <p className="mt-4 text-neutral-600">Memuat dashboard kepala sekolah...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-neutral-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-0 h-80 w-80 rounded-full bg-primary-100/50 blur-3xl" />
        <div className="absolute left-0 top-40 h-72 w-72 rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-56 w-56 rounded-full bg-cyan-100/50 blur-3xl" />
      </div>

      <div className="hidden lg:block">
        <Sidebar userRole="headmaster" />
      </div>

      <div className="flex-1 min-w-0">
        {isMobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed left-0 top-0 bottom-0 z-50 lg:hidden">
              <Sidebar userRole="headmaster" />
            </div>
          </>
        )}

        <header className="sticky top-0 z-30 border-b border-neutral-200/70 bg-white/90 shadow-soft backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <button
                  className="rounded-xl border border-neutral-200 bg-white p-2 text-neutral-600 transition-colors active:scale-95 lg:hidden hover:bg-neutral-50"
                  onClick={() => setIsMobileMenuOpen(true)}
                  aria-label="Buka menu"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Kepala Sekolah</p>
                  <h1 className="text-xl font-bold text-neutral-900 md:text-2xl">Dashboard Monitoring Keuangan</h1>
                  <p className="mt-1 text-sm text-neutral-600">Pantau tagihan, penerimaan, dan tunggakan sekolah dalam satu tampilan.</p>
                </div>
              </div>

              <div className="hidden items-center gap-3 sm:flex">
                <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-700">Periode aktif</p>
                  <p className="text-sm font-semibold text-neutral-900">{selectedMonthLabel} {selectedYear}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-700 text-white shadow-medium">
                  <Landmark className="h-5 w-5" />
                </div>
              </div>
            </div>
        </header>

        <main className="relative p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-8">
              {error && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-soft">
                  {error}
                </div>
              )}

              <Card className="border-primary-100 bg-white/90 backdrop-blur-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Filter Periode</p>
                    <h2 className="mt-1 text-xl font-bold text-neutral-900">Tampilkan data berdasarkan bulan dan tahun</h2>
                    <p className="mt-1 text-sm text-neutral-600">Data statistik menyesuaikan tahun yang dipilih, lalu ringkasan kartu fokus ke bulan yang sedang aktif.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[520px]">
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-neutral-600">Bulan</span>
                      <select
                        value={selectedMonth}
                        onChange={(event) => setSelectedMonth(Number(event.target.value))}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                      >
                        {MONTH_LABELS.map((label, index) => (
                          <option key={label} value={index + 1}>{label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-neutral-600">Tahun</span>
                      <select
                        value={selectedYear}
                        onChange={(event) => setSelectedYear(Number(event.target.value))}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                      >
                        {YEAR_OPTIONS.map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={resetPeriod}
                      className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </Card>

              <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-linear-to-r from-slate-950 via-slate-900 to-primary-700 text-white shadow-medium">
                <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1.3fr_0.7fr] lg:p-10">
                  <div className="relative">
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute bottom-0 right-12 h-20 w-20 rounded-full bg-cyan-300/10 blur-2xl" />
                    <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/85">
                      <Sparkles className="h-3.5 w-3.5" />
                      Ringkasan Eksekutif
                    </p>
                    <h2 className="mt-4 max-w-2xl text-3xl font-bold leading-tight md:text-4xl">
                      {user?.nama ? `Selamat datang, ${user.nama}.` : 'Selamat datang.'} Pantau kesehatan keuangan sekolah secara cepat dan terukur.
                    </h2>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-white/75 md:text-base">
                      Dashboard ini menampilkan jumlah tagihan, dana yang sudah terkumpul, tunggakan aktif, dan siswa yang perlu tindak lanjut. Cocok untuk review mingguan atau rapat pimpinan.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => scrollToSection('laporan-keuangan')}
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition-transform hover:-translate-y-0.5"
                      >
                        Lihat tren keuangan
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollToSection('tunggakan')}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
                      >
                        Tinjau tunggakan
                        <AlertTriangle className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollToSection('insight')}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
                      >
                        Insight cepat
                        <ClipboardList className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Tingkat koleksi</p>
                      <div className="mt-2 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-3xl font-bold">{collectionRate.toFixed(1)}%</p>
                          <p className="mt-1 text-sm text-white/75">{formatCurrency(totalPaidAmount)} terkumpul dari {formatCurrency(totalAmount)}</p>
                        </div>
                        <div className="rounded-2xl bg-emerald-400/15 px-3 py-2 text-right">
                          <p className="text-xs text-emerald-100">Tagihan aktif</p>
                          <p className="text-lg font-semibold">{billingStats?.totalBilled || 0}</p>
                        </div>
                      </div>
                      <div className="mt-4 h-3 rounded-full bg-white/15">
                        <div
                          className="h-3 rounded-full bg-linear-to-r from-emerald-300 to-cyan-300"
                          style={{ width: `${Math.min(Math.max(collectionRate, 0), 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-white/10 p-4">
                        <p className="text-xs text-white/65">Periode dipilih</p>
                        <p className="mt-2 text-2xl font-bold">{selectedMonthLabel} {selectedYear}</p>
                        <p className="mt-1 text-xs text-white/75">{selectedMonthOverview?.invoiceCount || 0} billing pada periode ini</p>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-4">
                        <p className="text-xs text-white/65">Koleksi periode</p>
                        <p className="mt-2 text-2xl font-bold">{selectedMonthRate.toFixed(1)}%</p>
                        <p className="mt-1 text-xs text-white/75">{formatCurrency(selectedMonthPaid)} terkumpul</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title={`Tagihan ${selectedMonthLabel}`}
                  value={formatCurrency(selectedMonthTotal)}
                  trend="Periode yang sedang dipilih"
                  trendUp={true}
                  icon={<Banknote className="h-6 w-6" />}
                  color="primary"
                />
                <StatCard
                  title={`Dana Terkumpul ${selectedMonthLabel}`}
                  value={formatCurrency(selectedMonthPaid)}
                  trend="Penerimaan pada periode aktif"
                  trendUp={true}
                  icon={<CircleCheckBig className="h-6 w-6" />}
                  color="accent"
                />
                <StatCard
                  title={`Sisa ${selectedMonthLabel}`}
                  value={formatCurrency(selectedMonthOutstanding)}
                  trend="Tagihan belum lunas pada periode ini"
                  trendUp={false}
                  icon={<AlertTriangle className="h-6 w-6" />}
                  color="danger"
                />
                <StatCard
                  title="Tingkat Koleksi"
                  value={`${selectedMonthRate.toFixed(1)}%`}
                  trend={selectedMonthRate >= 90 ? 'Kondisi sangat sehat' : 'Masih perlu dorongan'}
                  trendUp={selectedMonthRate >= 80}
                  icon={<BarChart3 className="h-6 w-6" />}
                  color="info"
                />
              </section>

              <section id="insight" className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <Card>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Fokus Pimpinan</p>
                      <h3 className="mt-1 text-2xl font-bold text-neutral-900">Analisis cepat keuangan sekolah</h3>
                      <p className="mt-2 text-sm text-neutral-600">Poin yang biasanya paling dibutuhkan kepala sekolah saat memeriksa kondisi keuangan.</p>
                    </div>
                    <div className="rounded-2xl bg-primary-50 p-3 text-primary-700">
                      <BellRing className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {statusHighlights.map((highlight, index) => (
                      <div key={highlight} className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-6 text-neutral-700">{highlight}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-emerald-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Diterima periode ini</p>
                      <p className="mt-2 text-xl font-bold text-neutral-900">{formatCurrency(selectedMonthPaid)}</p>
                    </div>
                    <div className="rounded-2xl bg-amber-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Sisa tagihan periode ini</p>
                      <p className="mt-2 text-xl font-bold text-neutral-900">{formatCurrency(selectedMonthOutstanding)}</p>
                    </div>
                    <div className="rounded-2xl bg-cyan-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Billing periode ini</p>
                      <p className="mt-2 text-xl font-bold text-neutral-900">{selectedMonthOverview?.invoiceCount || 0}</p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Agenda Keuangan</p>
                      <h3 className="mt-1 text-2xl font-bold text-neutral-900">Akses cepat untuk pimpinan</h3>
                    </div>
                    <div className="rounded-2xl bg-neutral-100 p-3 text-neutral-700">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <button
                      type="button"
                      onClick={() => scrollToSection('laporan-keuangan')}
                      className="group flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-left transition-all hover:border-primary-200 hover:bg-primary-50"
                    >
                      <div>
                        <p className="font-semibold text-neutral-900">Laporan penerimaan bulanan</p>
                        <p className="text-sm text-neutral-600">Lihat pola pemasukan per bulan dan status pembayaran.</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-neutral-400 transition-transform group-hover:translate-x-1 group-hover:text-primary-600" />
                    </button>

                    <button
                      type="button"
                      onClick={() => scrollToSection('tunggakan')}
                      className="group flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-left transition-all hover:border-primary-200 hover:bg-primary-50"
                    >
                      <div>
                        <p className="font-semibold text-neutral-900">Daftar tunggakan prioritas</p>
                        <p className="text-sm text-neutral-600">Fokus pada siswa dengan nominal terbesar dan jatuh tempo terlama.</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-neutral-400 transition-transform group-hover:translate-x-1 group-hover:text-primary-600" />
                    </button>

                    <Link
                      href="/headmaster/students"
                      className="group flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-4 transition-all hover:border-primary-200 hover:bg-primary-50"
                    >
                      <div>
                        <p className="font-semibold text-neutral-900">Data siswa terkait billing</p>
                        <p className="text-sm text-neutral-600">Masuk ke daftar siswa untuk pengecekan lanjutan.</p>
                      </div>
                      <Users className="h-5 w-5 text-neutral-400 transition-transform group-hover:scale-110 group-hover:text-primary-600" />
                    </Link>
                  </div>
                </Card>
              </section>

              <section id="laporan-keuangan" className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <Card>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Tren Bulanan</p>
                      <h3 className="mt-1 text-2xl font-bold text-neutral-900">Pergerakan penerimaan {selectedYear}</h3>
                    </div>
                    <div className="rounded-2xl bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-700">
                      {selectedYear}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-12 items-end gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 md:gap-3 md:p-5">
                    {monthlyOverview.map((month) => {
                      const barHeight = Math.max((month.totalAmount / chartPeak) * 220, 12);
                      const paidHeight = month.totalAmount > 0 ? (month.paidAmount / month.totalAmount) * 100 : 0;
                      const isSelected = selectedMonthLabel === month.label;

                      return (
                        <button
                          key={month.label}
                          type="button"
                          onClick={() => setSelectedMonth(MONTH_LABELS.indexOf(month.label) + 1)}
                          className={`col-span-1 flex flex-col items-center justify-end rounded-2xl border px-2 py-3 transition-all ${
                            isSelected ? 'border-primary-300 bg-primary-50 shadow-soft' : 'border-transparent bg-transparent hover:bg-white'
                          }`}
                        >
                          <div className="flex h-60 w-full items-end justify-center">
                            <div className="relative flex h-full w-full max-w-12 items-end justify-center rounded-full bg-white/70">
                              <div
                                className="absolute bottom-0 left-1/2 w-6 -translate-x-1/2 rounded-full bg-linear-to-t from-amber-300 to-amber-100"
                                style={{ height: `${barHeight}px` }}
                              />
                              <div
                                className={`absolute bottom-0 left-1/2 w-6 -translate-x-1/2 rounded-full bg-linear-to-t ${isSelected ? 'from-primary-600 to-cyan-300' : 'from-emerald-500 to-emerald-200'}`}
                                style={{ height: `${Math.max(barHeight * (paidHeight / 100), 8)}px` }}
                              />
                            </div>
                          </div>
                          <div className="mt-3 text-center">
                            <p className={`text-xs font-semibold ${isSelected ? 'text-primary-700' : 'text-neutral-700'}`}>{month.label}</p>
                            <p className="text-[11px] text-neutral-500">{month.invoiceCount}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                    <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Terkumpul</span>
                    <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /> Sisa tagihan</span>
                    <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-primary-500" /> Bulan terpilih</span>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Monitoring Ringkas</p>
                      <h3 className="mt-1 text-2xl font-bold text-neutral-900">Kesehatan periode {selectedMonthLabel} {selectedYear}</h3>
                    </div>
                    <div className="rounded-2xl bg-primary-50 p-3 text-primary-700">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-neutral-900">Rasio koleksi periode</p>
                            <p className="text-xs text-neutral-500">Dana yang sudah diterima dibanding total tagihan bulan aktif</p>
                        </div>
                          <p className="text-2xl font-bold text-neutral-900">{selectedMonthRate.toFixed(1)}%</p>
                      </div>
                      <div className="mt-4 h-3 rounded-full bg-white">
                        <div
                          className="h-3 rounded-full bg-linear-to-r from-primary-500 to-emerald-400"
                            style={{ width: `${Math.min(Math.max(selectedMonthRate, 0), 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-900 p-4 text-white">
                        <p className="text-xs uppercase tracking-[0.16em] text-white/65">Status pembayaran sebagian</p>
                        <p className="mt-2 text-2xl font-bold">{billingStats?.totalPartial || 0}</p>
                        <p className="mt-1 text-sm text-white/75">Tagihan belum lunas tetapi sudah ada pembayaran.</p>
                      </div>
                      <div className="rounded-2xl bg-red-50 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-red-700">Tagihan overdue</p>
                        <p className="mt-2 text-2xl font-bold text-neutral-900">{overdueCount}</p>
                        <p className="mt-1 text-sm text-neutral-600">Perlu follow-up dari wali kelas atau bendahara.</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                          <CircleCheckBig className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900">Ringkasan pimpinan</p>
                          <p className="text-sm text-neutral-600">
                            {collectionRate >= 90
                              ? 'Kondisi keuangan terkendali dan dapat dipresentasikan ke rapat pimpinan.'
                              : 'Disarankan fokus pada tagihan overdue dan siswa dengan sisa pembayaran terbesar.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </section>

              <section id="tunggakan" className="grid grid-cols-1 gap-6 xl:grid-cols-[0.75fr_1.25fr]">
                <Card>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Laporan Tunggakan</p>
                  <h3 className="mt-1 text-2xl font-bold text-neutral-900">Prioritas tindak lanjut</h3>
                  <p className="mt-2 text-sm text-neutral-600">Rekap ini memudahkan kepala sekolah melihat siswa dengan kewajiban yang belum terselesaikan.</p>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl bg-amber-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Total siswa menunggak</p>
                      <p className="mt-2 text-3xl font-bold text-neutral-900">{overdueStudents}</p>
                    </div>
                    <div className="rounded-2xl bg-rose-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">Total nominal tunggakan</p>
                      <p className="mt-2 text-3xl font-bold text-neutral-900">{formatCurrency(arrearsTotal)}</p>
                    </div>
                    <div className="rounded-2xl bg-neutral-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-600">Rata-rata per siswa</p>
                      <p className="mt-2 text-3xl font-bold text-neutral-900">
                        {overdueStudents > 0 ? formatCurrency(arrearsTotal / overdueStudents) : formatCurrency(0)}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Daftar Prioritas</p>
                      <h3 className="mt-1 text-2xl font-bold text-neutral-900">Siswa dengan tunggakan terbesar</h3>
                    </div>
                    <div className="rounded-2xl bg-red-50 p-3 text-red-700">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {topArrears.length > 0 ? (
                      topArrears.map((arrearsItem, index) => (
                        <div key={arrearsItem.billingId} className="flex items-start justify-between gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-sm font-bold text-primary-700">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-neutral-900">{arrearsItem.studentName}</p>
                              <p className="text-sm text-neutral-600">{arrearsItem.billingType} · {arrearsItem.academicYear}</p>
                              <p className="mt-1 text-xs text-neutral-500">Jatuh tempo {formatDate(arrearsItem.dueDate)} · {arrearsItem.daysOverdue} hari terlambat</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-neutral-900">{formatCurrency(arrearsItem.remainingAmount)}</p>
                            <p className="text-xs text-neutral-500">{arrearsItem.nisn}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center">
                        <CircleCheckBig className="mx-auto h-8 w-8 text-emerald-600" />
                        <p className="mt-3 font-semibold text-neutral-900">Tidak ada tunggakan aktif</p>
                        <p className="mt-1 text-sm text-neutral-600">Semua tagihan yang terpantau sudah aman atau belum jatuh tempo.</p>
                      </div>
                    )}
                  </div>
                </Card>
              </section>
            </div>
        </main>
      </div>
    </div>
  );
}
