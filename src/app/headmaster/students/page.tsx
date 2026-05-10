'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import { fetchWithAuth } from '@/lib/api-client';
import { AlertTriangle, ArrowLeft, ArrowRight, Phone, Users } from 'lucide-react';

type ArrearsReport = {
  summary: {
    totalStudents: number;
    totalOverdueBillings: number;
    totalArrears: number;
  };
  arrears: Array<{
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
  }>;
};

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

export default function HeadmasterStudentsPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
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

    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/reports/arrears');
      if (response.ok) {
        const data = await response.json();
        setArrearsReport(data);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-neutral-600">Memuat data siswa...</p>
      </div>
    );
  }

  const arrears = arrearsReport?.arrears || [];

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
                <ArrowRight className="h-5 w-5" />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Kepala Sekolah</p>
                <h1 className="text-xl font-bold text-neutral-900 md:text-2xl">Data Siswa dan Tunggakan</h1>
              </div>
            </div>
            <Link href="/headmaster" className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-8">
            <section className="rounded-3xl border border-neutral-200 bg-linear-to-r from-slate-950 via-slate-900 to-primary-700 p-6 text-white shadow-medium md:p-8">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white/10 p-3 text-white">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold md:text-4xl">Daftar siswa yang perlu perhatian lebih.</h2>
                  <p className="mt-3 max-w-3xl text-sm text-white/75 md:text-base">
                    Halaman ini membantu kepala sekolah meninjau siswa dengan kewajiban pembayaran yang masih tertunda, sehingga tindak lanjut bisa lebih cepat dan terarah.
                  </p>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Total siswa menunggak</p>
                <p className="mt-2 text-3xl font-bold text-neutral-900">{arrearsReport?.summary.totalStudents || 0}</p>
              </Card>
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Jumlah tagihan terlambat</p>
                <p className="mt-2 text-3xl font-bold text-neutral-900">{arrearsReport?.summary.totalOverdueBillings || 0}</p>
              </Card>
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Total piutang aktif</p>
                <p className="mt-2 text-3xl font-bold text-neutral-900">{formatCurrency(arrearsReport?.summary.totalArrears || 0)}</p>
              </Card>
            </div>

            <Card>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Prioritas</p>
                  <h3 className="mt-1 text-2xl font-bold text-neutral-900">Siswa dengan nominal tunggakan terbesar</h3>
                </div>
                <div className="rounded-2xl bg-red-50 p-3 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {arrears.length > 0 ? (
                  arrears.map((item, index) => (
                    <div key={item.billingId} className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-sm font-bold text-primary-700">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900">{item.studentName}</p>
                          <p className="text-sm text-neutral-600">{item.billingType} · {item.academicYear}</p>
                          <p className="mt-1 text-xs text-neutral-500">Jatuh tempo {formatDate(item.dueDate)} · {item.daysOverdue} hari terlambat</p>
                        </div>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-sm font-semibold text-neutral-900">{formatCurrency(item.remainingAmount)}</p>
                        <p className="text-xs text-neutral-500">NISN {item.nisn}</p>
                        {item.phone && (
                          <p className="mt-1 inline-flex items-center gap-1 text-xs text-neutral-500">
                            <Phone className="h-3.5 w-3.5" />
                            {item.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
                    <Users className="mx-auto h-8 w-8 text-emerald-600" />
                    <p className="mt-3 font-semibold text-neutral-900">Tidak ada siswa dengan tunggakan aktif</p>
                    <p className="mt-1 text-sm text-neutral-600">Data monitoring saat ini aman untuk ditinjau.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}