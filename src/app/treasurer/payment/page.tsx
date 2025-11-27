'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Plus, Search, Calendar, Download } from 'lucide-react';

export default function PaymentPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                <h1 className="text-3xl font-bold text-neutral-900">Input Pembayaran</h1>
                <p className="text-neutral-600 mt-1">Input pembayaran SPP siswa</p>
              </div>
              <Button icon={<Download className="w-4 h-4" />} variant="outline">
                Export
              </Button>
            </div>

            <Card>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Form Pembayaran</h2>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">NISN / Nama Siswa</label>
                    <Input placeholder="Cari siswa..." icon={<Search className="w-4 h-4" />} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Jenis Pembayaran</label>
                    <Select
                      options={[
                        { value: 'spp', label: 'SPP' },
                        { value: 'daftar-ulang', label: 'Daftar Ulang' },
                        { value: 'lainnya', label: 'Lainnya' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Bulan</label>
                    <Select
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
                      options={[
                        { value: '2024', label: '2024' },
                        { value: '2025', label: '2025' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Jumlah</label>
                    <Input type="number" placeholder="500000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Tanggal Bayar</label>
                    <Input type="date" icon={<Calendar className="w-4 h-4" />} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Keterangan</label>
                  <Input placeholder="Catatan pembayaran (opsional)" />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" icon={<Plus className="w-4 h-4" />}>
                    Simpan Pembayaran
                  </Button>
                  <Button type="button" variant="outline">
                    Reset
                  </Button>
                </div>
              </form>
            </Card>

            <Card>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Pembayaran Terakhir</h2>
              <div className="text-center py-8 text-neutral-500">
                <p>Pembayaran yang ditambahkan akan muncul di sini</p>
                <p className="text-sm mt-2">Data akan diambil dari database secara real-time</p>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
