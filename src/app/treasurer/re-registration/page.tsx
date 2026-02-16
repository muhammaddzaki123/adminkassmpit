'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Download, AlertCircle } from 'lucide-react';

interface Student {
  id: string;
  nisn: string;
  nama: string;
  kelas?: string;
  kelasNaik?: string;
  reregPaidAt?: string;
  reregFee?: number;
}

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
  const [students, setStudents] = useState<ReRegistration[]>([]);
  const [loading, setLoading] = useState(true);

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

    fetchReRegistrations();
  }, [router]);

  const fetchReRegistrations = async () => {
    try {
      setLoading(true);
      // Fetch students with re-registration status
      const response = await fetch('/api/students?status=AWAITING_REREG');
      if (!response.ok) {
        throw new Error(`Failed to fetch re-registrations: ${response.status}`);
      }
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Expected JSON response');
      }
      const data = await response.json();
      
      if (data.success) {
        // Map students to re-registration format
        const reregStudents = (data.data || []).map((s: Student) => ({
          id: s.id,
          nisn: s.nisn,
          nama: s.nama,
          kelasSekarang: s.kelas || '-',
          kelasNaik: s.kelasNaik || '-',
          status: s.reregPaidAt ? 'LUNAS' : 'BELUM',
          totalTagihan: s.reregFee || 0,
          terbayar: s.reregPaidAt ? (s.reregFee || 0) : 0,
        }));
        setStudents(reregStudents);
      }
    } catch (error) {
      console.error('Error fetching re-registrations:', error);
      alert('Gagal memuat data daftar ulang.');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-neutral-600">Memuat data...</p>
        </div>
      </div>
    );
  }

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
                <p className="text-sm text-neutral-600 mt-1">Sudah Lunas</p>
              </Card>
              <Card padding="md" className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{students.filter(s => s.status === 'CICILAN').length}</p>
                <p className="text-sm text-neutral-600 mt-1">Sedang Cicilan</p>
              </Card>
              <Card padding="md" className="text-center">
                <p className="text-2xl font-bold text-red-600">{students.filter(s => s.status === 'BELUM').length}</p>
                <p className="text-sm text-neutral-600 mt-1">Belum Bayar</p>
              </Card>
            </div>

            <Card>
              <div className="flex justify-end mb-4">
                <Button variant="outline" icon={<Download className="w-4 h-4" />}>
                  Export Data
                </Button>
              </div>

              {students.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">Belum ada siswa yang perlu daftar ulang</p>
                </div>
              ) : (
                <Table
                  columns={columns}
                  data={students}
                />
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
