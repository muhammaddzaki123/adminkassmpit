'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, StatCard } from '@/components/ui/Card';
import { fetchWithAuth } from '@/lib/api-client';
import { jsPDF } from 'jspdf';
import {
  ArrowLeft,
  Download,
  Banknote,
  BarChart3,
  BellRing,
  ChevronRight,
  CircleCheckBig,
  Landmark,
  TrendingUp,
  AlertTriangle,
  FileText,
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

type ArrearsReport = {
  summary: {
    totalStudents: number;
    totalOverdueBillings: number;
    totalArrears: number;
  };
  arrears: Array<{
    billingId: string;
    studentName: string;
    billingType: string;
    academicYear: string;
    remainingAmount: number;
    dueDate: string;
    daysOverdue: number;
  }>;
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
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateValue));
}

function safeNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getInvoiceCount(countValue: unknown) {
  if (typeof countValue === 'number') return countValue;
  if (countValue && typeof countValue === 'object') {
    const countObject = countValue as { _all?: number };
    return safeNumber(countObject._all);
  }
  return 0;
}

function buildMonthlyOverview(rows: MonthlyBillingRow[]) {
  return MONTH_LABELS.map((label, index) => {
    let totalAmount = 0;
    let paidAmount = 0;
    let invoiceCount = 0;

    for (const row of rows) {
      if (safeNumber(row.month) !== index + 1) continue;
      totalAmount += safeNumber(row._sum?.totalAmount);
      paidAmount += safeNumber(row._sum?.paidAmount);
      invoiceCount += getInvoiceCount(row._count);
    }

    return {
      label,
      totalAmount,
      paidAmount,
      outstandingAmount: Math.max(totalAmount - paidAmount, 0),
      invoiceCount,
    };
  });
}

