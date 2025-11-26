'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { StatCard, Card } from '@/components/ui/Card';
import { Users, CreditCard, TrendingDown, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f5f6f7]">
      <div className="hidden lg:block">
        <Sidebar userRole="treasurer" />
      </div>

      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 z-50 lg:hidden">
            <Sidebar userRole="treasurer" />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-[#1c1c1c]">Dashboard Bendahara</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Pemasukan"
                value="Rp 150.000.000"
                icon={<CreditCard className="w-6 h-6" />}
                trend="12% dari bulan lalu"
                trendUp={true}
                color="primary"
              />
              <StatCard
                title="Total Pengeluaran"
                value="Rp 45.000.000"
                icon={<TrendingDown className="w-6 h-6" />}
                trend="5% dari bulan lalu"
                trendUp={false}
                color="warning"
              />
              <StatCard
                title="Siswa Belum Bayar"
                value="45 Siswa"
                icon={<Users className="w-6 h-6" />}
                color="danger"
              />
              <StatCard
                title="Perlu Verifikasi"
                value="12 Item"
                icon={<AlertCircle className="w-6 h-6" />}
                color="info"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold mb-4 text-[#1c1c1c]">Pembayaran Terbaru</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-[#f9fafb] rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#7ec242]/10 rounded-full flex items-center justify-center text-[#7ec242]">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1c1c1c]">Ahmad Zaki</p>
                          <p className="text-xs text-[#6b7280]">SPP November 2024</p>
                        </div>
                      </div>
                      <span className="text-[#10b981] font-medium">+ Rp 500.000</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold mb-4 text-[#1c1c1c]">Pengeluaran Terbaru</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-[#f9fafb] rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#f59e0b]/10 rounded-full flex items-center justify-center text-[#f59e0b]">
                          <TrendingDown className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1c1c1c]">Pembelian ATK</p>
                          <p className="text-xs text-[#6b7280]">24 Nov 2024</p>
                        </div>
                      </div>
                      <span className="text-[#ef4444] font-medium">- Rp 1.250.000</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
