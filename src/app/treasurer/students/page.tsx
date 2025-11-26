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
import { Plus, Search, Edit, Trash2, Eye, Download } from 'lucide-react';

interface Student {
  id: string;
  nisn: string;
  nama: string;
  kelas: string;
  jenisKelamin: string;
  status: 'AKTIF' | 'LULUS' | 'PINDAH' | 'KELUAR';
  tagihan: number;
  terbayar: number;
}

export default function StudentsPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [kelasFilter, setKelasFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [formData, setFormData] = useState({
    nisn: '',
    nama: '',
    kelas: '7A',
    jenisKelamin: 'L',
    status: 'AKTIF' as const,
  });

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

    // Load dummy data
    setStudents([
      { id: '1', nisn: '001234567', nama: 'Ahmad Zaki', kelas: '7A', jenisKelamin: 'L', status: 'AKTIF', tagihan: 3000000, terbayar: 2500000 },
      { id: '2', nisn: '001234568', nama: 'Siti Aisyah', kelas: '8B', jenisKelamin: 'P', status: 'AKTIF', tagihan: 3000000, terbayar: 3000000 },
      { id: '3', nisn: '001234569', nama: 'Muhammad Rizki', kelas: '9C', jenisKelamin: 'L', status: 'AKTIF', tagihan: 3000000, terbayar: 1500000 },
    ]);
  }, [router]);

  const columns = [
    { key: 'nisn', label: 'NISN', width: '12%' },
    { key: 'nama', label: 'Nama Lengkap', width: '25%' },
    { key: 'kelas', label: 'Kelas', width: '10%' },
    { key: 'jenisKelamin', label: 'JK', width: '8%' },
    {
      key: 'status',
      label: 'Status',
      width: '10%',
      render: (item: Student) => {
        const statusMap = {
          AKTIF: { label: 'Aktif', color: 'success' as const },
          LULUS: { label: 'Lulus', color: 'primary' as const },
          PINDAH: { label: 'Pindah', color: 'warning' as const },
          KELUAR: { label: 'Keluar', color: 'error' as const },
        };
        const status = statusMap[item.status];
        return <Badge variant={status.color}>{status.label}</Badge>;
      },
    },
    {
      key: 'pembayaran',
      label: 'Pembayaran',
      width: '20%',
      render: (item: Student) => (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${item.terbayar >= item.tagihan ? 'bg-green-600' : 'bg-yellow-600'}`}
                style={{ width: `${(item.terbayar / item.tagihan) * 100}%` }}
              ></div>
            </div>
          </div>
          <p className="text-xs text-neutral-600">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.terbayar)} / {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.tagihan)}
          </p>
        </div>
      ),
    },
  ];

  const filteredStudents = students.filter((student) => {
    const matchSearch =
      student.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nisn.includes(searchQuery);
    const matchKelas = kelasFilter === 'all' || student.kelas.startsWith(kelasFilter);
    const matchStatus = statusFilter === 'all' || student.status === statusFilter;
    return matchSearch && matchKelas && matchStatus;
  });

  const handleEdit = (item: Student) => {
    setEditingStudent(item);
    setFormData({
      nisn: item.nisn,
      nama: item.nama,
      kelas: item.kelas,
      jenisKelamin: item.jenisKelamin,
      status: item.status,
    });
    setShowModal(true);
  };

  const handleDelete = (item: Student) => {
    if (confirm(`Hapus siswa ${item.nama}?`)) {
      setStudents(students.filter(s => s.id !== item.id));
    }
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
          <div className="max-w-7xl mx-auto space-y-6">{/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Data Siswa</h1>
                <p className="text-neutral-600 mt-1">Kelola data siswa sekolah</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" icon={<Download className="w-4 h-4" />}>
                  Export
                </Button>
                <Button icon={<Plus className="w-4 h-4" />} onClick={() => {
                  setEditingStudent(null);
                  setFormData({ nisn: '', nama: '', kelas: '7A', jenisKelamin: 'L', status: 'AKTIF' });
                  setShowModal(true);
                }}>
                  Tambah Siswa
                </Button>
              </div>
            </div>

            {/* Filters */}
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
                    value={kelasFilter}
                    onChange={(e) => setKelasFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'Semua Kelas' },
                      { value: '7', label: 'Kelas 7' },
                      { value: '8', label: 'Kelas 8' },
                      { value: '9', label: 'Kelas 9' },
                    ]}
                  />
                </div>
                <div className="w-40">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'Semua Status' },
                      { value: 'AKTIF', label: 'Aktif' },
                      { value: 'LULUS', label: 'Lulus' },
                      { value: 'PINDAH', label: 'Pindah' },
                    ]}
                  />
                </div>
              </div>
            </Card>

            {/* Table */}
            <Card padding="none">
              <Table
                columns={columns}
                data={filteredStudents}
                actions={(item) => (
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Eye className="w-4 h-4" />}
                      onClick={() => alert(`Detail siswa: ${item.nama}`)}
                    >
                      Detail
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit className="w-4 h-4" />}
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-4 h-4" />}
                      onClick={() => handleDelete(item)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Hapus
                    </Button>
                  </div>
                )}
              />
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card padding="md" className="text-center">
                <p className="text-2xl font-bold text-neutral-900">{students.length}</p>
                <p className="text-sm text-neutral-600">Total Siswa</p>
              </Card>
              <Card padding="md" className="text-center">
                <p className="text-2xl font-bold text-green-600">{students.filter(s => s.status === 'AKTIF').length}</p>
                <p className="text-sm text-neutral-600">Siswa Aktif</p>
              </Card>
              <Card padding="md" className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{students.filter(s => s.terbayar < s.tagihan).length}</p>
                <p className="text-sm text-neutral-600">Belum Lunas</p>
              </Card>
              <Card padding="md" className="text-center">
                <p className="text-2xl font-bold text-green-600">{students.filter(s => s.terbayar >= s.tagihan).length}</p>
                <p className="text-sm text-neutral-600">Sudah Lunas</p>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <h2 className="text-xl font-bold text-neutral-900 mb-6">
              {editingStudent ? 'Edit Siswa' : 'Tambah Siswa Baru'}
            </h2>
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              // Handle save
              setShowModal(false);
            }}>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">NISN</label>
                <Input
                  value={formData.nisn}
                  onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Nama Lengkap</label>
                <Input
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Kelas</label>
                  <Select
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    options={[
                      { value: '7A', label: '7A' },
                      { value: '7B', label: '7B' },
                      { value: '8A', label: '8A' },
                      { value: '8B', label: '8B' },
                      { value: '9A', label: '9A' },
                      { value: '9B', label: '9B' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Jenis Kelamin</label>
                  <Select
                    value={formData.jenisKelamin}
                    onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value })}
                    options={[
                      { value: 'L', label: 'Laki-laki' },
                      { value: 'P', label: 'Perempuan' },
                    ]}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                  Batal
                </Button>
                <Button type="submit" className="flex-1">
                  {editingStudent ? 'Simpan' : 'Tambah'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
