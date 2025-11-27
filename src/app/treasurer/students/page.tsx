'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Search, Download, AlertCircle } from 'lucide-react';

interface Student {
  id: string;
  nisn: string;
  nama: string;
  kelas: string;
  jenisKelamin: string;
  status: string;
  email?: string;
  noHp?: string;
}

export default function StudentsPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [students, setStudents] = useState<Student[]>([]);
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

    fetchStudents();
  }, [router]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/students');
      const data = await response.json();
      
      if (data.success) {
        setStudents(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = searchQuery === '' || 
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { key: 'nisn', label: 'NISN', width: '15%' },
    { key: 'nama', label: 'Nama Siswa', width: '25%' },
    { key: 'kelas', label: 'Kelas', width: '10%' },
    { key: 'jenisKelamin', label: 'JK', width: '8%' },
    {
      key: 'status',
      label: 'Status',
      width: '12%',
      render: (item: Student) => {
        const statusMap: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'info' }> = {
          ACTIVE: { label: 'Aktif', color: 'success' },
          INACTIVE: { label: 'Nonaktif', color: 'error' },
          GRADUATED: { label: 'Lulus', color: 'info' },
          PENDING_REGISTRATION: { label: 'Pending', color: 'warning' },
        };
        const status = statusMap[item.status] || { label: item.status, color: 'info' as const };
        return <Badge variant={status.color}>{status.label}</Badge>;
      },
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
              <h1 className="text-3xl font-bold text-neutral-900">Data Siswa</h1>
              <p className="text-neutral-600 mt-1">Kelola data siswa dan pembayaran</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card padding="md" className="text-center">
                <p className="text-2xl font-bold text-primary-600">
                  {students.filter(s => s.status === 'ACTIVE').length}
                </p>
                <p className="text-sm text-neutral-600 mt-1">Siswa Aktif</p>
              </Card>
              <Card padding="md" className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {students.filter(s => s.status === 'PENDING_REGISTRATION').length}
                </p>
                <p className="text-sm text-neutral-600 mt-1">Pending Registrasi</p>
              </Card>
              <Card padding="md" className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {students.filter(s => s.status === 'GRADUATED').length}
                </p>
                <p className="text-sm text-neutral-600 mt-1">Lulus</p>
              </Card>
            </div>

            <Card>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Cari nama atau NISN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search className="w-4 h-4" />}
                  />
                </div>
                <div className="w-full md:w-40">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'Semua Status' },
                      { value: 'ACTIVE', label: 'Aktif' },
                      { value: 'INACTIVE', label: 'Nonaktif' },
                      { value: 'GRADUATED', label: 'Lulus' },
                      { value: 'PENDING_REGISTRATION', label: 'Pending' },
                    ]}
                  />
                </div>
                <Button variant="outline" icon={<Download className="w-4 h-4" />}>
                  Export
                </Button>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">Tidak ada siswa ditemukan</p>
                </div>
              ) : (
                <Table
                  columns={columns}
                  data={filteredStudents}
                />
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
