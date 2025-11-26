'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Search, CheckCircle } from 'lucide-react';

interface ReRegistration {
  id: string;
  nisn: string;
  nama: string;
  kelasSekarang: string;
  kelasNaik: string;
  status: 'LUNAS' | 'BELUM' | 'CICILAN';
  totalTagihan: number;
  terbayar: number;
}

export default function ReRegistrationPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [students] = useState<ReRegistration[]>([
    { id: '1', nisn: '001234567', nama: 'Ahmad Zaki', kelasSekarang: '7A', kelasNaik: '8A', status: 'LUNAS', totalTagihan: 2000000, terbayar: 2000000 },
    { id: '2', nisn: '001234568', nama: 'Siti Aisyah', kelasSekarang: '8B', kelasNaik: '9B', status: 'BELUM', totalTagihan: 2000000, terbayar: 0 },
    { id: '3', nisn: '001234569', nama: 'Muhammad Rizki', kelasSekarang: '9C', kelasNaik: 'Lulus', status: 'CICILAN', totalTagihan: 2000000, terbayar: 1000000 },
  ]);

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

  const columns = [
    { key: 'nisn', label: 'NISN', width: '12%' },
    { key: 'nama', label: 'Nama Siswa', width: '25%' },
    { key: 'kelasSekarang', label: 'Kelas Sekarang', width: '12%' },
    { key: 'kelasNaik', label: 'Naik Ke', width: '12%' },
    {
      key: 'status',
      label: 'Status',
      width: '12%',
      render: (item: ReRegistration) => {
        const statusMap = {
          LUNAS: { label: 'Lunas', color: 'success' as const },
          BELUM: { label: 'Belum Bayar', color: 'error' as const },
          CICILAN: { label: 'Cicilan', color: 'warning' as const },
        };
        const status = statusMap[item.status];
        return <Badge variant={status.color}>{status.label}</Badge>;
      },
    },
    {
      key: 'pembayaran',
      label: 'Pembayaran',
      width: '15%',
      render: (item: ReRegistration) => (
        <div>
          <p className="font-medium text-neutral-900">{formatCurrency(item.terbayar)}</p>
          <p className="text-xs text-neutral-600">dari {formatCurrency(item.totalTagihan)}</p>
        </div>
      ),
    },
  ];

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
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Daftar Ulang</h1>
              <p className="text-neutral-600 mt-1">Kelola pembayaran daftar ulang siswa</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card padding="md" className="text-center">
                <p className="text-2xl font-bold text-green-600">{students.filter(s => s.status === 'LUNAS').length}</p>
                <p className="text-sm text-neutral-600">Sudah Lunas</p>
              </Card>
              <Card padding="md" className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{students.filter(s => s.status === 'CICILAN').length}</p>
                <p className="text-sm text-neutral-600">Cicilan</p>
              </Card>
              <Card padding="md" className="text-center">
                <p className="text-2xl font-bold text-red-600">{students.filter(s => s.status === 'BELUM').length}</p>
                <p className="text-sm text-neutral-600">Belum Bayar</p>
              </Card>
            </div>

            <Card>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Cari nama atau NISN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search className="w-4 h-4" />}
                  />
                </div>
                <div className="w-40">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'Semua Status' },
                      { value: 'LUNAS', label: 'Lunas' },
                      { value: 'BELUM', label: 'Belum Bayar' },
                      { value: 'CICILAN', label: 'Cicilan' },
                    ]}
                  />
                </div>
              </div>
            </Card>

            <Card padding="none">
              <Table
                columns={columns}
                data={students}
                actions={(item) => (
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      icon={<CheckCircle className="w-4 h-4" />}
                      onClick={() => alert(`Input pembayaran untuk ${item.nama}`)}
                    >
                      Bayar
                    </Button>
                  </div>
                )}
              />
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
