'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { StatCard, Card } from '@/components/ui/Card';
import { Users, TrendingUp, FileText, BarChart3 } from 'lucide-react';

export default function HeadmasterDashboard() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="hidden lg:block">
        <Sidebar userRole="headmaster" />
      </div>

      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 z-50 lg:hidden">
            <Sidebar userRole="headmaster" />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Page Title */}
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Dashboard Kepala Sekolah</h1>
              <p className="text-neutral-600">Laporan dan analisis sekolah secara keseluruhan</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
              <StatCard
                title="Total Siswa"
                value="450"
                trend="5% dari tahun lalu"
                trendUp={true}
                icon={<Users className="w-6 h-6" />}
                color="primary"
              />
              <StatCard
                title="Tingkat Kehadiran"
                value="95%"
                trend="2% dari bulan lalu"
                trendUp={true}
                icon={<TrendingUp className="w-6 h-6" />}
                color="accent"
              />
              <StatCard
                title="Laporan Pending"
                value="8"
                icon={<FileText className="w-6 h-6" />}
                color="warning"
              />
              <StatCard
                title="Performa Akademik"
                value="85%"
                trend="3% dari semester lalu"
                trendUp={true}
                icon={<BarChart3 className="w-6 h-6" />}
                color="info"
              />
            </div>

            {/* Quick Access */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold mb-4 text-neutral-900">Akses Cepat</h3>
                <div className="space-y-3">
                  <button className="w-full p-4 bg-neutral-50 hover:bg-primary-50 rounded-xl text-left transition-colors">
                    <p className="font-medium text-neutral-900">Laporan Keuangan</p>
                    <p className="text-sm text-neutral-600">Lihat laporan keuangan bulan ini</p>
                  </button>
                  <button className="w-full p-4 bg-neutral-50 hover:bg-primary-50 rounded-xl text-left transition-colors">
                    <p className="font-medium text-neutral-900">Laporan Akademik</p>
                    <p className="text-sm text-neutral-600">Review performa siswa</p>
                  </button>
                  <button className="w-full p-4 bg-neutral-50 hover:bg-primary-50 rounded-xl text-left transition-colors">
                    <p className="font-medium text-neutral-900">Data Guru & Staff</p>
                    <p className="text-sm text-neutral-600">Kelola data kepegawaian</p>
                  </button>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold mb-4 text-neutral-900">Notifikasi</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Laporan keuangan siap direview</p>
                      <p className="text-xs text-neutral-600">2 jam yang lalu</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Persetujuan anggaran pending</p>
                      <p className="text-xs text-neutral-600">5 jam yang lalu</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Rapat koordinasi terjadwal</p>
                      <p className="text-xs text-neutral-600">1 hari yang lalu</p>
                    </div>
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
