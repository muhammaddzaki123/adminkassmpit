'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { StatCard, Card } from '@/components/ui/Card';
import { User, CreditCard, BookOpen, Calendar } from 'lucide-react';

export default function ParentDashboard() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== 'PARENT') {
      router.push('/auth/login');
      return;
    }
  }, [router]);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="hidden lg:block">
        <Sidebar userRole="parent" />
      </div>

      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 z-50 lg:hidden">
            <Sidebar userRole="parent" />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Page Title */}
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Dashboard Orang Tua</h1>
              <p className="text-neutral-600">Informasi dan pembayaran siswa</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
              <StatCard
                title="Anak Terdaftar"
                value="2"
                icon={<User className="w-6 h-6" />}
                color="primary"
              />
              <StatCard
                title="Tagihan Aktif"
                value="Rp 1 Juta"
                icon={<CreditCard className="w-6 h-6" />}
                color="warning"
              />
              <StatCard
                title="Kehadiran Bulan Ini"
                value="95%"
                trend="3% dari bulan lalu"
                trendUp={true}
                icon={<BookOpen className="w-6 h-6" />}
                color="accent"
              />
              <StatCard
                title="Acara Mendatang"
                value="3"
                icon={<Calendar className="w-6 h-6" />}
                color="info"
              />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold mb-4 text-neutral-900">Data Siswa</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-neutral-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-neutral-900">Ahmad Zaki</p>
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">Kelas 7A</span>
                    </div>
                    <p className="text-sm text-neutral-600">NISN: 1234567890</p>
                    <div className="mt-3 flex gap-2">
                      <button className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                        Lihat Nilai
                      </button>
                      <button className="flex-1 py-2 bg-neutral-200 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-300 transition-colors">
                        Absensi
                      </button>
                    </div>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-neutral-900">Siti Aisyah</p>
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">Kelas 9B</span>
                    </div>
                    <p className="text-sm text-neutral-600">NISN: 0987654321</p>
                    <div className="mt-3 flex gap-2">
                      <button className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                        Lihat Nilai
                      </button>
                      <button className="flex-1 py-2 bg-neutral-200 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-300 transition-colors">
                        Absensi
                      </button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold mb-4 text-neutral-900">Tagihan & Pembayaran</h3>
                <div className="space-y-4">
                  <div className="p-4 border border-red-200 bg-red-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-neutral-900">SPP November 2024</p>
                        <p className="text-sm text-neutral-600">Ahmad Zaki</p>
                      </div>
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Belum Bayar</span>
                    </div>
                    <p className="text-xl font-bold text-neutral-900 mb-3">Rp 500.000</p>
                    <button className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                      Bayar Sekarang
                    </button>
                  </div>
                  <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-neutral-900">SPP November 2024</p>
                        <p className="text-sm text-neutral-600">Siti Aisyah</p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">Belum Bayar</span>
                    </div>
                    <p className="text-xl font-bold text-neutral-900 mb-3">Rp 500.000</p>
                    <button className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                      Bayar Sekarang
                    </button>
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