export default function HeadmasterReportsPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [billingStats, setBillingStats] = useState<BillingStats | null>(null);
  const [arrearsReport, setArrearsReport] = useState<ArrearsReport | null>(null);

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
  }, [router]);

  useEffect(() => {
    fetchData(selectedYear);
  }, [selectedYear]);

  const fetchData = async (year: number) => {
    try {
      setLoading(true);
      const [billingResponse, arrearsResponse] = await Promise.all([
        fetchWithAuth(`/api/billing/stats?year=${year}`),
        fetchWithAuth('/api/reports/arrears'),
      ]);

      if (billingResponse.ok) {
        const data = await billingResponse.json();
        if (data?.success) setBillingStats(data.data);
      }

      if (arrearsResponse.ok) {
        const data = await arrearsResponse.json();
        setArrearsReport(data);
      }
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
  const arrearsTotal = arrearsReport?.summary.totalArrears || 0;
  const selectedMonthTotal = selectedMonthOverview?.totalAmount || 0;
  const selectedMonthPaid = selectedMonthOverview?.paidAmount || 0;
  const selectedMonthOutstanding = selectedMonthOverview?.outstandingAmount || 0;
  const selectedMonthRate = selectedMonthTotal > 0 ? (selectedMonthPaid / selectedMonthTotal) * 100 : 0;
  const chartPeak = Math.max(...monthlyOverview.map((month) => month.totalAmount), 1);

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const summaryRows = [
      ['Ringkasan', 'Nilai'],
      ['Tahun', String(selectedYear)],
      ['Bulan', selectedMonthLabel],
      ['Total Tagihan', String(selectedMonthTotal)],
      ['Dana Terkumpul', String(selectedMonthPaid)],
      ['Sisa Tagihan', String(selectedMonthOutstanding)],
      ['Rasio Koleksi', `${selectedMonthRate.toFixed(1)}%`],
      ['', ''],
      ['Tren Bulanan', 'Tagihan', 'Terkumpul', 'Sisa', 'Billing'],
      ...monthlyOverview.map((month) => [month.label, String(month.totalAmount), String(month.paidAmount), String(month.outstandingAmount), String(month.invoiceCount)]),
      ['', ''],
      ['Tunggakan Prioritas', 'Siswa', 'Jenis Tagihan', 'Tahun Ajaran', 'Sisa', 'Jatuh Tempo', 'Terlambat (hari)'],
      ...((arrearsReport?.arrears || []).slice(0, 10).map((item) => [item.studentName, item.billingType, item.academicYear, String(item.remainingAmount), formatDate(item.dueDate), String(item.daysOverdue)])),
    ];

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1, h2 { margin: 0 0 12px; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            td, th { border: 1px solid #d1d5db; padding: 8px 10px; font-size: 12px; }
            th { background: #f3f4f6; text-align: left; }
          </style>
        </head>
        <body>
          <h1>Laporan Keuangan Kepala Sekolah</h1>
          <p>Tahun ${selectedYear} · Periode ${selectedMonthLabel}</p>
          <table>
            <tbody>
              ${summaryRows.slice(0, 7).map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td></tr>`).join('')}
            </tbody>
          </table>
          <h2>Tren Bulanan</h2>
          <table>
            <thead><tr><th>Bulan</th><th>Tagihan</th><th>Terkumpul</th><th>Sisa</th><th>Billing</th></tr></thead>
            <tbody>
              ${monthlyOverview.map((month) => `<tr><td>${month.label}</td><td>${month.totalAmount}</td><td>${month.paidAmount}</td><td>${month.outstandingAmount}</td><td>${month.invoiceCount}</td></tr>`).join('')}
            </tbody>
          </table>
          <h2>Tunggakan Prioritas</h2>
          <table>
            <thead><tr><th>Siswa</th><th>Jenis Tagihan</th><th>Tahun Ajaran</th><th>Sisa</th><th>Jatuh Tempo</th><th>Terlambat</th></tr></thead>
            <tbody>
              ${(arrearsReport?.arrears || []).slice(0, 10).map((item) => `<tr><td>${item.studentName}</td><td>${item.billingType}</td><td>${item.academicYear}</td><td>${item.remainingAmount}</td><td>${formatDate(item.dueDate)}</td><td>${item.daysOverdue}</td></tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    downloadFile(`\uFEFF${html}`, `laporan-kepala-sekolah-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.xls`, 'application/vnd.ms-excel;charset=utf-8;');
  };

  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 40;

    doc.setFontSize(16);
    doc.text('Laporan Keuangan Kepala Sekolah', 40, y);
    y += 18;

    doc.setFontSize(10);
    doc.text(`Tahun: ${selectedYear} | Bulan: ${selectedMonthLabel}`, 40, y);
    y += 14;
    doc.text(`Tagihan: ${formatCurrency(selectedMonthTotal)} | Terkumpul: ${formatCurrency(selectedMonthPaid)} | Sisa: ${formatCurrency(selectedMonthOutstanding)}`, 40, y, { maxWidth: pageWidth - 80 });
    y += 20;

    doc.setDrawColor(180);
    doc.line(40, y, pageWidth - 40, y);
    y += 16;

    doc.setFontSize(12);
    doc.text('Tren Bulanan', 40, y);
    y += 14;
    doc.setFontSize(9);
    monthlyOverview.forEach((month) => {
      if (y > 530) {
        doc.addPage();
        y = 40;
      }
      doc.text(`${month.label}: Tagihan ${formatCurrency(month.totalAmount)} | Terkumpul ${formatCurrency(month.paidAmount)} | Sisa ${formatCurrency(month.outstandingAmount)} | Billing ${month.invoiceCount}`, 40, y, { maxWidth: pageWidth - 80 });
      y += 14;
    });

    y += 8;
    doc.setFontSize(12);
    doc.text('Tunggakan Prioritas', 40, y);
    y += 14;
    doc.setFontSize(9);
    (arrearsReport?.arrears || []).slice(0, 10).forEach((item, index) => {
      if (y > 530) {
        doc.addPage();
        y = 40;
      }
      doc.text(`${index + 1}. ${item.studentName} | ${item.billingType} | ${formatCurrency(item.remainingAmount)} | ${formatDate(item.dueDate)} | ${item.daysOverdue} hari`, 40, y, { maxWidth: pageWidth - 80 });
      y += 14;
    });

    doc.save(`laporan-kepala-sekolah-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-neutral-600">Memuat laporan...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="hidden lg:block">
        <Sidebar userRole="headmaster" />
      </div>

      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 z-50 lg:hidden">
            <Sidebar userRole="headmaster" />
          </div>
        </>
      )}

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 border-b border-neutral-200/70 bg-white/90 backdrop-blur-xl shadow-soft px-4 py-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                className="rounded-xl border border-neutral-200 bg-white p-2 text-neutral-600 lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Kepala Sekolah</p>
                <h1 className="text-xl font-bold text-neutral-900 md:text-2xl">Laporan Keuangan Sekolah</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleExportExcel} className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
                <Download className="h-4 w-4" />
                Excel
              </button>
              <button type="button" onClick={handleExportPdf} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-600">
                <FileText className="h-4 w-4" />
                PDF
              </button>
              <Link href="/headmaster" className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Link>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-8">
            <Card className="border-primary-100 bg-white/90 backdrop-blur-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Filter Periode</p>
                  <h2 className="mt-1 text-xl font-bold text-neutral-900">Atur bulan dan tahun laporan</h2>
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
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-700">
                    Periode aktif: {selectedMonthLabel} {selectedYear}
                  </div>
                </div>
              </div>
            </Card>

            <section className="rounded-3xl border border-neutral-200 bg-linear-to-r from-slate-950 via-slate-900 to-primary-700 p-6 text-white shadow-medium md:p-8">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                <Landmark className="h-3.5 w-3.5" />
                Executive Summary
              </p>
              <h2 className="mt-4 text-3xl font-bold md:text-4xl">Ringkasan penerimaan dan tunggakan yang siap dipresentasikan.</h2>
              <p className="mt-3 max-w-3xl text-sm text-white/75 md:text-base">
                Gunakan halaman ini untuk mengecek kesehatan keuangan sekolah secara cepat, termasuk tagihan aktif, koleksi penerimaan, dan sisa piutang yang harus ditindaklanjuti.
              </p>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title={`Tagihan ${selectedMonthLabel}`} value={formatCurrency(selectedMonthTotal)} icon={<Banknote className="h-6 w-6" />} color="primary" trend="Periode aktif" trendUp />
              <StatCard title={`Dana Terkumpul ${selectedMonthLabel}`} value={formatCurrency(selectedMonthPaid)} icon={<CircleCheckBig className="h-6 w-6" />} color="accent" trend="Periode aktif" trendUp />
              <StatCard title={`Sisa ${selectedMonthLabel}`} value={formatCurrency(selectedMonthOutstanding)} icon={<AlertTriangle className="h-6 w-6" />} color="danger" trend="Perlu tindak lanjut" />
              <StatCard title="Rasio Koleksi" value={`${selectedMonthRate.toFixed(1)}%`} icon={<BarChart3 className="h-6 w-6" />} color="info" trend="Performa penerimaan" trendUp={selectedMonthRate >= 80} />
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Card>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Tren Bulanan</p>
                    <h3 className="mt-1 text-2xl font-bold text-neutral-900">Pergerakan penerimaan {selectedYear}</h3>
                  </div>
                  <div className="rounded-2xl bg-primary-50 p-3 text-primary-700">
                    <TrendingUp className="h-5 w-5" />
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
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Catatan Pimpinan</p>
                    <h3 className="mt-1 text-2xl font-bold text-neutral-900">Insight periode {selectedMonthLabel} {selectedYear}</h3>
                  </div>
                  <div className="rounded-2xl bg-primary-50 p-3 text-primary-700">
                    <BellRing className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Koleksi periode</p>
                    <p className="mt-2 text-2xl font-bold text-neutral-900">{selectedMonthRate.toFixed(1)}%</p>
                    <p className="mt-1 text-sm text-neutral-600">Semakin tinggi rasio ini, semakin sehat arus penerimaan sekolah.</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Billing pada periode</p>
                    <p className="mt-2 text-2xl font-bold text-neutral-900">{selectedMonthOverview?.invoiceCount || 0}</p>
                    <p className="mt-1 text-sm text-neutral-600">Gunakan untuk menentukan prioritas follow-up.</p>
                  </div>
                  <div className="rounded-2xl bg-neutral-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-600">Sisa periode</p>
                    <p className="mt-2 text-2xl font-bold text-neutral-900">{formatCurrency(selectedMonthOutstanding)}</p>
                    <p className="mt-1 text-sm text-neutral-600">Nominal ini sebaiknya dibahas dalam rapat evaluasi.</p>
                  </div>
                  <div className="rounded-2xl bg-slate-900 p-4 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Kondisi seluruh tahun</p>
                    <p className="mt-2 text-2xl font-bold">{collectionRate.toFixed(1)}%</p>
                    <p className="mt-1 text-sm text-white/75">Koleksi total tahun berjalan, dengan total piutang {formatCurrency(arrearsTotal)}.</p>
                  </div>
                </div>
              </Card>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}