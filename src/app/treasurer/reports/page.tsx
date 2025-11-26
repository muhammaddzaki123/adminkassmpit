'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { FileText, Download, TrendingUp, TrendingDown } from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [reportType, setReportType] = useState('monthly');
  const [month, setMonth] = useState('1');
  const [year, setYear] = useState('2025');

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
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Laporan Keuangan</h1>
                <p className="text-neutral-600 mt-1">Lihat dan unduh laporan keuangan</p>
              </div>
              <Button icon={<Download className="w-4 h-4" />}>
                Export PDF
              </Button>
            </div>

            <Card>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Jenis Laporan</label>
                  <Select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    options={[
                      { value: 'monthly', label: 'Bulanan' },
                      { value: 'yearly', label: 'Tahunan' },
                      { value: 'custom', label: 'Custom' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Bulan</label>
                  <Select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    options={[
                      { value: '1', label: 'Januari' },
                      { value: '2', label: 'Februari' },
                      { value: '3', label: 'Maret' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Tahun</label>
                  <Select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    options={[
                      { value: '2024', label: '2024' },
                      { value: '2025', label: '2025' },
                    ]}
                  />
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-linear-to-br from-green-500 to-green-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Total Pemasukan</p>
                    <p className="text-2xl font-bold">{formatCurrency(150000000)}</p>
                  </div>
                </div>
              </Card>
              <Card className="bg-linear-to-br from-red-500 to-red-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <TrendingDown className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Total Pengeluaran</p>
                    <p className="text-2xl font-bold">{formatCurrency(45000000)}</p>
                  </div>
                </div>
              </Card>
              <Card className="bg-linear-to-br from-blue-500 to-blue-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Saldo</p>
                    <p className="text-2xl font-bold">{formatCurrency(105000000)}</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Rincian Pemasukan</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">SPP</p>
                    <p className="text-sm text-neutral-600">Pembayaran SPP siswa</p>
                  </div>
                  <p className="font-semibold text-green-600">{formatCurrency(120000000)}</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Daftar Ulang</p>
                    <p className="text-sm text-neutral-600">Pembayaran daftar ulang</p>
                  </div>
                  <p className="font-semibold text-green-600">{formatCurrency(30000000)}</p>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Rincian Pengeluaran</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Operasional</p>
                    <p className="text-sm text-neutral-600">Listrik, air, ATK</p>
                  </div>
                  <p className="font-semibold text-red-600">{formatCurrency(15000000)}</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Gaji</p>
                    <p className="text-sm text-neutral-600">Honor guru dan karyawan</p>
                  </div>
                  <p className="font-semibold text-red-600">{formatCurrency(30000000)}</p>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
